import * as vscode from 'vscode';
import { mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { collectProjectSpec } from './input';
import { ensureLocalDestination, ensureRequiredGit } from './validation';
import { GitHubClient } from './github';
import { createScaffoldFiles, writeScaffoldFiles } from './scaffold';
import { assertRepositoryRoot, getGitAuthor, initializeLocalRepository, publishInitialCommit, publishCurrentBranch, validateGitHubRemote } from './git';
import { git } from './gitProcess';
import { writeLocalBootstrap } from './localSecrets';
import { completeProjectOpen, openProject } from './workspace';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Reponator');
  let busy = false;
  const run = (operation: () => Promise<void>) => async () => {
    if (busy) { await vscode.window.showInformationMessage('A Reponator operation is already running.'); return; }
    busy = true;
    try { await operation(); }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      output.appendLine(message);
      output.show(true);
      await vscode.window.showErrorMessage(`Reponator: ${message}`);
    } finally { busy = false; }
  };
  context.subscriptions.push(output,
    vscode.commands.registerCommand('reponator.createProject', run(() => createProject(context, output))),
    vscode.commands.registerCommand('reponator.finishPublishing', run(() => finishPublishing(context, output)))
  );
  void completeProjectOpen(context).catch(error => output.appendLine(`Project open: ${String(error)}`));
}

export function deactivate(): void {}

async function createProject(context: vscode.ExtensionContext, output: vscode.OutputChannel): Promise<void> {
  const input = await collectProjectSpec();
  if (!input) return;
  const { spec } = input;
  await ensureRequiredGit();
  const projectPath = await ensureLocalDestination(spec);
  let stage = 'preflight';
  let reserved = false;
  try {
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Creating ${spec.name}`, cancellable: false }, async progress => {
      const report = (message: string) => { stage = message; progress.report({ message }); output.appendLine(message); };
      report('Requesting GitHub session');
      const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
      const github = new GitHubClient(session.accessToken);
      const user = await github.getCurrentUser();
      await github.assertRepositoryAvailable(user.login, spec.name);

      report('Generating project foundation and workflow');
      const files = createScaffoldFiles(spec);
      // Exclusive reservation prevents writing into a folder created during the wizard.
      await mkdir(projectPath);
      reserved = true;
      await writeScaffoldFiles(projectPath, files);
      await writeLocalBootstrap(projectPath, spec, input.bootstrapPassword);
      input.bootstrapPassword = undefined;
      const author = await getGitAuthor(projectPath, user);
      await initializeLocalRepository(projectPath, author);

      report('Creating GitHub repository');
      const repo = await github.createRepository(spec);
      if (!validateGitHubRemote(repo.cloneUrl)) throw new Error('GitHub returned an unexpected clone URL.');
      output.appendLine(`Project: ${projectPath}\nRemote: ${repo.cloneUrl}`);
      report('Assigning origin, committing and publishing main');
      await publishInitialCommit(projectPath, repo.cloneUrl, author, 'chore: bootstrap project foundation', session.accessToken);
      report('Verified project root, origin and published main');
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    output.appendLine(`Failed at ${stage}: ${message}`);
    output.show(true);
    const action = await vscode.window.showErrorMessage(
      `Reponator failed at ${stage}: ${message}${reserved ? ' Local files are preserved. Use Reponator: Finish Publishing Project to retry an existing GitHub repository.' : ''}`,
      ...(reserved ? ['Open Project'] : [])
    );
    if (action === 'Open Project') await openProject(context, projectPath);
    return;
  }
  // Folder opening can end this host, so all work and progress disposal must finish first.
  await openProject(context, projectPath);
}

async function finishPublishing(context: vscode.ExtensionContext, output: vscode.OutputChannel): Promise<void> {
  const folders = await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: 'Select project to finish publishing' });
  if (!folders?.length) return;
  const projectPath = folders[0].fsPath;
  await ensureRequiredGit();
  await access(join(projectPath, '.git'));
  await assertRepositoryRoot(projectPath);
  let origin = '';
  try { origin = (await git(projectPath, ['remote', 'get-url', 'origin'])).stdout.trim(); } catch {}
  const url = await vscode.window.showInputBox({
    title: 'Existing GitHub repository URL', value: origin, ignoreFocusOut: true,
    prompt: 'Finish publishing this local folder to an existing GitHub repository.',
    validateInput: value => validateGitHubRemote(value.trim()) ? undefined : 'Use https://github.com/OWNER/REPO.git'
  });
  if (url === undefined) return;
  await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Finishing project publication' }, async () => {
    const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
    let hasCommit = true;
    try { await git(projectPath, ['rev-parse', '--verify', 'HEAD']); } catch { hasCommit = false; }
    if (hasCommit) {
      if ((await git(projectPath, ['status', '--porcelain'])).stdout.trim()) throw new Error('Commit or stash current changes before finishing publication.');
      await publishCurrentBranch(projectPath, url.trim(), session.accessToken);
    } else {
      const user = await new GitHubClient(session.accessToken).getCurrentUser();
      await publishInitialCommit(projectPath, url.trim(), await getGitAuthor(projectPath, user), 'chore: finish project bootstrap', session.accessToken);
    }
    output.appendLine(`Verified and published: ${projectPath}\nRemote: ${url.trim()}`);
  });
  await openProject(context, projectPath);
}
