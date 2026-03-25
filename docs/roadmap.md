# SceneState Extension — Project Roadmap

## Purpose

This document translates the current MVP requirements and architecture into a practical delivery roadmap using **milestones** and **issues**.

It is intended to support:

- implementation planning
- issue creation
- milestone setup
- sprint sequencing

This roadmap follows the project source of truth in:

- `project_overview.md`
- `requirements.md`
- `architecture.md`
- `state_model.md`
- `integration_contracts.md`
- `codex_workflow.md`

If this roadmap conflicts with those documents, the source documents win.

---

## MVP Constraints

The roadmap assumes the documented MVP boundaries remain unchanged:

- single character only
- one current state per chat session
- no state history
- trigger analysis on character messages and analyze `user + character` turn pairs
- LLM used only for structured context analysis
- prompt generation must be deterministic in code
- native SillyTavern image generation pipeline must be preserved

---

## Milestone 1. Core Foundations

### Goal

Establish the project skeleton and define stable contracts between modules.

### Issues

#### 1. Create project module skeleton

- Scope: create `src/core`, `src/integration`, `src/infrastructure`, `src/shared`
- Output: base folders and entry points
- Acceptance criteria: structure aligns with `architecture.md`

#### 2. Define shared domain models

- Scope: define `SceneState`, `OutfitState`, `StateMetadata`, `SceneStateDiff`
- Output: shared TypeScript models
- Acceptance criteria: all fields from `state_model.md` are covered

#### 3. Define service interfaces and contracts

- Scope: define interfaces for `StateStore`, `LlmAdapter`, `StorageAdapter`, `BackgroundResolver`, `PromptBuilder`
- Output: typed contracts for module interaction
- Acceptance criteria: dependencies follow `integration -> core -> infrastructure via interfaces`

#### 4. Define extension settings model

- Scope: define `enabled`, `analysis_mode`, `window_size`, `debug_mode`
- Output: `ExtensionSettings` model and defaults
- Acceptance criteria: all settings from `requirements.md` are represented

---

## Milestone 2. State Management

### Goal

Implement the core state model and chat initialization flow.

### Issues

#### 1. Implement state diff application logic

- Scope: partial updates, `null` semantics, preservation of missing fields
- Output: diff application logic inside the State Store
- Acceptance criteria: missing fields remain unchanged, explicit `null` removes the value

#### 2. Implement state metadata updates

- Scope: update `last_updated_at`, `source_message_id`, `confidence`
- Output: shared metadata update logic
- Acceptance criteria: metadata is updated on every valid state update

#### 3. Implement scenario location parser

- Scope: parse `[Location]: <value>` from scenario text
- Output: initialization utility/module
- Acceptance criteria: location is extracted without LLM usage

#### 4. Implement character card outfit parser

- Scope: rule-based initial outfit parsing
- Output: initialization logic for outfit slots
- Acceptance criteria: outfit state is derived without LLM and supports nullable slots

#### 5. Implement initial state creation flow

- Scope: combine scenario location, character card outfit, and null defaults for emotion and pose
- Output: initialization module
- Acceptance criteria: a new chat session produces a valid initial current state

---

## Milestone 3. Persistence Layer

### Goal

Persist the current scene state safely across restarts.

### Issues

#### 1. Design SQLite schema for current scene state

- Scope: one current state per chat session
- Output: schema or migration
- Acceptance criteria: schema stores state fields, metadata, and chat binding identifiers

#### 2. Implement SQLite storage adapter

- Scope: save and load current state
- Output: infrastructure storage module
- Acceptance criteria: core logic does not depend on SQLite-specific APIs directly

#### 3. Implement state restore on startup

- Scope: restore persisted state when the extension starts
- Output: bootstrap restore flow
- Acceptance criteria: previously saved state is loaded automatically

#### 4. Handle storage failures safely

- Scope: safe error handling and debug logging
- Output: guarded persistence behavior
- Acceptance criteria: no silent corruption and no partial invalid writes

---

## Milestone 4. Analysis Input Pipeline

### Goal

Prepare the correct chat context for analysis.

### Issues

#### 1. Implement context collector for `last_turn` mode

- Scope: collect only the latest `user + character` turn
- Output: normalized context payload
- Acceptance criteria: the paired user message is included only as part of the same turn as the character response

