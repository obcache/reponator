# Foundation Wizard Design

## What The Example Prompt Establishes

The supplied example starts with implementation-environment and presentation
choices before describing the product's monitoring behavior. Reponator captures
the reusable decisions and leaves the functional request for the first coding prompt.

| Example element | Wizard field / seeded expectation |
| --- | --- |
| Electron, React, Vite, TypeScript | Stack |
| Local SQLite database | Storage, migration and backup boundary |
| VS Code dark styling | Theme |
| Maximum information per screen | Density |
| Collapse and expand | Workspace panel layout |
| Pinnable hover popups inside the page | Overlay interaction, with focus/touch equivalents |
| App name distinct from repository folder | Application display name |
| Mostly residing in the system tray | Tray lifecycle, restore and explicit Quit |
| Generated logo and launcher/tray icon | Branding and derived icon assets |
| Different tray icon for active work | Idle/active/warning icon-state preference |
| Custom titlebar and window controls | Desktop window chrome |
| Custom scrollbar and matching controls | Scrollbar/control styling |
| Settings screen with persisted defaults | Settings policy |
| Central interactive graph | Primary working surface |
| Surrounding industrial gauges | Panel layout and instrument visual style |
| Click-open detailed view | In-window overlay policy |
| Export and load JSON from another installation | Interchange format, schema and provenance |
| Later installer request | Packaging and target platform |

Polling cadence, sample buffers, warning thresholds, automatic logging state
transitions, hardware/network fields, time-range selections and machine inventory
are product functionality. Reponator does not invent or seed those behaviors.
Specific gauge values and chart annotations also remain feature requirements.

## Additional Foundation Decisions

The wizard also captures single-user, shared organization or tenant scope;
application accounts versus identity-provider login; roles, groups or groups
assigning roles; admin identity and bootstrap policy; connectivity; deployment;
verification scope; and freeform environment constraints.

Stack selection supplies defaults. The review menu shows each group and permits
editing all its fields. Back navigates inside a group; Escape cancels creation.
Changing the stack resets dependent defaults, which are shown again on review.
Changing users/auth updates storage and admin choices to a compatible model.
Browser-only static apps do not offer a direct server database or pretend to provide
server-enforced authentication. Multi-user storage requires a server database/API.

These are curated starting points, not a claim that one technology is always best.
The foundation records selections rather than silently installing frameworks.
The user can revise decisions in docs and machine-readable foundation as the
application evolves.

## Startup And Durable Context

Root AGENTS.md embeds the selected options and a concise set of operating rules.
It directs a new session to read the full foundation, workflow, gravity, geometry,
manifest, planning, ledger and relevant developer/user docs. Referenced documents
must be read; linked files are not automatically expanded into startup context.
The source transcript is reference material and is not copied into generated repos.

After structure finalization, reconciliation is a named planning task: update
package scripts, manifest paths, docs and version tools for the real application.

## Adapting The Structural Reference

The engineering geometry guide retains reconstructable relationships, layered
views, boundary crossings, overlap as an interface, governed feedback and evidence
over self-justifying explanations. It translates them into engineering decisions,
examples and failure checks. Source-specific rituals and encapsulation mechanics
are absent from the generated guide. It operates as reasoning support under the
user's requirements, rather than as an authority over them.

## Secrets And Recovery

Bootstrap credentials are separate from ProjectSpec and all generated public
files. Only a username/policy enters the foundation. Optional passwords go to
ignored .env.local, and application enrollment must consume/rotate them.

Git operations select the exact working directory and strip inherited Git
repository selectors. Origin is attached before the initial commit. Publishing
uses the VS Code session only for the duration of the Git operation. Recovery
preserves local data, never force-pushes and refuses to silently replace a
different origin. Workspace opening happens after progress ends and the destination
host creates a fresh terminal with an explicit CWD.
