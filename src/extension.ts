import * as vscode from 'vscode';
import { join } from 'node:path';
import { collectProjectSpec } from './input';
import { ensureLocalDestination, ensureRequiredGit } from './validation';
import { GitHubClient } from './github';
import { createScaffoldFiles, writeScaffoldFiles } from './scaffold';
import { createLocalCommit, getGitAuthor, initializeCleanLocalRepository } from './git';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('reponator.createProject', async () => {
      await createProject();
    })
  );
}

export function deactivate(): void {
  // No extension resources require disposal beyond registered subscriptions.
}

async function createProject(): Promise<void> {
  try {
    const spec = await collectProjectSpec();
    if (!spec) {
      return;
    }

    await ensureRequiredGit();
    const projectPath = await ensureLocalDestination(spec);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Creating ${spec.name}`,
        cancellable: false
      },
      async progress => {
        progress.report({ message: 'Requesting GitHub session' });
        const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
        const github = new GitHubClient(session.accessToken);

        progress.report({ message: 'Verifying GitHub account' });
        const user = await github.getCurrentUser();
        await github.assertRepositoryAvailable(user.login, spec.name);

        progress.report({ message: 'Generating scaffold' });
        const files = createScaffoldFiles(spec);
        await writeScaffoldFiles(projectPath, files);

        progress.report({ message: 'Preparing local git commit' });
        const author = await getGitAuthor(projectPath, user);
        const localCommit = await createLocalCommit(projectPath, files, author, 'chore: bootstrap project scaffold');

        progress.report({ message: 'Creating GitHub repository' });
        const repo = await github.createRepository(spec);

        progress.report({ message: 'Publishing initial commit through GitHub API' });
        const remoteCommit = await github.createInitialCommit(user.login, spec.name, files, author, 'chore: bootstrap project scaffold');
        if (remoteCommit.treeSha !== localCommit.treeSha) {
          throw new Error(`Remote tree ${remoteCommit.treeSha} did not match local tree ${localCommit.treeSha}.`);
        }
        if (remoteCommit.commitSha !== localCommit.commitSha) {
          throw new Error(`Remote commit ${remoteCommit.commitSha} did not match local commit ${localCommit.commitSha}.`);
        }

        progress.report({ message: 'Linking local repo to GitHub' });
        await initializeCleanLocalRepository(projectPath, repo.cloneUrl, localCommit.commitSha);

        progress.report({ message: 'Opening project folder' });
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(join(projectPath)), true);
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await vscode.window.showErrorMessage(`Reponator failed: ${message}`);
  }
}
