import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultFoundation, foundationSummary, normalizeFoundation, ProjectFoundation } from './foundation';
import { ProjectSpec, ScaffoldFile } from './types';

export const generatorVersion: string = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')).version;

export function foundationFor(spec: ProjectSpec): ProjectFoundation {
  return normalizeFoundation(spec.foundation ?? defaultFoundation('generic'));
}

export function foundationFiles(spec: ProjectSpec): ScaffoldFile[] {
  const foundation = foundationFor(spec);
  return [
    { path: 'docs/PROJECT_FOUNDATION.md', content: foundationDocument(spec, foundation) },
    { path: 'tools/project-mgmt/foundation.json', content: `${JSON.stringify({ schemaVersion: 1, ...foundation }, null, 2)}\n` },
    { path: 'docs/developer/project-gravity.md', content: '# Scope In This Project\n\nApply the operating principles below to the selected foundation. Reponator roadmap\nitems describe generator ambitions, not additional application features to build.\n\n' + bundledDoc('PROJECT_GRAVITY_AND_AMBITION.md') },
    { path: 'docs/developer/engineering-geometry.md', content: bundledDoc('ENGINEERING_GEOMETRY.md') },
    { path: 'docs/developer/workflow.md', content: bundledDoc('DEVOPS_WORKFLOW.md') },
    { path: '.vscode/settings.json', content: `${JSON.stringify({
      'terminal.integrated.cwd': '${workspaceFolder}',
      'git.openRepositoryInParentFolders': 'never'
    }, null, 2)}\n` },
    { path: '.env.example', content: '# Local bootstrap inputs only. Copy to ignored .env.local when needed.\nADMIN_BOOTSTRAP_USERNAME=\nADMIN_BOOTSTRAP_PASSWORD_B64=\n' },
    { path: 'tools/project-mgmt/stack-command.js', content: `const command = process.argv[2];\nconsole.error(command + ' is not implemented yet. Read docs/PROJECT_FOUNDATION.md, add the real stack command in package.json, and record validation in docs/dev-ledger.md.');\nprocess.exitCode = 1;\n` }
  ];
}

export function foundationDocument(spec: ProjectSpec, f: ProjectFoundation): string {
  return `# ${spec.displayName || spec.name}: Project Foundation

These selections were supplied through Reponator's creation wizard. They define
the implementation environment. The user's feature request supplies application
functionality. Scaffolding these decisions does not implement an application or login.

${foundationSummary(f)}

## Administrator Bootstrap

- Initial admin username / identity: ${f.adminUsername || 'Not applicable'}
- Credentials: ${['generate', 'password'].includes(f.adminSetup) ? 'Local .env.local only; no credential value is committed.' : 'No bootstrap password is stored.'}
- Application-managed passwords must be hashed and bootstrap enrollment disabled
  after first use. Require rotation of a supplied bootstrap password.
- External identity uses an allowlisted subject/group; do not grant admin to arbitrary SSO users.

## Delivery And Data Boundaries

Use package.json as the command surface and dist/ as the distribution boundary.
Keep mutable user data outside the installed application. Use migrations for
relational data, and test backup/restore. Shared databases live behind a trusted
server API; desktop/browser clients must not contain database credentials.
Electron implementations isolate the renderer from Node with a typed preload
bridge and validated IPC. Any settings, tray, icon and overlay decisions above
are foundation preferences; feature-specific behavior comes from the user request.

## Additional User Constraints

${f.notes ? f.notes.replace(/\r\n/g, '\n') : 'None recorded.'}

## Implementation Handoff

1. Read AGENTS.md and the startup documents before designing application behavior.
2. Implement the user's functional request within this foundation.
3. Replace failing build/test/package placeholders with real stack commands.
4. Once the source layout is settled, review package.json, manifest.json, foundation,
   planning and all docs; reconcile paths, dependencies and runtime assumptions.
5. Adapt version-sync.js/version-show.js to the real stack-specific version files,
   excluding third-party modules and libraries. Test patch/minor/major behavior.
6. Record assumptions and validation; update the handoff before context is exhausted.

## Decision Sources

The original example separated Electron/React/Vite/TypeScript, local SQLite, dense
VS Code dark styling, collapsible panels, pinnable in-page previews, custom chrome,
tray lifecycle, logo/icons and state variants from product-specific monitoring rules.
This foundation generalizes those environmental decisions. It does not seed the
example application's features or its transcript.

Selection guidance: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security/),
[SQLite deployment tradeoffs](https://www.sqlite.org/whentouse.html),
[OWASP authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
`;
}

function bundledDoc(name: string): string {
  return readFileSync(join(__dirname, '..', 'docs', name), 'utf8');
}
