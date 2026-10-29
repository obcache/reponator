import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { ProjectSpec } from './types';
import { availableChoices, choices, defaultFoundation, foundationLabel, foundationSections, normalizeFoundation, ProjectFoundation } from './foundation';
import { validateProjectName } from './validation';

export interface ProjectInput {
  spec: ProjectSpec;
  bootstrapPassword?: string;
}

class Cancelled extends Error {}

export async function collectProjectSpec(): Promise<ProjectInput | undefined> {
  try {
    const configuredPath = vscode.workspace.getConfiguration('reponator').get<string>('defaultProjectPath') ?? '';
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    const parentPath = await requiredInput('Project parent folder', configuredPath || workspacePath);
    const name = await requiredInput('Project / GitHub repository name', '', validateProjectName);
    const displayName = await requiredInput('Application display name', name);
    const description = await requiredInput('Project description', '', value => value.trim().length > 350 ? 'Use 350 characters or fewer.' : undefined);
    const visibility = await select('Repository visibility', [
      { label: 'Private', id: 'private', description: 'Only selected GitHub users have access.' },
      { label: 'Public', id: 'public', description: 'Anyone can view the repository.' }
    ]);
    const stack = await select('Application stack', choices.stack);
    let foundation = defaultFoundation(stack.id as ProjectFoundation['stack']);

    // The review screen exposes every default; edits stay in memory until Create is chosen.
    while (true) {
      const items = foundationSections.map((section, index) => ({
        id: String(index), label: section.title,
        description: section.keys.slice(0, 3).map(key => foundationLabel(key, foundation)).join(' / '),
        detail: section.keys.map(key => `${key}: ${foundationLabel(key, foundation)}`).join('; ')
      }));
      const action = await select('Project foundation - review or edit, then create', [
        ...items,
        { id: 'notes', label: 'Additional foundation constraints', description: foundation.notes || 'Optional: accessibility, deployment or environment constraints.' },
        { id: 'create', label: 'Create project with these choices', description: `${displayName} / ${visibility.id} / ${foundationLabel('stack', foundation)}` }
      ]);
      if (action.id === 'create') break;
      if (action.id === 'notes') {
        const notes = await vscode.window.showInputBox({ title: 'Additional foundation constraints', value: foundation.notes, ignoreFocusOut: true });
        if (notes === undefined) throw new Cancelled();
        foundation.notes = notes.trim();
        continue;
      }
      foundation = await editSection(Number(action.id), foundation);
    }

    let bootstrapPassword: string | undefined;
    if (foundation.authentication !== 'none') {
      foundation.adminUsername = await requiredInput(
        foundation.authentication === 'oidc' ? 'Initial admin identity / group (identity provider allowlist)' : 'Initial administrator username',
        foundation.adminUsername || 'admin',
        value => /^[A-Za-z0-9@._:/-]+$/.test(value) ? undefined : 'Use letters, numbers, @, dots, colons, slashes, underscores or hyphens.'
      );
      if (foundation.adminSetup === 'generate') bootstrapPassword = randomBytes(24).toString('base64url');
      if (foundation.adminSetup === 'password') {
        bootstrapPassword = await vscode.window.showInputBox({
          title: 'Local bootstrap admin password', password: true, ignoreFocusOut: true,
          prompt: 'Saved only in ignored .env.local; the application must rotate it at first sign-in.',
          validateInput: value => value.length >= 15 && !/[\r\n\0]/.test(value) ? undefined : 'Use at least 15 characters on one line.'
        });
        if (bootstrapPassword === undefined) throw new Cancelled();
      }
    }

    return {
      spec: { parentPath, name, displayName, description, isPrivate: visibility.id === 'private', foundation },
      bootstrapPassword
    };
  } catch (error) {
    if (error instanceof Cancelled) return undefined;
    throw error;
  }
}

async function editSection(index: number, original: ProjectFoundation): Promise<ProjectFoundation> {
  let foundation = { ...original };
  const section = foundationSections[index];
  for (let step = 0; step < section.keys.length; step++) {
    const key = section.keys[step];
    const items = availableChoices(key, foundation).map(choice => ({
      ...choice, detail: choice.id === foundation[key] ? 'Current selection' : undefined
    }));
    const selected = await select(`${section.title}: ${key} (${step + 1}/${section.keys.length})`, items, foundation[key], true);
    if (selected.id === '__back') { if (step === 0) return foundation; step -= 2; continue; }
    if (key === 'stack' && selected.id !== foundation.stack) {
      foundation = { ...defaultFoundation(selected.id as ProjectFoundation['stack']), notes: foundation.notes };
    } else {
      Object.assign(foundation, { [key]: selected.id });
    }
    foundation = normalizeFoundation(foundation);
  }
  return foundation;
}

async function requiredInput(prompt: string, value = '', validate?: (value: string) => string | undefined): Promise<string> {
  const result = await vscode.window.showInputBox({
    title: 'Reponator: Create Project', prompt, value, ignoreFocusOut: true,
    validateInput: text => !text.trim() ? 'A value is required.' : validate?.(text.trim())
  });
  if (result === undefined) throw new Cancelled();
  return result.trim();
}

async function select<T extends { id: string; label: string; description?: string; detail?: string }>(
  title: string, items: readonly T[], current?: string, back = false
): Promise<T | { id: '__back'; label: string }> {
  return new Promise((resolve, reject) => {
    const picker = vscode.window.createQuickPick<T>();
    let settled = false;
    picker.title = title;
    picker.ignoreFocusOut = true;
    picker.matchOnDescription = true;
    picker.items = items;
    const active = items.find(item => item.id === current);
    if (active) picker.activeItems = [active];
    if (back) picker.buttons = [vscode.QuickInputButtons.Back];
    const subscriptions = [
      picker.onDidAccept(() => {
        const selected = picker.selectedItems[0];
        if (selected) { settled = true; resolve(selected); picker.hide(); }
      }),
      picker.onDidTriggerButton(() => { settled = true; resolve({ id: '__back', label: 'Back' }); picker.hide(); }),
      picker.onDidHide(() => {
        if (!settled) reject(new Cancelled());
        subscriptions.forEach(subscription => subscription.dispose());
        picker.dispose();
      })
    ];
    picker.show();
  });
}
