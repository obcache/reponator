import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ProjectSpec } from './types';

export async function writeLocalBootstrap(root: string, spec: ProjectSpec, password?: string): Promise<void> {
  if (!password) return;
  const username = spec.foundation?.adminUsername;
  if (!username || !/^[A-Za-z0-9@._:/-]+$/.test(username)) throw new Error('Invalid bootstrap admin identity.');
  const encoded = Buffer.from(password, 'utf8').toString('base64');
  await writeFile(join(root, '.env.local'),
    `# Local-only bootstrap. Decode UTF-8 base64 during enrollment; rotate on first login.\nADMIN_BOOTSTRAP_USERNAME=${username}\nADMIN_BOOTSTRAP_PASSWORD_B64=${encoded}\n`,
    { encoding: 'utf8', flag: 'wx', mode: 0o600 });
}
