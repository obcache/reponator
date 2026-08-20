import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ProjectSpec, ScaffoldFile } from './types';

export function createScaffoldFiles(spec: ProjectSpec): ScaffoldFile[] {
  const packageJson = {
    name: spec.name,
    version: '0.1.0',
    private: spec.isPrivate,
    description: spec.description,
    scripts: {
      todo: 'node tools/project-mgmt/todo.js list',
      'todo:add': 'node tools/project-mgmt/todo.js add',
      'ledger:list': 'node tools/project-mgmt/ledger.js list',
      'ledger:message': 'node tools/project-mgmt/ledger.js message',
      handoff: 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/project-mgmt/handoff.ps1',
      'version:show': 'node tools/project-mgmt/version-show.js',
      'version:sync': 'node tools/project-mgmt/version-sync.js',
      'version:bump:patch': 'node tools/project-mgmt/version-bump.js patch',
      'version:bump:minor': 'node tools/project-mgmt/version-bump.js minor',
      'version:bump:major': 'node tools/project-mgmt/version-bump.js major',
      commit: 'node tools/project-mgmt/commit-release.js patch',
      'commit:minor': 'node tools/project-mgmt/commit-release.js minor',
      'commit:major': 'node tools/project-mgmt/commit-release.js major'
    }
  };

  const manifest = {
    generator: 'reponator',
    generatorVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    project: {
      name: spec.name,
      description: spec.description,
      private: spec.isPrivate
    },
    layout: {
      docs: [
        'README.md',
        'docs/dev-ledger.md',
        'docs/planning/To-do.md',
        'docs/user/UserGuide.md',
        'docs/developer/build.md',
        'docs/developer/deployment.md',
        'docs/developer/testing.md',
        'docs/developer/handoff.md',
        'docs/developer/versioning.md',
        'docs/manual-qa.md'
      ],
      tools: [
        'tools/project-mgmt/ledger.js',
        'tools/project-mgmt/todo.js',
        'tools/project-mgmt/handoff.ps1',
        'tools/project-mgmt/version-show.js',
        'tools/project-mgmt/version-sync.js',
        'tools/project-mgmt/version-bump.js',
        'tools/project-mgmt/commit-release.js'
      ]
    }
  };

  return normalizeFiles([
    { path: '.gitattributes', content: '* text=auto eol=lf\n' },
    { path: '.gitignore', content: gitignoreTemplate() },
    { path: 'VERSION', content: '0.1.0\n' },
    { path: 'package.json', content: `${JSON.stringify(packageJson, null, 2)}\n` },
    { path: 'README.md', content: rootReadme(spec) },
    { path: 'docs/dev-ledger.md', content: devLedgerTemplate() },
    { path: 'docs/manual-qa.md', content: developerGuide('Manual QA') },
    { path: 'docs/planning/To-do.md', content: todoTemplate() },
    { path: 'docs/user/UserGuide.md', content: userGuideTemplate(spec.name) },
    { path: 'docs/developer/build.md', content: developerGuide('Build Guide') },
    { path: 'docs/developer/deployment.md', content: developerGuide('Deployment Guide') },
    { path: 'docs/developer/testing.md', content: developerGuide('Testing Guide') },
    { path: 'docs/developer/handoff.md', content: developerGuide('Handoff Guide') },
    { path: 'docs/developer/versioning.md', content: versioningGuide() },
    { path: 'tools/project-mgmt/README.md', content: projectMgmtReadme() },
    { path: 'tools/project-mgmt/manifest.json', content: `${JSON.stringify(manifest, null, 2)}\n` },
    { path: 'tools/project-mgmt/ledger.js', content: ledgerJs() },
    { path: 'tools/project-mgmt/todo.js', content: todoJs() },
    { path: 'tools/project-mgmt/version-show.js', content: versionShowJs() },
    { path: 'tools/project-mgmt/version-sync.js', content: versionSyncJs() },
    { path: 'tools/project-mgmt/version-bump.js', content: versionBumpJs() },
    { path: 'tools/project-mgmt/commit-release.js', content: commitReleaseJs() },
    { path: 'tools/project-mgmt/handoff.ps1', content: handoffPs1() }
  ]);
}

