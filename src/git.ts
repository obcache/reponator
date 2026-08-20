import { GitAuthor, GitHubUser, ScaffoldFile } from './types';
import { execFile } from './process';

export interface LocalCommitResult {
  treeSha: string;
  commitSha: string;
}

export async function getGitAuthor(cwd: string, user: GitHubUser): Promise<GitAuthor> {
  const configuredName = await gitConfig(cwd, 'user.name');
  const configuredEmail = await gitConfig(cwd, 'user.email');
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  return {
    name: configuredName || user.name || user.login,
    email: configuredEmail || user.email || `${user.login}@users.noreply.github.com`,
    date
  };
}

export async function createLocalCommit(
  cwd: string,
  _files: ScaffoldFile[],
  author: GitAuthor,
  message: string
): Promise<LocalCommitResult> {
  await execFile('git', ['init'], { cwd });
  await execFile('git', ['add', '-A'], { cwd });
  const tree = await execFile('git', ['write-tree'], { cwd });
  const treeSha = tree.stdout.trim();
  const commit = await execFile(
    'git',
    ['commit-tree', treeSha, '-m', message],
    {
      cwd,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: author.name,
        GIT_AUTHOR_EMAIL: author.email,
        GIT_AUTHOR_DATE: author.date,
        GIT_COMMITTER_NAME: author.name,
        GIT_COMMITTER_EMAIL: author.email,
        GIT_COMMITTER_DATE: author.date
      }
    }
  );
  return {
    treeSha,
    commitSha: commit.stdout.trim()
  };
}

export async function initializeCleanLocalRepository(cwd: string, cloneUrl: string, commitSha: string): Promise<void> {
  await execFile('git', ['branch', '-M', 'main'], { cwd });
  await execFile('git', ['remote', 'add', 'origin', cloneUrl], { cwd });
  await execFile('git', ['update-ref', 'refs/heads/main', commitSha], { cwd });
  await execFile('git', ['update-ref', 'refs/remotes/origin/main', commitSha], { cwd });
  await execFile('git', ['config', 'branch.main.remote', 'origin'], { cwd });
  await execFile('git', ['config', 'branch.main.merge', 'refs/heads/main'], { cwd });
  await execFile('git', ['reset', '--hard', 'main'], { cwd });
}

async function gitConfig(cwd: string, key: string): Promise<string | undefined> {
  try {
    const result = await execFile('git', ['config', '--global', '--get', key], { cwd });
    return result.stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}
