export interface Choice {
  id: string;
  label: string;
  description: string;
}

export const choices = {
  stack: [
    { id: 'electron', label: 'Electron / React / Vite / TypeScript', description: 'Desktop UI with a Node main process and typed preload IPC.' },
    { id: 'web', label: 'React / Vite / TypeScript + Node API', description: 'Browser frontend with a separately deployed server API.' },
    { id: 'next', label: 'Next.js / React / TypeScript', description: 'Full-stack web application with server-rendered routes.' },
    { id: 'php', label: 'PHP / MySQL / Apache + Vite frontend', description: 'Shared hosting; Node is a local build tool only.' },
    { id: 'static', label: 'Static HTML / CSS / TypeScript / Vite', description: 'Browser-only application with no bundled backend.' },
    { id: 'python', label: 'Python / FastAPI + React / TypeScript', description: 'Python service with a typed browser frontend.' },
    { id: 'native', label: 'C++ / CMake / Qt', description: 'Native desktop application; package.json wraps native build tooling.' },
    { id: 'generic', label: 'Decide during implementation', description: 'Keep the stack decision explicit and actionable.' }
  ],
  platform: [
    { id: 'windows', label: 'Windows desktop', description: 'Validate Windows paths, installation and native integration.' },
    { id: 'desktop', label: 'Windows / macOS / Linux desktop', description: 'Use platform-specific adapters and packaging checks.' },
    { id: 'browser', label: 'Responsive desktop and mobile browsers', description: 'Keyboard, touch and responsive layouts.' },
    { id: 'server', label: 'Server / API / CLI', description: 'Headless runtime; UI preferences apply only if a UI is added.' }
  ],
  theme: [
    { id: 'vscode-dark', label: 'VS Code-inspired dark', description: 'Neutral dark surfaces, restrained accents, compact tool controls.' },
    { id: 'system', label: 'Follow system light / dark', description: 'Accessible palettes with a user override.' },
    { id: 'light', label: 'Clean light workspace', description: 'Quiet surfaces, clear borders and readable data hierarchy.' },
    { id: 'contrast', label: 'High contrast', description: 'Strong separation and non-color state indicators.' }
  ],
  density: [
    { id: 'dense', label: 'Dense information workspace', description: 'Maximum useful information; preserve readable labels and usable targets.' },
    { id: 'balanced', label: 'Balanced', description: 'Comfortable scanning and moderate spacing.' },
    { id: 'touch', label: 'Touch-friendly', description: 'Larger controls and generous interaction targets.' }
  ],
  layout: [
    { id: 'workspace', label: 'Resizable workspace with collapsible panels', description: 'Remember panel size, visibility and selected views.' },
    { id: 'dashboard', label: 'Dashboard with surrounding detail panels', description: 'Primary data surface with compact secondary information.' },
    { id: 'document', label: 'Document / content-first', description: 'Reading and editing surface with contextual tools.' },
    { id: 'workflow', label: 'Task and form workflow', description: 'Predictable navigation through focused steps.' }
  ],
  overlays: [
    { id: 'pinned', label: 'Pinnable in-window detail popovers', description: 'Hover or focus previews; click/touch to pin, Escape to close; no new windows.' },
    { id: 'drawer', label: 'Click-open drawers and dialogs', description: 'Keyboard and touch accessible; explicit close and focus restoration.' },
    { id: 'inline', label: 'Inline expand / collapse', description: 'Keep details in normal document flow.' }
  ],
  primarySurface: [
    { id: 'charts', label: 'Chart-first analysis surface', description: 'Clear axes/units, zoom and inspection with compact surrounding detail panels.' },
    { id: 'tables', label: 'Table / list-first workspace', description: 'Sorting, filtering and efficient comparison of records.' },
    { id: 'editor', label: 'Editor / canvas-first workspace', description: 'Direct manipulation and contextual inspectors.' },
    { id: 'forms', label: 'Form / task-first workspace', description: 'Clear validation and predictable progression through work.' },
    { id: 'mixed', label: 'Choose from application functionality', description: 'Let the feature request establish the primary working surface.' }
  ],
  chrome: [
    { id: 'custom', label: 'Custom themed titlebar and window controls', description: 'Desktop only; preserve drag regions, keyboard behavior and native semantics.' },
    { id: 'native', label: 'Native titlebar and controls', description: 'Use operating system conventions.' },
    { id: 'browser', label: 'Browser-managed window chrome', description: 'No simulated desktop minimize/maximize controls.' }
  ],
  scrollbars: [
    { id: 'themed', label: 'Themed scrollbars and form controls', description: 'Match both themes; preserve contrast and platform accessibility.' },
    { id: 'native', label: 'Native scrollbars and form controls', description: 'Keep operating system defaults.' }
  ],
  tray: [
    { id: 'close-to-tray', label: 'Close to tray with explicit Quit', description: 'Single instance; right-click menu for restore, settings, status and Quit.' },
    { id: 'start-hidden', label: 'Start hidden in tray', description: 'First-run setup remains visible; restore and explicit Quit required.' },
    { id: 'optional', label: 'Optional minimize to tray', description: 'User-controlled preference; closing normally exits.' },
    { id: 'none', label: 'No tray integration', description: 'Normal window or browser lifecycle.' }
  ],
  branding: [
    { id: 'generate', label: 'Create logo, app and launcher icons', description: 'Keep editable source plus derived platform sizes in assets/.' },
    { id: 'provided', label: 'Use user-provided brand assets', description: 'Record missing assets as follow-up tasks.' },
    { id: 'minimal', label: 'Minimal wordmark and standard icon set', description: 'Prefer the existing icon library for controls.' }
  ],
  iconStates: [
    { id: 'states', label: 'Distinct idle / active / warning icon states', description: 'Use shape or glyph as well as color; label tray state for accessibility.' },
    { id: 'single', label: 'Single application icon', description: 'One consistent mark across launcher and window.' }
  ],
  visualStyle: [
    { id: 'utilitarian', label: 'Quiet utilitarian controls', description: 'Consistent icons, precise alignment and minimal decoration.' },
    { id: 'industrial', label: 'Industrial instrument styling', description: 'Subtle gauge/instrument treatment with legible numerical values.' },
    { id: 'expressive', label: 'Expressive branded controls', description: 'Distinct visual personality with consistent interaction semantics.' }
  ],
  storage: [
    { id: 'sqlite', label: 'SQLite on the local device', description: 'Single local database; migrations, backups and transactional writes.' },
    { id: 'postgres', label: 'PostgreSQL behind a server API', description: 'Shared data and concurrent writers; never ship DB credentials to a client.' },
    { id: 'mysql', label: 'MySQL / MariaDB behind a server API', description: 'Shared hosting or managed database with server-side access.' },
    { id: 'indexeddb', label: 'IndexedDB in the browser', description: 'Device-local browser data with explicit export and quota handling.' },
    { id: 'json', label: 'Local JSON files', description: 'Small settings/documents; atomic writes and schema validation.' },
    { id: 'none', label: 'No persistent storage', description: 'Ephemeral session state only.' }
  ],
  users: [
    { id: 'single', label: 'Single user', description: 'One local or personal user; no shared-account administration.' },
    { id: 'multi', label: 'Multiple users, one organization', description: 'Shared data with authenticated per-user access.' },
    { id: 'tenant', label: 'Multiple organizations / tenants', description: 'Enforce tenant isolation and test cross-tenant denial.' }
  ],
  authentication: [
    { id: 'none', label: 'No application login', description: 'Local single-user or public read-only experience.' },
    { id: 'local', label: 'Application-managed accounts', description: 'Established auth library, hashed passwords, secure sessions and reset flow.' },
    { id: 'oidc', label: 'OpenID Connect / organization SSO', description: 'External identity provider; configure issuer and client at implementation.' }
  ],
  authorization: [
    { id: 'none', label: 'No role system', description: 'Single-user or public experience.' },
    { id: 'rbac', label: 'Role-based access control (RBAC)', description: 'Roles grant permissions; enforce on every protected server operation.' },
    { id: 'groups', label: 'Group-based permissions', description: 'Group memberships grant explicit permissions; deny by default.' },
    { id: 'hybrid', label: 'Groups assign roles', description: 'Groups organize membership; roles define allowed actions.' }
  ],
  adminSetup: [
    { id: 'first-run', label: 'Create admin at first run', description: 'No shared default password; one-time setup closes after enrollment.' },
    { id: 'generate', label: 'Generate a local bootstrap password', description: 'Write only to ignored .env.local; require rotation at first sign-in.' },
    { id: 'password', label: 'Enter a local bootstrap password', description: 'Masked input, stored only in ignored .env.local; rotate at first sign-in.' },
    { id: 'external', label: 'Assign admin through the identity provider', description: 'Use an explicit subject/group allowlist; no local password.' },
    { id: 'none', label: 'No administrator account', description: 'No application login or administration.' }
  ],
  deployment: [
    { id: 'desktop', label: 'Desktop distribution', description: 'Ship platform artifacts from dist/; user data lives outside installation folders.' },
    { id: 'server', label: 'Managed server / container', description: 'Document runtime environment, health checks, secrets and migrations.' },
    { id: 'shared', label: 'Apache shared hosting', description: 'Upload dist/; no Node process, server shell or workers assumed.' },
    { id: 'static', label: 'Static hosting', description: 'Upload dist/; configure route fallback if needed.' },
    { id: 'undecided', label: 'Choose during implementation', description: 'Record the deployment decision before release.' }
  ],
  packaging: [
    { id: 'inno', label: 'Windows installer (Inno Setup)', description: 'Versioned installer and uninstall flow under dist/.' },
    { id: 'portable', label: 'Portable desktop package', description: 'Platform archive with runtime assets under dist/.' },
    { id: 'platform', label: 'Platform installers', description: 'Installer per selected OS with explicit signing decisions.' },
    { id: 'web', label: 'Web build / server artifact', description: 'Runtime-shaped dist/ artifact and deployment instructions.' },
    { id: 'source', label: 'Source / library package', description: 'Publishable package, version metadata and checksums when relevant.' }
  ],
  interchange: [
    { id: 'json', label: 'Versioned JSON import / export', description: 'Schema, provenance and validation; round-trip between installations.' },
    { id: 'json-csv', label: 'JSON and CSV import / export', description: 'JSON retains structure; CSV supports tabular exchange.' },
    { id: 'none', label: 'No import / export requirement', description: 'Add only when application functionality calls for it.' }
  ],
  connectivity: [
    { id: 'offline', label: 'Offline-first / local operation', description: 'Core workflow works offline; document any optional network use.' },
    { id: 'online', label: 'Online service', description: 'Explicit timeout, retry, authentication and failure states.' },
    { id: 'sync', label: 'Local data with remote sync', description: 'Specify conflicts, ownership and sync status; no silent overwrites.' }
  ],
  settings: [
    { id: 'persisted', label: 'Persist settings and workspace layout', description: 'Settings screen, validated defaults, reset and migration strategy.' },
    { id: 'session', label: 'Session settings only', description: 'Reset when the app closes; state this behavior clearly.' }
  ],
  testing: [
    { id: 'standard', label: 'Unit + integration + key workflow smoke tests', description: 'Verify persistence, access control and packaged runtime when applicable.' },
    { id: 'extended', label: 'Extended: end-to-end, accessibility and upgrade checks', description: 'Also cover keyboard/touch, migration rollback and install/uninstall.' }
  ]
} as const satisfies Record<string, readonly Choice[]>;

