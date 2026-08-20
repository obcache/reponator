import * as vscode from 'vscode';
import { ProjectSpec } from './types';

export async function collectProjectSpec(): Promise<ProjectSpec | undefined> {
  const configuredPath = vscode.workspace.getConfiguration('reponator').get<string>('defaultProjectPath') ?? '';
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';

  const parentPath = await vscode.window.showInputBox({
    title: 'Reponator: Create Project',
    prompt: 'Parent folder where the new project folder will be created',
    value: configuredPath || workspacePath,
    ignoreFocusOut: true,
    validateInput: value => value.trim() ? undefined : 'Project path is required.'
  });
  if (parentPath === undefined) {
    return undefined;
  }

  const name = await vscode.window.showInputBox({
    title: 'Reponator: Create Project',
    prompt: 'Project name and GitHub repository name',
    ignoreFocusOut: true,
    validateInput: value => {
      const trimmed = value.trim();
      if (!trimmed) {
        return 'Project name is required.';
      }
      if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) {
        return 'Use only letters, numbers, dots, underscores, and hyphens.';
      }
      if (/^\.+$/.test(trimmed) || trimmed.endsWith('.')) {
        return 'Project name cannot be only dots or end with a dot.';
      }
      return undefined;
    }
  });
  if (name === undefined) {
    return undefined;
  }

  const description = await vscode.window.showInputBox({
    title: 'Reponator: Create Project',
    prompt: 'Project description',
    ignoreFocusOut: true,
    validateInput: value => value.trim() ? undefined : 'Project description is required.'
  });
  if (description === undefined) {
    return undefined;
  }

  const visibility = await vscode.window.showQuickPick(
    [
      { label: 'Private', description: 'Only selected GitHub users can access the repository.', isPrivate: true },
      { label: 'Public', description: 'Anyone can view the repository.', isPrivate: false }
    ],
    {
      title: 'Reponator: Create Project',
      placeHolder: 'Repository visibility',
      ignoreFocusOut: true
    }
  );
  if (!visibility) {
    return undefined;
  }

  return {
    parentPath: parentPath.trim(),
    name: name.trim(),
    description: description.trim(),
    isPrivate: visibility.isPrivate
  };
}
