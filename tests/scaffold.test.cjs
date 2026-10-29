const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const { choices, defaultFoundation, normalizeFoundation, availableChoices } = require('../dist/foundation');
const { createScaffoldFiles, writeScaffoldFiles } = require('../dist/scaffold');

test('every stack has a consistent foundation; changing users/auth/storage settles dependent choices', () => {
  for (const stack of choices.stack) {
    const initial = normalizeFoundation(defaultFoundation(stack.id));
    for (const user of choices.users) for (const auth of choices.authentication) {
      const f = normalizeFoundation({ ...initial, users: user.id, authentication: auth.id });
      for (const key of Object.keys(choices)) assert(availableChoices(key, f).some(choice => choice.id === f[key]), `${stack.id}/${user.id}/${auth.id}/${key}`);
      assert.deepEqual(normalizeFoundation(f), f);
      if (f.users !== 'single') { assert.notEqual(f.authentication, 'none'); assert(['postgres', 'mysql'].includes(f.storage)); }
      if (f.authentication === 'none') assert.equal(f.adminSetup, 'none');
    }
  }
});

test('scaffold includes complete doctrine, embedded foundation, manifest integrity and runnable workflow tools', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'reponator-scaffold-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const foundation = { ...defaultFoundation(), primarySurface: 'charts', visualStyle: 'industrial' };
  const files = createScaffoldFiles({ name: 'Sample-App', displayName: 'Sample App', description: 'A new app', isPrivate: true, foundation });
  const get = name => files.find(file => file.path === name).content;
  const manifest = JSON.parse(get('tools/project-mgmt/manifest.json'));
  assert.equal(manifest.generatorVersion, require('../package.json').version);
  assert.equal(manifest.foundation.primarySurface, 'charts');
  for (const item of manifest.files) assert.equal(item.sha256, crypto.createHash('sha256').update(get(item.path)).digest('hex'));
  for (const doc of ['docs/PROJECT_FOUNDATION.md', 'docs/developer/project-gravity.md', 'docs/developer/engineering-geometry.md', 'docs/developer/workflow.md']) {
    assert(get('AGENTS.md').includes(doc)); assert(get(doc).length > 500);
  }
  assert(get('AGENTS.md').includes('Electron / React / Vite / TypeScript'));
  assert(!/Handshake|caller_sequence|reject_ingest|V01 ::/.test(get('docs/developer/engineering-geometry.md')));
  assert.equal(JSON.parse(get('.vscode/settings.json'))['terminal.integrated.cwd'], '${workspaceFolder}');
  assert.equal(JSON.parse(get('package.json')).name, 'sample-app');
  await writeScaffoldFiles(root, files);
  await assert.rejects(writeScaffoldFiles(root, files), /EEXIST/);
  const run = (...args) => cp.execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true });
  for (const file of files.filter(file => file.path.endsWith('.js'))) run('--check', path.join(root, file.path));
  assert(run('tools/project-mgmt/ledger.js', 'message').includes('Initial Project Bootstrap'));
  run('tools/project-mgmt/handoff.js', 'test summary');
  assert((await fs.readFile(path.join(root, 'docs/handoffs/HANDOFF.md'), 'utf8')).includes('Project Foundation'));
  for (const dir of ['vendor', 'third_party', '.venv']) {
    await fs.mkdir(path.join(root, dir));
    await fs.writeFile(path.join(root, dir, 'package.json'), JSON.stringify({ version: '9.9.9' }));
  }
  await fs.mkdir(path.join(root, 'installer'));
  await fs.writeFile(path.join(root, 'installer/setup.iss'), '#define MyAppVersion "0.1.0"\nAppVersion={#MyAppVersion}\n');
  run('tools/project-mgmt/version-bump.js', 'patch');
  assert.equal(JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8')).version, '0.1.1');
  assert((await fs.readFile(path.join(root, 'installer/setup.iss'), 'utf8')).includes('"0.1.1"'));
  for (const dir of ['vendor', 'third_party', '.venv']) assert.equal(JSON.parse(await fs.readFile(path.join(root, dir, 'package.json'), 'utf8')).version, '9.9.9');
  run('tools/project-mgmt/version-bump.js', 'minor');
  assert.equal((await fs.readFile(path.join(root, 'VERSION'), 'utf8')).trim(), '0.2.0');
  run('tools/project-mgmt/version-bump.js', 'major');
  assert.equal((await fs.readFile(path.join(root, 'VERSION'), 'utf8')).trim(), '1.0.0');
  const placeholder = cp.spawnSync(process.execPath, ['tools/project-mgmt/stack-command.js', 'build'], { cwd: root, encoding: 'utf8' });
  assert.equal(placeholder.status, 1);
  assert(placeholder.stderr.includes('PROJECT_FOUNDATION.md'));
});