export type FoundationKey = keyof typeof choices;
export type ProjectFoundation = { [K in FoundationKey]: (typeof choices)[K][number]['id'] } & {
  adminUsername: string;
  notes: string;
};

export const foundationSections: { title: string; keys: FoundationKey[] }[] = [
  { title: 'Application and delivery', keys: ['stack', 'platform', 'deployment', 'packaging', 'connectivity'] },
  { title: 'UX and branding', keys: ['theme', 'density', 'layout', 'primarySurface', 'overlays', 'chrome', 'scrollbars', 'tray', 'branding', 'iconStates', 'visualStyle', 'settings'] },
  { title: 'Storage and data exchange', keys: ['storage', 'interchange'] },
  { title: 'Users and access', keys: ['users', 'authentication', 'authorization', 'adminSetup'] },
  { title: 'Verification', keys: ['testing'] }
];

export function defaultFoundation(stack: ProjectFoundation['stack'] = 'electron'): ProjectFoundation {
  const desktop = ['electron', 'native'].includes(stack);
  return {
    stack, platform: desktop ? 'windows' : 'browser', theme: 'vscode-dark', density: 'dense',
    layout: 'workspace', primarySurface: 'mixed', overlays: 'pinned', chrome: desktop ? 'custom' : 'browser', scrollbars: 'themed',
    tray: desktop ? 'close-to-tray' : 'none', branding: 'generate', iconStates: desktop ? 'states' : 'single',
    visualStyle: 'utilitarian', settings: 'persisted',
    storage: desktop || stack === 'generic' ? 'sqlite' : stack === 'static' ? 'indexeddb' : stack === 'php' ? 'mysql' : 'postgres',
    users: 'single', authentication: 'none', authorization: 'none', adminSetup: 'none', adminUsername: 'admin',
    deployment: desktop ? 'desktop' : stack === 'php' ? 'shared' : stack === 'static' ? 'static' : stack === 'generic' ? 'undecided' : 'server',
    packaging: desktop ? 'inno' : 'web', interchange: 'json', connectivity: desktop || stack === 'static' ? 'offline' : 'online',
    testing: 'standard', notes: ''
  };
}

