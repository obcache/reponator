import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { GitAuthor, GitHubUser } from './types';
import { git } from './gitProcess';

export async function getGitAuthor(cwd: string, user: GitHubUser): Promise<GitAuthor> {
  return {
    name: await gitConfig(cwd, 'user.name') || user.name || user.login,
    email: await gitConfig(cwd, 'user.email') || user.email || `${user.login}@users.noreply.github.com`,
    date: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  };
}

export async function initializeLocalRepository(cwd: string, author: GitAuthor): Promise<void> {
  await git(cwd, ['init', '--initial-branch=main']);
  await assertRepositoryRoot(cwd);
  try { await git(cwd, ['rev-parse', '--verify', 'HEAD']); }
  catch { await git(cwd, ['symbolic-ref', 'HEAD', 'refs/heads/main']); }
  await git(cwd, ['config', '--local', 'user.name', author.name]);
  await git(cwd, ['config', '--local', 'user.email', author.email]);
}

export async function attachRemote(cwd: string, cloneUrl: string): Promise<void> {
  await assertRepositoryRoot(cwd);
  const remotes = (await git(cwd, ['remote'])).stdout.trim().split(/\s+/);
  if (remotes.includes('origin')) {
    const previous = (await git(cwd, ['remote', 'get-url', 'origin'])).stdout.trim();
    if (previous !== cloneUrl) throw new Error(`origin already points to ${previous}. Select that repository or correct origin explicitly.`);
  } else {
    await git(cwd, ['remote', 'add', 'origin', cloneUrl]);
  }
  await git(cwd, ['config', 'branch.main.remote', 'origin']);
  await git(cwd, ['config', 'branch.main.merge', 'refs/heads/main']);
}

export async function publishInitialCommit(cwd: string, cloneUrl: string, author: GitAuthor, message: string, token: string): Promise<string> {
  await initializeLocalRepository(cwd, author);
  // Preserve the remote even when committing or network publishing fails.
  await attachRemote(cwd, cloneUrl);
  await git(cwd, ['add', '-A']);
  await git(cwd, ['commit', '-m', message], { env: {
    GIT_AUTHOR_NAME: author.name, GIT_AUTHOR_EMAIL: author.email, GIT_AUTHOR_DATE: author.date,
    GIT_COMMITTER_NAME: author.name, GIT_COMMITTER_EMAIL: author.email, GIT_COMMITTER_DATE: author.date
  } });
  return publishCurrentBranch(cwd, cloneUrl, token);
}

export async function publishCurrentBranch(cwd: string, cloneUrl: string, token: string): Promise<string> {
  await attachRemote(cwd, cloneUrl);
  const branch = (await git(cwd, ['branch', '--show-current'])).stdout.trim();
  if (branch !== 'main') throw new Error(`Current branch is ${branch || 'detached HEAD'}; select main before finishing publication.`);
  const head = (await git(cwd, ['rev-parse', 'HEAD'])).stdout.trim();
  await authenticatedGit(cwd, cloneUrl, token, ['push', '--set-upstream', 'origin', 'main']);
  // Verify the real remote rather than manufacturing a successful tracking ref locally.
  const remote = (await authenticatedGit(cwd, cloneUrl, token, ['ls-remote', 'origin', 'refs/heads/main'])).stdout.trim().split(/\s+/)[0];
  if (remote !== head) throw new Error(`Remote main did not match the published local commit ${head}.`);
  await git(cwd, ['remote', 'set-head', 'origin', 'main']);
  await verifyLocalRepository(cwd, cloneUrl, head);
  return head;
}

export async function verifyLocalRepository(cwd: string, cloneUrl: string, commitSha: string): Promise<void> {
  await assertRepositoryRoot(cwd);
  for (const ref of ['HEAD', 'refs/remotes/origin/main']) {
    if ((await git(cwd, ['rev-parse', ref])).stdout.trim() !== commitSha) throw new Error(`${ref} does not match the published commit.`);
  }
  if ((await git(cwd, ['branch', '--show-current'])).stdout.trim() !== 'main') throw new Error('Local branch is not main.');
  if ((await git(cwd, ['remote', 'get-url', 'origin'])).stdout.trim() !== cloneUrl) throw new Error('Local origin does not match the created repository.');
  if ((await git(cwd, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])).stdout.trim() !== 'origin/main') throw new Error('Local main is not tracking origin/main.');
  if ((await git(cwd, ['status', '--porcelain'])).stdout.trim()) throw new Error('Repository contains uncommitted changes. Review them before syncing.');
}

export async function assertRepositoryRoot(cwd: string): Promise<void> {
  const actual = (await git(cwd, ['rev-parse', '--show-toplevel'])).stdout.trim();
  const canonical = async (path: string) => {
    const result = resolve(await realpath(path));
    return process.platform === 'win32' ? result.toLowerCase() : result;
  };
  if (await canonical(actual) !== await canonical(cwd)) throw new Error(`Git selected ${actual} instead of the project folder ${cwd}.`);
}

export function validateGitHubRemote(url: string): boolean {
  return /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+\.git$/.test(url);
}

async function authenticatedGit(cwd: string, cloneUrl: string, token: string, args: string[]) {
  const auth = Buffer.from(`x-access-token:${token}`).toString('base64');
  try {
    const env: NodeJS.ProcessEnv = { GIT_TERMINAL_PROMPT: '0' };
    if (validateGitHubRemote(cloneUrl)) {
      // Runtime config keeps credentials out of argv, origin URL and .git/config.
      Object.assign(env, {
        GIT_CONFIG_COUNT: '3', GIT_CONFIG_KEY_0: 'credential.helper', GIT_CONFIG_VALUE_0: '',
        GIT_CONFIG_KEY_1: 'http.https://github.com/.extraheader', GIT_CONFIG_VALUE_1: '',
        GIT_CONFIG_KEY_2: `http.${cloneUrl}.extraheader`, GIT_CONFIG_VALUE_2: `AUTHORIZATION: basic ${auth}`
      });
    }
    return await git(cwd, args, { env });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message.split(token || '\0').join('[redacted]').split(auth).join('[redacted]'));
  }
}

async function gitConfig(cwd: string, key: string): Promise<string | undefined> {
  try { return (await git(cwd, ['config', '--global', '--get', key])).stdout.trim() || undefined; }
  catch { return undefined; }
}