#### 2. Implement context collector for `recent_turns` mode

- Scope: collect a window of recent turns using `window_size`
- Output: normalized ordered turn payload
- Acceptance criteria: collector respects ordering and configured window size

#### 3. Normalize context payload format

- Scope: define a single payload structure for the analyzer
- Output: analysis request builder
- Acceptance criteria: analyzer receives a consistent input shape

---

## Milestone 5. LLM Integration

### Goal

Connect the external LLM safely and only for structured diff extraction.

### Issues

#### 1. Implement LLM adapter abstraction

- Scope: provider-agnostic interface and implementation boundary
- Output: infrastructure LLM module
- Acceptance criteria: networking is isolated inside the adapter

#### 2. Define structured diff response schema

- Scope: describe the expected LLM response shape
- Output: schema and related types
- Acceptance criteria: schema covers location, emotion, pose, outfit fields, and confidence

#### 3. Implement LLM response validation and normalization

- Scope: validate and normalize LLM output
- Output: safe `AnalysisResult`
- Acceptance criteria: malformed responses are converted into safe no-op updates

#### 4. Implement analyzer service orchestration

- Scope: connect collector, adapter, and normalized diff output
- Output: core analyzer module
- Acceptance criteria: analyzer does not contain persistence logic or provider-specific networking

---

## Milestone 6. SillyTavern Message Flow

### Goal

Integrate analysis into the chat runtime flow without blocking the UI.

### Issues

#### 1. Identify and wire SillyTavern message event hooks

- Scope: find and integrate the required runtime events
- Output: event integration module
- Acceptance criteria: the extension receives new message events reliably

#### 2. Filter character messages only

- Scope: distinguish character messages from user messages
- Output: message source guard
- Acceptance criteria: user messages never trigger analysis by themselves

#### 3. Trigger asynchronous analysis after character messages

- Scope: launch the analysis pipeline without blocking the UI thread
- Output: async integration flow
- Acceptance criteria: runtime remains responsive during analysis

#### 4. Connect analyzer output to the State Store

- Scope: update current state after validated diffs
- Output: end-to-end message processing flow
- Acceptance criteria: character messages produce predictable state updates

---

## Milestone 7. Prompt Construction

### Goal

Build deterministic image prompts from the current state.

### Issues

#### 1. Define deterministic prompt composition rules

- Scope: map state fields into prompt fragments
- Output: prompt-building rules documented in code
- Acceptance criteria: identical state always produces identical prompt output
- Notes: initial implementation may use mechanical danbooru-style normalization without tag dictionary canonicalization

#### 2. Implement Prompt Builder

- Scope: create the final generation-ready prompt string
- Output: core prompt module
- Acceptance criteria: prompt building does not use LLM or UI-specific logic

#### 3. Implement derived nudity inference

- Scope: infer derived prompt conditions from outfit slots such as `bra` and `panties`
- Output: derived logic inside Prompt Builder
- Acceptance criteria: derived conditions are not persisted back into state

#### 4. Plan tag canonicalization follow-up

- Scope: document future support for canonical danbooru tag mapping, synonyms, and normalization rules beyond mechanical formatting
- Output: follow-up issue/spec for a later milestone session
- Acceptance criteria: future prompt-quality work is separated from the initial deterministic implementation

---

## Milestone 8. Native Image Generation Integration

### Goal

Inject generated prompts into the native SillyTavern image generation pipeline without replacing it.

### Issues

#### 1. Identify native image generation hook point

- Scope: find the correct interception point in the native generation flow
- Output: integration design for prompt injection
- Acceptance criteria: native generation flow remains intact

#### 2. Implement image generation bridge

- Scope: read current state, build the prompt, inject it into the generation request
- Output: integration bridge module
- Acceptance criteria: generation requests are augmented without breaking native behavior

#### 3. Validate compatibility with existing image integrations

- Scope: smoke-test native flow and ComfyUI-like integrations
- Output: compatibility verification
- Acceptance criteria: existing integrations continue to work

---

## Milestone 9. Background Management

### Goal

Update the chat background from location data without false-positive changes.

### Issues

#### 1. Define background matching strategy

- Scope: select a semantic matching approach within MVP limits
- Output: background resolver contract and matching policy
- Acceptance criteria: strategy stays minimal and aligned with project scope

