# SceneState Extension

SceneState Extension is a SillyTavern third-party extension for tracking the current scene state of a single active character per chat.

Current repository status:

- Milestone 1 scaffold is implemented
- build output is generated into `dist/`
- runtime flow currently focuses on settings, chat-bound in-memory state, stub analysis, and prompt logging
- the extension settings now render inside the SillyTavern Extensions UI
- the `codex/release` branch is prepared for Git installer based installation

## Requirements

- Node.js with `npm`
- SillyTavern installation for manual runtime testing

## Install Dependencies

```bash
npm install
```

On Windows PowerShell, if `npm` is blocked by execution policy, use:

```powershell
npm.cmd install
```

## Build

Run:

```bash
npm run build
```

On Windows PowerShell:

```powershell
npm.cmd run build
```

Build output is written to:

- `dist/index.js`
- `dist/manifest.json`
- `dist/settings.html`
- `dist/style.css`

## Release Branch Build

The `codex/release` branch is intended to be installable directly through the SillyTavern Git extension installer.

On that branch, run:

```bash
npm run build:release
```

This does two things:

- builds the extension into `dist/`
- copies the built runtime entry file to the repository root as `index.js`

The installer-facing runtime files expected in the repo root are:

- `manifest.json`
- `index.js`
- `settings.html`
- `style.css`

When testing installation through the SillyTavern Git extension installer, use the release-oriented branch rather than a development branch that only keeps runtime assets in `dist/`.

## Type Check

```bash
npm run typecheck
```

On Windows PowerShell:

```powershell
npm.cmd run typecheck
```

## Run In SillyTavern

1. Build the project.
2. Copy the contents of `dist/` into a SillyTavern third-party extension folder for this extension.
3. Start or reload SillyTavern.
4. Open the Extensions panel and enable `SceneState Extension`.
5. Turn on `Debug mode` in the extension settings.
6. Open a chat with a character whose card contains an `[Outfit]` section and whose scenario contains a `[Location]: ...` line.
7. Send or generate a character reply and inspect SillyTavern console logs.

## Install Through Git Installer

For installer-based setup, use the release-oriented branch that exposes runtime files in the repository root.

Expected root runtime files:

- `manifest.json`
- `index.js`
- `settings.html`
- `style.css`

After installation:

1. Reload SillyTavern.
2. Open the Extensions panel.
3. Confirm that `SceneState Extension` appears in the settings list.

## Expected M1 Runtime Behavior

- settings render in the Extensions UI
- only character messages are processed
- state is initialized lazily per chat
- location is parsed from `[Location]`
- outfit is parsed from `[Outfit]`
- prompt is built in danbooru-style tags
- prompt is logged, not injected into image generation yet

## Notes

- `dist/` is the installable artifact for the current build.
- SQLite, real LLM integration, and native prompt injection are not part of the current M1 runtime.
- Known UI issue: the SceneState inline drawer currently has a mismatched initial open/closed visual state. This is cosmetic and will be fixed later.
