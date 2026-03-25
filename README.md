# SceneState Extension

SceneState Extension is a SillyTavern third-party extension for tracking the current scene state of a single active character per chat.

Current repository status:

- Milestone 1 scaffold is implemented
- build output is generated into `dist/`
- runtime flow currently focuses on settings, chat-bound in-memory state, stub analysis, and prompt logging

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