#### 2. Implement background resolver

- Scope: resolve the best background candidate from free-text location
- Output: resolver implementation
- Acceptance criteria: resolver returns either a confident candidate or a no-op result

#### 3. Implement background update decision rules

- Scope: apply updates only on high confidence or explicit location confirmation
- Output: decision policy in Background Manager
- Acceptance criteria: weak or ambiguous matches do not change the background

#### 4. Wire background updates after state changes

- Scope: trigger background evaluation after valid state updates
- Output: end-to-end background update flow
- Acceptance criteria: Background Manager reads state but does not mutate it

---

## Milestone 10. Settings and Debugging

### Goal

Make the extension configurable and observable at runtime.

### Issues

#### 1. Implement settings persistence and defaults

- Scope: store and load extension settings
- Output: settings persistence module
- Acceptance criteria: settings survive reloads and restarts as expected

#### 2. Build minimal settings UI

- Scope: expose `enabled`, `analysis_mode`, `window_size`, `debug_mode`
- Output: settings panel
- Acceptance criteria: all documented MVP settings are user-configurable

#### 3. Implement debug logging

- Scope: add logs for message flow, LLM failures, storage failures, and prompt injection
- Output: runtime logging hooks
- Acceptance criteria: logs are emitted only when `debug_mode` is enabled

#### 4. Implement enabled/disabled runtime guard

- Scope: fully disable extension behavior when turned off
- Output: runtime feature gate
- Acceptance criteria: the extension does not interfere with chat or generation flow when disabled

---

## Milestone 11. Testing and Stabilization

### Goal

Make the MVP stable, predictable, and safe to iterate on.

### Issues

#### 1. Add unit tests for state diff semantics

- Scope: test partial updates, null removal, and metadata updates
- Output: State Store unit tests
- Acceptance criteria: key state rules are covered by tests

#### 2. Add unit tests for prompt determinism

- Scope: verify stable prompt generation for identical state
- Output: Prompt Builder unit tests
- Acceptance criteria: repeated runs produce identical output

#### 3. Add tests for malformed LLM response handling

- Scope: validate fallback behavior in validator and analyzer
- Output: safety tests for invalid LLM output
- Acceptance criteria: invalid responses do not corrupt state or crash the flow

#### 4. Run end-to-end smoke test in SillyTavern

- Scope: verify the flow `message -> analysis -> state update -> prompt injection`
- Output: validated MVP scenario
- Acceptance criteria: the main user flow works manually from start to finish

#### 5. Document known MVP limitations

- Scope: record explicit non-goals and current constraints
- Output: short limitations note
- Acceptance criteria: future ideas remain clearly separated from MVP scope

---

## Recommended Milestone Order

1. Core Foundations
2. State Management
3. Persistence Layer
4. Analysis Input Pipeline
5. LLM Integration
6. SillyTavern Message Flow
7. Prompt Construction
8. Native Image Generation Integration
9. Settings and Debugging
10. Background Management
11. Testing and Stabilization

---

## High-Priority Starting Issues

If implementation should begin with the smallest useful set of tasks, start with:

1. Define shared domain models
2. Implement state diff application logic
3. Implement initial state creation flow
4. Design SQLite schema for current scene state
5. Implement context collector for `last_turn` mode
6. Implement LLM response validation and normalization

---

## Critical Path

The core MVP delivery path is:

`contracts -> state core -> persistence -> context collection -> LLM adapter -> analyzer pipeline -> SillyTavern message hook -> prompt builder -> image bridge -> stabilization`

Background management can be implemented slightly later if the team wants to prioritize the main image-generation workflow first.

---

## Main Risks

- SillyTavern runtime hook points may be less straightforward than expected.
- LLM responses may be inconsistent unless validation is strict.
- Background semantic matching may expand in complexity if not tightly scoped.
- Persistence may become overdesigned unless kept focused on one current state per chat.

---

## Definition of MVP Done

The MVP can be considered complete when:

- the extension triggers analysis from character messages only
- each character message can trigger a safe analysis pipeline using the paired `user + character` turn
- current state updates are applied predictably and persisted
- prompt generation is deterministic and code-driven
- prompt injection works through the native SillyTavern image generation flow
- settings and debug mode are functional
- LLM or storage failures do not corrupt runtime state

---
