# reponator

VS Code extension for creating a new local GitHub repository with neutral project-management, documentation, handoff, and versioning scaffolding.

The extension uses VS Code's GitHub authentication session and GitHub REST/Git Database APIs. It does not require the GitHub CLI or a manually supplied token.

## Usage

Install the generated VSIX, then run:

```text
Reponator: Create Project
```

The command prompts for:

- Project parent path
- Project/repository name
- Project description
- Repository visibility

## Requirements

- Git
- Node.js
- VS Code signed in to GitHub when prompted

## Development

```powershell
npm install
npm run compile
npm run package
```

`npm run package` produces a single `.vsix` file. That VSIX is the portable deliverable.

## Workflow

The extension validates the local destination, requests a VS Code GitHub session, verifies the repository name is available, creates the repository, writes the local scaffold, creates the initial remote commit through GitHub APIs, aligns the local git repository to that same commit, and opens the new project folder in VS Code.

Generated projects include:

- `package.json` with project-management scripts
- public README outline
- planning to-do file
- dev ledger
- user and developer documentation starters
- handoff generator
- version show/sync/bump scripts
- release commit helper
- scaffold manifest

## Project Doctrine

The long-term ambition and workflow philosophy are captured in [`docs/PROJECT_GRAVITY_AND_AMBITION.md`](docs/PROJECT_GRAVITY_AND_AMBITION.md).
