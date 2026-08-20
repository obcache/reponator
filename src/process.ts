import { execFile as execFileCallback, ExecFileOptions } from 'node:child_process';

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export function execFile(command: string, args: string[], options: ExecFileOptions = {}): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFileCallback(command, args, { ...options, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
      if (error) {
        const details = [stderr, stdout].filter(Boolean).join('\n').trim();
        reject(new Error(details || error.message));
        return;
      }
      resolve({ stdout: String(stdout ?? ''), stderr: String(stderr ?? '') });
    });
  });
}
