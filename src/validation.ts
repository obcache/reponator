import { access, stat, lstat, writeFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { join, resolve } from 'node:path';
import { git } from './gitProcess';
import { ProjectSpec } from './types';

export async function ensureRequiredGit(): Promise<void> {
  try {
    await git(process.cwd(), ['--version']);
  } catch {
    throw new Error('Git is required on PATH to initialize the local repository.');
  }
}

export async function ensureLocalDestination(spec: ProjectSpec): Promise<string> {
  const nameError = validateProjectName(spec.name);
  if (nameError) throw new Error(nameError);
  const parentPath = resolve(spec.parentPath);
  const parentStat = await stat(parentPath).catch(() => undefined);
  if (!parentStat?.isDirectory()) {
    throw new Error(`Project path does not exist or is not a directory: ${parentPath}`);
  }

  await access(parentPath, constants.W_OK).catch(() => {
    throw new Error(`Project path is not writable: ${parentPath}`);
  });

  const probe = join(parentPath, `.reponator-write-test-${randomUUID()}.tmp`);
  await writeFile(probe, 'write-test', { encoding: 'utf8', flag: 'wx' });
  await rm(probe);

  const projectPath = join(parentPath, spec.name);
  const existing = await lstat(projectPath).catch(error => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (existing) {
    throw new Error(`Target folder already exists: ${projectPath}`);
  }

  return projectPath;
}

export function validateProjectName(name: string): string | undefined {
  if (!name || !/^[A-Za-z0-9._-]+$/.test(name) || name.length > 100 || /^\.+$/.test(name) || name.endsWith('.')) {
    return 'Use 1-100 letters, numbers, dots, underscores or hyphens; no trailing dot.';
  }
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name) || name.toLowerCase() === '.git') return 'This name is reserved by the filesystem or Git.';
  return undefined;
}
