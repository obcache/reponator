# Reponator

VS Code extension that creates and publishes a GitHub repository with an application
foundation, project-management tools and durable guidance for coding agents.
Delivered as one installable VSIX. Uses VS Code's GitHub authentication and local Git.

## Create A Project

Install the latest VSIX with **Extensions: Install from VSIX**, reload VS Code,
then run **Reponator: Create Project** in the Command Palette.

Provide a parent folder, repository name, application display name, description and
visibility. Choose an application stack, then review or edit the foundation groups:

- Application: stack, target platforms, hosting, packaging and connectivity.
- UX: theme, density, panel layout, primary working surface, pinnable overlays,
  custom/native chrome, scrollbars, tray lifecycle, branding and icon states.
- Data: local/server storage and import/export format.
- Access: single/multi-user or tenants, authentication, RBAC, groups or groups assigning roles.
- Administrator: identity and first-run, generated-password, entered-password or SSO setup.
- Verification: test scope and additional environment constraints.

Selections have contextual defaults and compatibility filters. The wizard supports
returning to earlier fields within a group and revisiting groups before creating.
Cancelling the wizard creates no repository or folder. It seeds the chosen decisions;
the coding agent implements the actual application from the user's functional request.

## Startup Context

New projects include root `AGENTS.md` with the selected foundation and concise
engineering principles directly in the file. It instructs agents to read:

- `docs/PROJECT_FOUNDATION.md` and `tools/project-mgmt/foundation.json`
- `docs/developer/project-gravity.md`
- `docs/developer/engineering-geometry.md`
- `docs/developer/workflow.md`
- README, package.json, scaffold manifest, planning, ledger and relevant developer/user docs

Codex discovers `AGENTS.md` when starting a session in the repository. Full linked
documents still require reading, as instructed by that file. Start a fresh chat in
the new project to load its startup context; existing chats do not change retroactively.
See [official startup guidance](https://developers.openai.com/codex/guides/agents-md).

The geometry guide uses relationships, boundaries, invariants, feedback and evidence
to resolve routine implementation choices. After the application structure is
finalized, agents must reconcile package.json, manifest, docs and stack-specific
version locations. The wizard does not embed the supplied reference transcripts.

## Publishing And Workspace

REST creates the repository. Reponator initializes the local repo in the explicit
destination, attaches origin before committing, and publishes main with a temporary
Git HTTP credential from the VS Code session. It verifies the actual remote commit,
local root, upstream and clean working tree. Credentials are not stored in origin,
Git config or process arguments.

After progress finishes, Reponator opens the project in the current VS Code window.
The destination extension host opens it in the Git view and starts a fresh terminal
with the project as its CWD. Existing terminals and already-running chats keep their
own directories; use the new project terminal and a new chat. Workspace settings
also default future terminals to the workspace folder.

If publication fails, files and configured origin are preserved, and the Reponator
Output channel names the failing stage. Run **Reponator: Finish Publishing Project**,
select the affected folder and its existing GitHub URL. It can publish an unfinished
bootstrap or retry a clean main branch without force-pushing or recreating the repo.
An existing different origin is reported for explicit correction.

## Local Admin Bootstrap

Account choices describe the authentication system to implement; no working account
is created by the seed. A generated or entered password is stored only in ignored
`.env.local` as `ADMIN_BOOTSTRAP_PASSWORD_B64`, with its username. Base64 is an
encoding, not encryption. Bootstrap code must hash the password, require rotation,
disable enrollment after use and remove the local secret. Passwords never enter
AGENTS.md, foundation, manifest or committed artifacts. First-run enrollment is the
default for application-managed accounts; SSO uses an identity/group allowlist.

## Development

VS Code and local Git are needed for creation. Node.js/npm are needed to develop the
extension and use the generated project-management scripts. Handoff runs in Node
across platforms. Build/test/package/deployment commands in new projects fail with
instructions until the application stack commands are implemented.

```powershell
npm ci
npm test
npm run package
```

Packaging compiles the extension before creating the VSIX. Tests exercise publishing
to empty local remotes, recovery, inherited Git environments, secret handling,
foundation compatibility, wizard cancellation and workspace handoff. Live GitHub
creation and editor UI need an authenticated VS Code session for end-to-end testing.

Canonical source documents live under `docs/`; the extension copies them into new
projects and records creation-time file hashes in the scaffold manifest.
