# SceneState Extension — Milestone 1 Summary

## Goal

Deliver an installable vertical slice of the extension that proves the runtime wiring inside SillyTavern without introducing high-risk infrastructure dependencies.

---

## Milestone 1 Scope

Milestone 1 includes:

- installable third-party extension scaffold
- TypeScript project setup
- build output to `dist/`
- minimal extension manifest and runtime assets
- settings UI and settings persistence wiring
- runtime enable/disable guard
- character-message-only processing flow
- lazy chat-bound in-memory scene state initialization
- scenario location parsing from `[Location]: <value>`
- character card outfit parsing from `[Outfit]`
- stub analyzer flow returning an empty diff
- deterministic prompt building in danbooru-style tag format
- debug logging for state, normalized tags, and final prompt string
- successful rendering of extension settings in the SillyTavern Extensions UI

---

## Milestone 1 Decisions

### Extension Identity

- `slug`: `scene-state-extension`
- `display_name`: `SceneState Extension`
- initial version: `0.1.0`

### Build / Tooling

- language: TypeScript
- package manager: `npm`
- bundler: `tsup`
- artifact output: `dist/`
- `dist/` must contain an installable extension artifact

### Runtime Scope

- state storage in M1 is in-memory only
- state is chat-bound
- no persistence across restart in M1
- prompt injection is not implemented in M1
- background matching is not implemented in M1
- analyzer flow is present but stubbed with a no-op diff
- Git-installer compatibility is supported through a release-oriented branch layout

### Initialization Rules

- `location` is initialized from scenario text using `[Location]: <value>`
- `outfit` is initialized from the character card using `[Outfit]`
- `emotion` initializes to `null`
- `pose` initializes to `null`
- state is initialized lazily for a chat on first use

### Outfit Parsing Rules

Supported outfit slots:

- `top`
- `bottom`
- `bra`
- `panties`
- `legwear`
- `accessory`

Parsing rules:

- parse only the `[Outfit]` section
- parse lines in `key: value` format
- allow multiple values in a slot as a comma-separated string
- unsupported keys are ignored
- missing slots are initialized as `null`

### Prompt Rules

- prompt format is danbooru-style tags
- prompt building is deterministic
- prompt values are emitted without field-name prefixes
- `location` contributes only its value, not `location:<value>`
- outfit slots contribute only their values, not slot names
- initial normalization strategy is mechanical:
  - lowercase text
  - spaces replaced with underscores
  - comma-separated values split into separate tags
- initial implementation does not perform synonym mapping or canonical danbooru tag resolution

### Debug Logging

When `debug_mode` is enabled, logs should include:

- message-flow checkpoints
- initialized state
- current state used for prompt building
- normalized tag array
- final prompt string

---

## Milestone 1 Non-Goals

Milestone 1 explicitly does not include:

- SQLite persistence
- state restore after restart
- real LLM provider integration
- diff validation beyond stub flow
- native image generation prompt injection
- background matching and updates
- danbooru tag canonicalization
- nudity inference rules

---

## Exit Criteria

Milestone 1 is complete when:

- the extension builds successfully into `dist/`
- `dist/` contains an installable extension artifact
- settings render and save
- the extension processes only character messages
- a chat can initialize an in-memory current state
- a deterministic danbooru-style prompt is built from the current state
- debug logs make the full M1 flow observable

## Known M1 Follow-Up

- The inline drawer for the extension settings currently has a cosmetic mismatch between the icon state and the content visibility state on first render.
