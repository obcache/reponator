const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const { createScaffoldFiles, writeScaffoldFiles } = require('../dist/scaffold');
const { publishInitialCommit, publishCurrentBranch, verifyLocalRepository } = require('../dist/git');
const { writeLocalBootstrap } = require('../dist/localSecrets');
const { defaultFoundation } = require('../dist/foundation');
const { gitEnvironment } = require('../dist/gitProcess');
const author = { name: 'Reponator Test', email: 'test@example.invalid', date: '2026-10-28T12:00:00Z' };
const raw = (cwd, args) => cp.execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', env: gitEnvironment(), windowsHide: true }).trim();

test('publish selects a new nested repo despite inherited Git paths; remote, upstream and secrets are correct', async t => {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'reponator-integration-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  raw(parent, ['init', '--initial-branch=main']);
  await fs.writeFile(path.join(parent, 'sentinel.txt'), 'parent must remain unchanged\n');
  raw(parent, ['add', 'sentinel.txt']);
  raw(parent, ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'parent']);
  const parentHead = raw(parent, ['rev-parse', 'HEAD']);
  const root = path.join(parent, 'child project');
  const remote = path.join(parent, 'remote.git');
  raw(parent, ['init', '--bare', remote]);
  const foundation = { ...defaultFoundation(), authentication: 'local', authorization: 'rbac', adminSetup: 'password', adminUsername: 'admin' };
  const spec = { name: 'child-project', parentPath: parent, description: 'Integration test', isPrivate: true, foundation };
  await writeScaffoldFiles(root, createScaffoldFiles(spec));
  const secret = 'private-password-value-123';
  await writeLocalBootstrap(root, spec, secret);
  const keys = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_CONFIG_COUNT', 'GIT_CONFIG_PARAMETERS'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { GIT_DIR: path.join(parent, '.git'), GIT_WORK_TREE: parent, GIT_INDEX_FILE: path.join(parent, '.git/index'), GIT_CONFIG_COUNT: '999', GIT_CONFIG_PARAMETERS: 'broken inherited config' });
  let head;
  try { head = await publishInitialCommit(root, remote, author, 'bootstrap', 'test-token'); }
  finally { for (const key of keys) saved[key] === undefined ? delete process.env[key] : process.env[key] = saved[key]; }
  await verifyLocalRepository(root, remote, head);
  assert.equal(raw(remote, ['rev-parse', 'refs/heads/main']), head);
  assert.equal(raw(parent, ['rev-parse', 'HEAD']), parentHead);
  assert.equal(raw(parent, ['diff', '--', 'sentinel.txt']), '');
  assert.equal(raw(root, ['status', '-sb']), '## main...origin/main');
  assert(!raw(root, ['ls-files']).includes('.env.local'));
  assert(raw(root, ['ls-files']).includes('.env.example'));
  assert(!raw(root, ['show', 'HEAD:tools/project-mgmt/manifest.json']).includes(secret));
  assert(!(await fs.readFile(path.join(root, '.git/config'), 'utf8')).includes('test-token'));
});

test('failed publishing preserves origin; finish publishing safely retries without rebuilding the commit', async t => {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'reponator-retry-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'project');
  const remote = path.join(parent, 'temporarily-unavailable.git');
  await writeScaffoldFiles(root, createScaffoldFiles({ name: 'retry', parentPath: parent, description: 'retry test', isPrivate: true }));
  // The old API flow could leave an unborn master with staged files and no refs.
  raw(root, ['init', '--initial-branch=master']);
  await assert.rejects(publishInitialCommit(root, remote, author, 'bootstrap', 'test-token'));
  assert.equal(raw(root, ['remote', 'get-url', 'origin']), remote);
  const head = raw(root, ['rev-parse', 'HEAD']);
  raw(parent, ['init', '--bare', remote]);
  assert.equal(await publishCurrentBranch(root, remote, 'test-token'), head);
  await verifyLocalRepository(root, remote, head);
  await assert.rejects(publishCurrentBranch(root, path.join(parent, 'unrelated.git'), 'test-token'), /origin already points/);
});

test('authentication is process-only and error messages redact the credential', async t => {
  const gitModule = require('../dist/gitProcess');
  const original = gitModule.git;
  const token = 'test-sensitive-token';
  const encoded = Buffer.from('x-access-token:' + token).toString('base64');
  const calls = [];
  gitModule.git = async (_cwd, args, options) => {
    calls.push({ args, options });
    if (args[0] === 'rev-parse' && args[1] === '--show-toplevel') return { stdout: os.tmpdir() };
    if (args[0] === 'remote' && args.length === 1) return { stdout: '' };
    if (args[0] === 'branch') return { stdout: 'main' };
    if (args[0] === 'rev-parse') return { stdout: 'a'.repeat(40) };
    if (args[0] === 'push') throw new Error('network error ' + token + ' ' + encoded);
    return { stdout: '' };
  };
  t.after(() => { gitModule.git = original; });
  await assert.rejects(publishCurrentBranch(os.tmpdir(), 'https://github.com/example/test.git', token), error => {
    assert(!error.message.includes(token)); assert(!error.message.includes(encoded)); return true;
  });
  const push = calls.find(call => call.args[0] === 'push');
  assert(!JSON.stringify(push.args).includes(encoded));
  assert.equal(push.options.env.GIT_CONFIG_COUNT, '3');
  assert.equal(push.options.env.GIT_CONFIG_VALUE_2, 'AUTHORIZATION: basic ' + encoded);
});