export async function writeScaffoldFiles(root: string, files: ScaffoldFile[]): Promise<void> {
  for (const file of files) {
    const target = join(root, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, 'utf8');
  }
}

function normalizeFiles(files: ScaffoldFile[]): ScaffoldFile[] {
  return files
    .map(file => ({ path: file.path.replace(/\\/g, '/'), content: normalize(file.content) }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function normalize(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized.endsWith('\n') ? normalized : `${normalized}\n`;
}

function rootReadme(spec: ProjectSpec): string {
  const visibility = spec.isPrivate ? 'Private' : 'Public';
  return `# ${spec.name}

${spec.description}

## Project Status

- Visibility: ${visibility}
- Version: 0.1.0
- Created: ${new Date().toISOString().slice(0, 10)}

## Overview

Describe what this project does, who it serves, and the primary workflow.

## Features

- [ ] Document core capabilities as they are implemented.

## Installation

Document prerequisites and setup steps.

## Usage

Show the common commands and user-facing workflows.

## Development

Project workflow files live under \`docs/\` and reusable automation lives under \`tools/project-mgmt/\`.

\`\`\`powershell
npm run todo
npm run ledger:message
npm run handoff
npm run version:show
\`\`\`

## Testing

Document automated and manual test coverage as the project grows.

## Build And Release

Use \`npm run commit -- "message"\` for a patch release commit. Use \`npm run commit:minor -- "message"\` or \`npm run commit:major -- "message"\` when the change requires a larger version bump.

## Contributing

Document branch, review, commit, and release expectations.

## License

Add licensing details before public distribution.
`;
}

function gitignoreTemplate(): string {
  return `node_modules/
.env
.env.*
.tmp/
dist/
build/
release/
*.log
tools/project-mgmt/.codex-bundle/
tools/project-mgmt/chat-handoffs/
docs/handoffs/handoff-*.md
`;
}

function devLedgerTemplate(): string {
  return `# Dev Ledger

This ledger is the development journal and changelog source for the project. Use it to preserve decisions, rationale, validation, rollback plans, and handoff context.

## Purpose

- Track meaningful development progress before and after commits.
- Preserve why a change was made, not only what changed.
- Keep rollback and follow-up tasks close to the work that created them.
- Provide source material for commit messages, release notes, and session handoffs.

## How To Use

- Add an entry for behavior changes, build changes, dependency updates, infrastructure work, or important investigations.
- Use \`Status: Planned\`, \`Status: Draft\`, or \`Status: Complete\`.
- Set entries to \`Complete\` when they should be considered ready for commit/release tooling.
- Include validation commands and rollback notes whenever practical.

## Entry Template

### [YYYY-MM-DD] Entry Title (Status: Planned)
Author: <name/initials>

Summary
- What changed and why.

Impact
- Areas/modules: <paths or systems>
- Risk: Low | Medium | High

Validation
- [ ] Command or manual check.

Follow-ups
- [ ] Remaining work.

Rollback Strategy
- How to revert or disable the change.

## Entries

### [YYYY-MM-DD] Initial Project Bootstrap (Status: Complete)
Author: reponator

Summary
- Created the initial project-management, documentation, handoff, and versioning scaffold.

Impact
- Areas/modules: docs, tools/project-mgmt, package.json
- Risk: Low

Validation
- [ ] Run \`npm run version:show\`.
- [ ] Run \`npm run handoff\`.

Follow-ups
- [ ] Replace README outline text with project-specific content.
- [ ] Add build, test, and deployment commands once the application stack is chosen.

Rollback Strategy
- Revert the initial scaffold commit or remove generated workflow files.

## Changelog

Committed ledger entries can be moved here by project tooling.

## Rollback Task Template

### Rollback: <Title/ID>

Prereqs
- Current branch/commit: <ref>
- Backups/snapshots: <paths or links>

Steps
- [ ] Step 1.
- [ ] Step 2.

Verification
- [ ] Build/test pass: <commands>
- [ ] Manual checks: <list>

Restore Plan
- Outline how to recover if the rollback fails.
`;
}

function todoTemplate(): string {
  return `# Project Plan And To-Do

This file is the planning mechanism for active work. Keep it current enough that a new developer or a fresh chat session can understand the next move without reconstructing the whole project history.

## Current Objective

- [ ] Define the first concrete project objective.

## Next Actions

- [ ] Replace this starter checklist with actionable tasks.
- [ ] Add acceptance criteria for the first milestone.
- [ ] Link important decisions back to \`docs/dev-ledger.md\`.

## Backlog

- [ ] Capture future ideas here until they are promoted into Current Objective or Next Actions.

## Risks And Questions

- [ ] List unresolved assumptions, external dependencies, and decisions needed.

## Done

- [x] Initial planning file created.
`;
}

function userGuideTemplate(projectName: string): string {
  return `# ${projectName} User Guide

## Overview

Describe the user-facing purpose of the project.

## Getting Started

1. Install or open the project.
2. Complete any required setup.
3. Run the primary workflow.

## Core Workflows

Document the workflows real users repeat most often.

## Settings

Document configuration options and defaults.

## Troubleshooting

### A workflow fails

Capture expected symptoms, causes, and recovery steps.

## FAQ

Add common questions as the product becomes clearer.
`;
}

function developerGuide(title: string): string {
  return `# ${title}

## Purpose

Document the project-specific process here.

## Prerequisites

- Node.js and npm for project-management scripts.
- Git for source control.

## Commands

Add concrete commands once the implementation stack is selected.

## Notes

Keep developer-facing details here rather than overloading the public README.
`;
}

function versioningGuide(): string {
  return `# Versioning Guide

## Policy

The root \`package.json\` version is the source of truth. Version tooling also updates package-lock files, nested package files, \`VERSION\`, \`version.txt\`, and common Inno Setup version fields when those files exist.

## Commands

\`\`\`powershell
npm run version:show
npm run version:bump:patch
npm run version:bump:minor
npm run version:bump:major
\`\`\`

## Commit Convention

Freeform requests to "commit" should be treated as a patch release unless the requester explicitly asks for a minor or major release.

\`\`\`powershell
npm run commit -- "message"
npm run commit:minor -- "message"
npm run commit:major -- "message"
\`\`\`
`;
}

function projectMgmtReadme(): string {
  return `# Project Management Tools

This folder contains neutral workflow tools generated by Reponator.

## Files

- \`manifest.json\` records the generated scaffold.
- \`ledger.js\` reads \`docs/dev-ledger.md\` and can print a commit message from Complete entries.
- \`todo.js\` lists and appends Markdown planning tasks in \`docs/planning/To-do.md\`.
- \`handoff.ps1\` creates a durable handoff summary under \`docs/handoffs/\`.
- \`version-show.js\`, \`version-sync.js\`, and \`version-bump.js\` keep project version values aligned.
- \`commit-release.js\` bumps the requested version part, commits, and pushes when a remote exists.

## Common Commands

\`\`\`powershell
npm run todo
npm run todo:add -- "Write first milestone"
npm run ledger:message
npm run handoff
npm run version:show
npm run commit -- "initial release"
\`\`\`
`;
}

function ledgerJs(): string {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(process.cwd(), 'docs', 'dev-ledger.md');

function fail(message) {
  console.error(\`[ledger] \${message}\`);
  process.exit(1);
}

function readLedger() {
  if (!fs.existsSync(LEDGER_PATH)) fail('docs/dev-ledger.md was not found.');
  return fs.readFileSync(LEDGER_PATH, 'utf8');
}

function sectionRange(markdown, header) {
  const lines = markdown.split(/\\r?\\n/);
  const start = lines.findIndex(line => line.trim().toLowerCase() === \`## \${header}\`.toLowerCase());
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  }
  return { lines, start, end };
}

function parseEntries(markdown) {
  const range = sectionRange(markdown, 'Entries');
  if (!range) return [];
  const body = range.lines.slice(range.start + 1, range.end);
  const entries = [];
  let i = 0;
  while (i < body.length) {
    const header = body[i] || '';
    const match = header.match(/^### \\[(\\d{4}-\\d{2}-\\d{2})\\]\\s+(.+?)\\s+\\(Status:\\s*(Planned|Draft|Complete)\\s*\\)\\s*$/);
    if (!match) {
      i += 1;
      continue;
    }
    const entry = { date: match[1], title: match[2], status: match[3], body: [] };
    i += 1;
    while (i < body.length && !(body[i] || '').startsWith('### ')) {
      entry.body.push(body[i]);
      i += 1;
    }
    entries.push(entry);
  }
  return entries;
}

function buildMessage(entries) {
  if (!entries.length) return '';
  const subject = entries.length === 1 ? \`release: \${entries[0].title}\` : \`release: \${entries.length} completed ledger entries\`;
  const details = entries.map(entry => [
    \`Entry: \${entry.title} (\${entry.date})\`,
    '',
    entry.body.join('\\n').trim() || '(no details)'
  ].join('\\n'));
  return [subject, '', details.join('\\n\\n---\\n\\n')].join('\\n');
}

function main() {
  const command = process.argv[2] || 'message';
  const entries = parseEntries(readLedger());
  const complete = entries.filter(entry => entry.status === 'Complete');

  if (command === 'list') {
    if (!entries.length) {
      console.log('No ledger entries found.');
      return;
    }
    entries.forEach(entry => console.log(\`\${entry.status.padEnd(8)} \${entry.date} \${entry.title}\`));
    return;
  }

  if (command === 'message') {
    const message = buildMessage(complete);
    console.log(message || 'No Complete entries found in docs/dev-ledger.md.');
    return;
  }

  fail(\`Unknown command: \${command}\`);
}

main();
`;
}

function todoJs(): string {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TODO_PATH = path.join(process.cwd(), 'docs', 'planning', 'To-do.md');

function fail(message) {
  console.error(\`[todo] \${message}\`);
  process.exit(1);
}

function readTodo() {
  if (!fs.existsSync(TODO_PATH)) fail('docs/planning/To-do.md was not found.');
  return fs.readFileSync(TODO_PATH, 'utf8');
}

function listTasks() {
  const lines = readTodo().split(/\\r?\\n/);
  const tasks = lines
    .map((line, index) => ({ line, index: index + 1 }))
    .filter(item => /^\\s*-\\s+\\[[ xX]\\]\\s+/.test(item.line));
  if (!tasks.length) {
    console.log('No tasks found.');
    return;
  }
  tasks.forEach(item => console.log(\`\${String(item.index).padStart(4)} \${item.line.trim()}\`));
}

function addTask(text) {
  if (!text || !text.trim()) fail('Task text is required.');
  const content = readTodo();
  const taskLine = \`- [ ] \${text.trim()}\`;
  const marker = '## Next Actions';
  const lines = content.split(/\\r?\\n/);
  const idx = lines.findIndex(line => line.trim() === marker);
  if (idx === -1) {
    fs.appendFileSync(TODO_PATH, \`\\n\${taskLine}\\n\`, 'utf8');
    return;
  }
  let insertAt = idx + 1;
  while (insertAt < lines.length && lines[insertAt].trim() === '') insertAt += 1;
  lines.splice(insertAt, 0, taskLine);
  fs.writeFileSync(TODO_PATH, \`\${lines.join('\\n')}\\n\`, 'utf8');
}

function main() {
  const [command = 'list', ...rest] = process.argv.slice(2);
  if (command === 'list') return listTasks();
  if (command === 'add') return addTask(rest.join(' '));
  fail(\`Unknown command: \${command}\`);
}

main();
`;
}

function versionShowJs(): string {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function readJsonVersion(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')).version || null;
  } catch {
    return null;
  }
}

function readTextVersion(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim() || null;
  } catch {
    return null;
  }
}

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', 'build', 'release'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full, callback);
    else callback(full);
  }
}

const rows = [];
walk(root, filePath => {
  const rel = path.relative(root, filePath).replace(/\\\\/g, '/');
  const base = path.basename(filePath).toLowerCase();
  let version = null;
  if (base === 'package.json') version = readJsonVersion(filePath);
  else if (base === 'version' || base === 'version.txt') version = readTextVersion(filePath);
  if (version) rows.push({ rel, version });
});

if (!rows.length) {
  console.log('No version files found.');
} else {
  rows.forEach(row => console.log(\`\${row.rel}: \${row.version}\`));
}
`;
}

function versionSyncJs(): string {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SEMVER_RE = /^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$/;
const root = process.cwd();

function exists(filePath) {
  try { return fs.existsSync(filePath); } catch { return false; }
}

function writeIfChanged(filePath, content) {
  const previous = exists(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (previous === content) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function updateJsonVersion(filePath, version) {
  if (!exists(filePath)) return false;
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (json.version === version) return false;
  json.version = version;
  return writeIfChanged(filePath, \`\${JSON.stringify(json, null, 2)}\\n\`);
}

function updateLockVersion(filePath, version) {
  if (!exists(filePath)) return false;
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;
  if (json.version && json.version !== version) {
    json.version = version;
    changed = true;
  }
  if (json.packages && json.packages[''] && json.packages[''].version !== version) {
    json.packages[''].version = version;
    changed = true;
  }
  return changed && writeIfChanged(filePath, \`\${JSON.stringify(json, null, 2)}\\n\`);
}

function updateTextVersion(filePath, version) {
  if (!exists(filePath)) return false;
  return writeIfChanged(filePath, \`\${version}\\n\`);
}

function updateInnoVersion(filePath, version) {
  if (!exists(filePath)) return false;
  const src = fs.readFileSync(filePath, 'utf8');
  let next = src.replace(/(#define\\s+MyAppVersion\\s+")[^"]+(")/g, \`$1\${version}$2\`);
  next = next.replace(/(^\\s*AppVersion\\s*=\\s*)[^\\r\\n]+/gmi, \`$1\${version}\`);
  next = next.replace(/(^\\s*VersionInfoVersion\\s*=\\s*)[^\\r\\n]+/gmi, \`$1\${version}\`);
  return next !== src && writeIfChanged(filePath, next);
}

function walk(dir, callback) {
  if (!exists(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', 'build', 'release'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full, callback);
    else callback(full);
  }
}

function main() {
  const args = process.argv.slice(2);
  const requested = args[0] === '--set' ? args[1] : args[0];
  const packagePath = path.join(root, 'package.json');
  if (!exists(packagePath)) {
    console.error('[version-sync] package.json not found.');
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const version = String(requested || pkg.version || '').trim();
  if (!SEMVER_RE.test(version)) {
    console.error(\`[version-sync] Invalid semver: \${version}\`);
    process.exit(1);
  }

  const touched = [];
  walk(root, filePath => {
    const rel = path.relative(root, filePath).replace(/\\\\/g, '/');
    const base = path.basename(filePath).toLowerCase();
    let changed = false;
    if (base === 'package.json') changed = updateJsonVersion(filePath, version);
    else if (base === 'package-lock.json') changed = updateLockVersion(filePath, version);
    else if (base === 'version' || base === 'version.txt') changed = updateTextVersion(filePath, version);
    else if (base.endsWith('.iss')) changed = updateInnoVersion(filePath, version);
    if (changed) touched.push(rel);
  });

  console.log(\`[version-sync] Version: \${version}\`);
  if (touched.length) touched.forEach(file => console.log(\` - \${file}\`));
  else console.log('[version-sync] No files changed.');
}

main();
`;
}

function versionBumpJs(): string {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = process.cwd();
const packagePath = path.join(root, 'package.json');

function fail(message) {
  console.error(\`[version-bump] \${message}\`);
  process.exit(1);
}

function parse(version) {
  const match = String(version || '').trim().match(/^(\\d+)\\.(\\d+)\\.(\\d+)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function main() {
  const mode = String(process.argv[2] || 'patch').toLowerCase();
  if (!['patch', 'minor', 'major'].includes(mode)) fail('Use patch, minor, or major.');
  if (!fs.existsSync(packagePath)) fail('package.json not found.');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const current = parse(pkg.version);
  if (!current) fail(\`Invalid package.json version: \${pkg.version}\`);
  if (mode === 'major') {
    current.major += 1;
    current.minor = 0;
    current.patch = 0;
  } else if (mode === 'minor') {
    current.minor += 1;
    current.patch = 0;
  } else {
    current.patch += 1;
  }
  const next = \`\${current.major}.\${current.minor}.\${current.patch}\`;
  cp.execFileSync(process.execPath, [path.join(root, 'tools', 'project-mgmt', 'version-sync.js'), '--set', next], { stdio: 'inherit' });
  console.log(\`[version-bump] \${pkg.version} -> \${next}\`);
}

main();
`;
}

function commitReleaseJs(): string {
  return `#!/usr/bin/env node
const cp = require('child_process');
const path = require('path');

const root = process.cwd();

function run(command, args, options = {}) {
  const result = cp.spawnSync(command, args, { cwd: root, stdio: options.capture ? 'pipe' : 'inherit', shell: false, encoding: 'utf8' });
  if (result.status !== 0 && !options.allowFailure) process.exit(result.status || 1);
  return result;
}

function currentVersion() {
  return require(path.join(root, 'package.json')).version;
}

function hasRemote() {
  const result = run('git', ['remote'], { capture: true, allowFailure: true });
  return result.status === 0 && result.stdout.trim().length > 0;
}

function ledgerMessage() {
  const result = run(process.execPath, [path.join(root, 'tools', 'project-mgmt', 'ledger.js'), 'message'], { capture: true, allowFailure: true });
  const text = (result.stdout || '').trim();
  if (!text || text.startsWith('No Complete entries')) return null;
  return text.split(/\\r?\\n/)[0];
}

function main() {
  const raw = process.argv.slice(2);
  const first = (raw[0] || '').toLowerCase();
  const mode = ['major', 'minor', 'patch'].includes(first) ? first : 'patch';
  const messageArgs = mode === first ? raw.slice(1) : raw;
  run(process.execPath, [path.join(root, 'tools', 'project-mgmt', 'version-bump.js'), mode]);
  const version = currentVersion();
  const message = messageArgs.join(' ').trim() || ledgerMessage() || \`release: v\${version}\`;
  run('git', ['add', '-A']);
  run('git', ['commit', '-m', message]);
  if (hasRemote()) run('git', ['push']);
}

main();
`;
}

function handoffPs1(): string {
  return `Param(
  [string]$Summary = ''
)

$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$handoffDir = Join-Path $root 'docs/handoffs'
New-Item -ItemType Directory -Force -Path $handoffDir | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$snapshotPath = Join-Path $handoffDir "handoff-$stamp.md"
$latestPath = Join-Path $handoffDir 'HANDOFF.md'

function Capture($Command, [string[]]$Arguments) {
  try {
    $output = & $Command @Arguments 2>&1
    return ($output | Out-String).Trim()
  } catch {
    return $_.Exception.Message
  }
}

function Section($Title, $Body) {
  if ([string]::IsNullOrWhiteSpace($Body)) { $Body = '(none)' }
  return "## $Title\`r\`n\`r\`n$Body\`r\`n"
}

$branch = Capture git @('branch','--show-current')
$status = Capture git @('status','--short')
$recent = Capture git @('log','--oneline','-10')
$todo = if (Test-Path 'docs/planning/To-do.md') { Get-Content -Raw 'docs/planning/To-do.md' } else { '' }
$ledger = if (Test-Path 'docs/dev-ledger.md') { Get-Content -Raw 'docs/dev-ledger.md' } else { '' }
$ledgerTail = if ($ledger.Length -gt 8000) { $ledger.Substring($ledger.Length - 8000) } else { $ledger }

$content = @"
# Project Handoff

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')

## Summary

$Summary

$(Section 'Current Branch' $branch)
$(Section 'Working Tree' $status)
$(Section 'Recent Commits' $recent)
$(Section 'Planning Snapshot' $todo)
$(Section 'Dev Ledger Tail' $ledgerTail)

## Next Session Checklist

- [ ] Read this handoff.
- [ ] Review \`docs/planning/To-do.md\`.
- [ ] Review recent \`docs/dev-ledger.md\` entries.
- [ ] Run the smallest relevant validation command before editing.
"@

[System.IO.File]::WriteAllText($snapshotPath, $content, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText($latestPath, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "[handoff] Wrote $snapshotPath"
Write-Host "[handoff] Updated $latestPath"
`;
}
