import * as vscode from 'vscode';
import { access, realpath } from 'node:fs/promises';

const pendingKey = 'reponator.pendingProjectOpen';

export async function openProject(context: vscode.ExtensionContext, path: string): Promise<void> {
  await context.globalState.update(pendingKey, path);
  const current = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (current && await samePath(current, path) && vscode.workspace.workspaceFolders?.length === 1) {
    await completeProjectOpen(context);
    return;
  }
  // Opening a folder may end this extension host; the destination host completes setup.
  await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(path), { forceReuseWindow: true });
}

export async function completeProjectOpen(context: vscode.ExtensionContext): Promise<void> {
  const path = context.globalState.get<string>(pendingKey);
  if (!path) return;
  const folder = vscode.workspace.workspaceFolders?.find(folder => folder.uri.scheme === 'file');
  if (!folder || !await samePath(folder.uri.fsPath, path)) return;
  const extension = vscode.extensions.getExtension<{ getAPI(version: number): { openRepository(uri: vscode.Uri): Promise<unknown> } }>('vscode.git');
  if (extension && vscode.workspace.getConfiguration('git').get('enabled', true)) {
    try {
      const api = extension.isActive ? extension.exports : await extension.activate();
      await api.getAPI(1).openRepository(folder.uri);
    } catch (error) {
      // Terminal setup should still finish if the Git extension is unavailable.
      await vscode.window.showWarningMessage(`Project opened; Git view discovery needs a retry: ${String(error)}`);
    }
  }
  const terminal = vscode.window.createTerminal({ name: 'Reponator Project', cwd: folder.uri });
  terminal.show(true);
  await context.globalState.update(pendingKey, undefined);
  const foundation = vscode.Uri.joinPath(folder.uri, 'docs', 'PROJECT_FOUNDATION.md');
  const document = await access(foundation.fsPath).then(() => foundation, () => vscode.Uri.joinPath(folder.uri, 'README.md'));
  await vscode.window.showTextDocument(document, { preview: false });
}

async function samePath(a: string, b: string): Promise<boolean> {
  const left = await realpath(a);
  const right = await realpath(b);
  return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;
}
