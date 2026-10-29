const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
let scenario = {};
let reviewCount = 0;
let passwordPrompts = 0;
const vscode = {
  QuickInputButtons: { Back: {} },
  workspace: { getConfiguration: () => ({ get: () => '/projects' }), workspaceFolders: [] },
  window: {
    showInputBox: async options => {
      if (options.password) { passwordPrompts++; assert.equal(options.password, true); return 'custom-private-password-123'; }
      if (options.prompt === 'Project / GitHub repository name') return 'sample';
      if (options.prompt === 'Project description') return 'Sample app';
      return options.value || 'admin';
    },
    createQuickPick: () => {
      let accept, hide, back;
      const subscription = { dispose() {} };
      const picker = {
        selectedItems: [], activeItems: [],
        onDidAccept: fn => (accept = fn, subscription),
        onDidHide: fn => (hide = fn, subscription),
        onDidTriggerButton: fn => (back = fn, subscription),
        dispose() {}, hide: () => hide(),
        show: () => queueMicrotask(() => {
          if (scenario.cancel) return hide();
          let id;
          if (picker.title === 'Application stack') id = scenario.stack || 'electron';
          if (picker.title.startsWith('Project foundation')) id = scenario.multi && reviewCount++ === 0 ? '3' : 'create';
          if (picker.title.includes(': users ')) id = 'multi';
          if (picker.title.includes(': authentication ')) id = 'local';
          if (picker.title.includes(': authorization ')) id = 'hybrid';
          if (picker.title.includes(': adminSetup ')) id = 'password';
          picker.selectedItems = [picker.items.find(item => item.id === id) || picker.activeItems[0] || picker.items[0]];
          accept();
        })
      };
      return picker;
    }
  }
};
const original = Module._load;
Module._load = function (name, ...args) { return name === 'vscode' ? vscode : original.call(this, name, ...args); };
const { collectProjectSpec } = require('../dist/input');
Module._load = original;

test('wizard preserves defaults and returns a foundation without secrets for a local app', async () => {
  scenario = {}; reviewCount = 0; passwordPrompts = 0;
  const input = await collectProjectSpec();
  assert.equal(input.spec.foundation.stack, 'electron');
  assert.equal(input.spec.foundation.storage, 'sqlite');
  assert.equal(input.bootstrapPassword, undefined);
  assert.equal(passwordPrompts, 0);
});

test('multi-user access choices update storage and collect a masked local-only password', async () => {
  scenario = { multi: true }; reviewCount = 0; passwordPrompts = 0;
  const input = await collectProjectSpec();
  assert.equal(input.spec.foundation.users, 'multi');
  assert.equal(input.spec.foundation.storage, 'postgres');
  assert.equal(input.spec.foundation.authorization, 'hybrid');
  assert.equal(input.bootstrapPassword, 'custom-private-password-123');
  assert(!JSON.stringify(input.spec).includes(input.bootstrapPassword));
  assert.equal(passwordPrompts, 1);
});

test('cancelling a picker cancels project creation', async () => {
  scenario = { cancel: true };
  assert.equal(await collectProjectSpec(), undefined);
});
