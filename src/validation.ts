import { access, stat, writeFile, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFile } from './process';
import { ProjectSpec } from './types';

export async function ensureRequiredGit(): Promise<void> {
  try {
    await execFile('git', ['--version']);
  } catch {
    throw new Error('Git is required on PATH to initialize the local repository.');
  }
}

export async function ensureLocalDestination(spec: ProjectSpec): Promise<string> {
  const parentPath = resolve(spec.parentPath);
  const parentStat = await stat(parentPath).catch(() => undefined);
  if (!parentStat?.isDirectory()) {
    throw new Error(`Project path does not exist or is not a directory: ${parentPath}`);
  }

  await access(parentPath, constants.W_OK).catch(() => {
    throw new Error(`Project path is not writable: ${parentPath}`);
  });

  const probe = join(parentPath, `.reponator-write-test-${Date.now()}.tmp`);
  await writeFile(probe, 'write-test', 'utf8');
  await rm(probe, { force: true });

  const projectPath = join(parentPath, spec.name);
  const existing = await stat(projectPath).catch(() => undefined);
  if (existing) {
    throw new Error(`Target folder already exists: ${projectPath}`);
  }

  return projectPath;
}
