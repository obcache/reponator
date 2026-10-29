import { ExecFileOptions } from 'node:child_process';
import { execFile, ExecResult } from './process';

export function gitEnvironment(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const env = { ...process.env };
  // An extension host launched from another repo can inherit Git's repository selectors.
  for (const key of Object.keys(env)) if (key.toUpperCase().startsWith('GIT_')) delete env[key];
  return { ...env, ...extra };
}

export function git(cwd: string, args: string[], options: ExecFileOptions = {}): Promise<ExecResult> {
  return execFile('git', ['-C', cwd, ...args], { ...options, cwd, env: gitEnvironment(options.env) });
}
