const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');

const calls = [];
const state = new Map();
const uri = file => ({ fsPath: file, scheme: 'file' });
const vscode = {
  workspace: { workspaceFolders: [], getConfiguration: () => ({ get: () => true }) },
  Uri: { file: uri, joinPath: (root, ...parts) => uri(path.join(root.fsPath, ...parts)) },
  commands: { executeCommand: async (...args) => { calls.push(['command', ...args]); } },
  extensions: { getExtension: () => ({ isActive: false, activate: async () => ({ getAPI: () => ({ openRepository: async root => calls.push(['repo', root]) }) }) }) },
  window: {
    createTerminal: options => { calls.push(['terminal', options]); return { show: () => {} }; },
    showTextDocument: async file => { calls.push(['document', file]); }
  }
};
const original = Module._load;
Module._load = function (name, ...args) { return name === 'vscode' ? vscode : original.call(this, name, ...args); };
const { openProject, completeProjectOpen } = require('../dist/workspace');
Module._load = original;
const context = { globalState: { get: key => state.get(key), update: async (key, value) => { value === undefined ? state.delete(key) : state.set(key, value); } } };

test('folder open survives extension host replacement and creates a terminal rooted at the destination', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'reponator-workspace-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const old = path.join(root, 'old'); const target = path.join(root, 'new');
  await fs.mkdir(old); await fs.mkdir(target);
  vscode.workspace.workspaceFolders = [{ uri: uri(old) }];
  await openProject(context, target);
  assert.deepEqual(calls[0], ['command', 'vscode.openFolder', uri(target), { forceReuseWindow: true }]);
  assert.equal(calls.filter(call => call[0] === 'terminal').length, 0);
  await completeProjectOpen(context);
  assert.equal(state.size, 1);
  vscode.workspace.workspaceFolders = [{ uri: uri(target) }];
  await completeProjectOpen(context);
  assert.equal(calls.find(call => call[0] === 'repo')[1].fsPath, target);
  assert.equal(calls.find(call => call[0] === 'terminal')[1].cwd.fsPath, target);
  assert.equal(state.size, 0);
  await completeProjectOpen(context);
  assert.equal(calls.filter(call => call[0] === 'terminal').length, 1);
});