export function availableChoices(key: FoundationKey, f: ProjectFoundation): readonly Choice[] {
  const all: readonly Choice[] = choices[key];
  const desktop = ['electron', 'native'].includes(f.stack);
  if (key === 'platform') return all.filter(c => desktop ? ['windows', 'desktop'].includes(c.id) : ['browser', 'server'].includes(c.id));
  if (key === 'chrome') return all.filter(c => desktop ? c.id !== 'browser' : c.id === 'browser');
  if (key === 'tray' && !desktop) return all.filter(c => c.id === 'none');
  if (key === 'packaging') return all.filter(c => desktop ? (f.platform === 'desktop' ? ['portable', 'platform'].includes(c.id) : ['inno', 'portable', 'platform'].includes(c.id)) : ['web', 'source'].includes(c.id));
  if (key === 'deployment') return all.filter(c => desktop ? c.id === 'desktop' : f.stack === 'php' ? ['shared', 'server'].includes(c.id) : f.stack === 'static' ? c.id === 'static' : ['server', 'undecided'].includes(c.id));
  if (key === 'storage') return all.filter(c => f.stack === 'static' ? ['indexeddb', 'none'].includes(c.id) : f.users !== 'single' ? ['postgres', 'mysql'].includes(c.id) : f.stack === 'php' ? ['mysql', 'postgres', 'sqlite', 'none'].includes(c.id) : desktop ? !['indexeddb'].includes(c.id) : ['postgres', 'mysql', 'sqlite', 'none'].includes(c.id));
  if (key === 'users' && f.stack === 'static') return all.filter(c => c.id === 'single');
  if (key === 'authentication') return all.filter(c => f.stack === 'static' ? c.id === 'none' : f.users !== 'single' ? c.id !== 'none' : true);
  if (key === 'authorization') return all.filter(c => f.authentication === 'none' ? c.id === 'none' : c.id !== 'none');
  if (key === 'adminSetup') return all.filter(c => f.authentication === 'none' ? c.id === 'none' : f.authentication === 'oidc' ? c.id === 'external' : ['first-run', 'generate', 'password'].includes(c.id));
  if (key === 'connectivity' && (f.users !== 'single' || ['postgres', 'mysql'].includes(f.storage))) return all.filter(c => c.id !== 'offline');
  return all;
}

export function normalizeFoundation(input: ProjectFoundation): ProjectFoundation {
  const f = { ...input };
  // Dependencies must settle before the review screen or saved defaults are accepted.
  for (const key of ['platform', 'users', 'authentication', 'authorization', 'adminSetup', 'storage', 'connectivity', 'deployment', 'packaging', 'chrome', 'tray'] as FoundationKey[]) {
    const allowed = availableChoices(key, f);
    if (!allowed.some(c => c.id === f[key])) (f as Record<FoundationKey, string>)[key] = allowed[0].id;
  }
  if (f.authentication === 'none') f.adminUsername = '';
  else if (!f.adminUsername) f.adminUsername = 'admin';
  return f;
}

export function foundationLabel(key: FoundationKey, f: ProjectFoundation): string {
  return choices[key].find(c => c.id === f[key])?.label ?? f[key];
}

export function foundationSummary(f: ProjectFoundation): string {
  return foundationSections.map(section => `## ${section.title}\n\n${section.keys.map(key => `- ${key}: ${foundationLabel(key, f)}`).join('\n')}`).join('\n\n');
}
