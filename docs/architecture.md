# SceneState Extension — Architecture

## Overview

SceneState Extension is a SillyTavern extension that maintains a single current scene state for one active character per chat session.

The architecture is designed around small, clearly separated modules with deterministic responsibilities.

The extension must:

- observe character messages
- analyze scene changes through an LLM
- update and persist current state
- update chat background on confirmed location change
- build deterministic image prompts from stored state
- inject prompts into the native SillyTavern image generation pipeline

---

## Architectural Goals

- Keep runtime behavior deterministic
- Isolate LLM-dependent logic from state logic
- Keep SillyTavern-specific integration separate from domain logic
- Make storage, LLM provider, and semantic matching replaceable
- Minimize coupling between modules

---

## Runtime Components

### 1. Event Integration Layer

Responsible for connecting the extension to SillyTavern runtime events.

Responsibilities:

- detect new chat messages
- filter character messages
- trigger analysis flow
- hook into native image generation pipeline
- expose settings UI hooks
- emit debug logs to SillyTavern

This layer should not contain business logic.

---

### 2. Context Collector

Responsible for preparing analysis input from chat history.

Responsibilities:

- read current chat session context
- apply configured analysis mode:
  - last_message
  - recent_window
- apply configured window size
- return normalized context payload for analysis

This module is responsible only for context extraction, not interpretation.

---

### 3. LLM Adapter

Responsible for communication with the external LLM system.

Responsibilities:

- accept normalized analysis request
- send request to configured LLM backend
- receive raw response
- validate response shape
- return normalized structured diff result
- handle malformed or failed responses safely

This layer abstracts provider-specific logic and allows future replacement of model/backend without changing analyzer flow.

---

### 4. Context Analyzer

Responsible for scene interpretation.

Responsibilities:

- receive prepared context from Context Collector
- call LLM Adapter
- interpret structured diff response
- return normalized state update payload

This module does not persist data and does not apply UI changes.

---

### 5. State Store

Responsible for managing the current chat-bound state.

Responsibilities:

- initialize state for new chat
- load persisted state
- apply partial updates
- enforce null semantics
- update metadata
- persist current state to storage
- return current state to dependent modules

This is the source of truth for runtime scene state.

---

### 6. Initialization Module

Responsible for creating initial state at chat start.

Responsibilities:

- parse outfit from character card using rule-based logic
- extract location from scenario using explicit pattern:
  - `[Location]: <value>`
- initialize emotion as null
- initialize pose as null
- create first persisted state for chat session

This module must not use LLM.

---

### 7. Background Manager

Responsible for deciding and applying background changes.

Responsibilities:

- receive current location from state
- perform semantic matching against available backgrounds
- evaluate confidence / explicit confirmation conditions
- resolve best background candidate
- apply background update through SillyTavern APIs
- skip update if match is unreliable

This module should not modify scene state.

---

### 8. Prompt Builder

Responsible for deterministic prompt construction.

Responsibilities:

- read current state
- convert state fields into danbooru-style image prompt fragments
- apply deterministic formatting rules
- support an initial mechanical normalization strategy:
  - lowercase
  - spaces replaced with underscores
  - comma-separated values split into separate tags
- infer derived prompt conditions such as nudity from outfit slots
- return final generation-ready prompt

This module must not call LLM.

---

### 9. Image Generation Bridge

Responsible for integration with the native SillyTavern image generation flow.

Responsibilities:

- intercept generation request at integration point
- request current state from State Store
- request final prompt from Prompt Builder
- inject prompt into native generation pipeline
- preserve compatibility with existing ST image generation mechanisms

This module does not build prompts by itself.

---

### 10. Settings / Debug Module

Responsible for extension configuration and runtime diagnostics.

Responsibilities:

- expose settings UI
- store and load extension settings
- control enabled/disabled state
- control analysis mode and window size
- control debug mode
- send logs to SillyTavern when enabled

---

## Data Flow

### A. Chat Message Processing Flow

1. Event Integration Layer receives new message event
2. Message is checked:
   - if user message → ignore
   - if character message → continue
3. Context Collector gathers analysis input
4. Context Analyzer sends request through LLM Adapter
5. LLM Adapter returns normalized structured diff
6. State Store applies diff and persists updated current state
7. Background Manager evaluates location and possibly updates background

---

### B. Chat Initialization Flow

1. New chat session starts
2. Initialization Module reads character card and scenario
3. Initial state is created
4. State Store persists initial current state
5. Background Manager may resolve initial background if location is available

---

### C. Image Generation Flow

1. Native SillyTavern image generation is triggered
2. Image Generation Bridge intercepts request
3. State Store provides current state
4. Prompt Builder builds deterministic prompt
5. Image Generation Bridge injects prompt into native generation pipeline
6. Native ST flow continues normally

---

## State Ownership

The State Store owns the only authoritative current state for a chat session.

Other modules may:

- read state
- request updates
- derive outputs from state

Other modules must not directly mutate stored state.

---

## Storage Model

### Persistence Backend

- SQLite

### Storage Scope

- one current state per chat session

### Stored Data

- current state fields
- metadata
- minimal chat binding identifiers

### Not Stored in MVP

- state history
- multiple revisions
- derived prompt text
- background embeddings cache policy details

---

## Module Boundaries

### Domain Logic

Core logic modules:

- Context Collector
- Context Analyzer
- State Store
- Initialization Module
- Background Manager
- Prompt Builder

These modules should remain as independent as possible from SillyTavern APIs.

### Integration Logic

Platform-facing modules:

- Event Integration Layer
- Image Generation Bridge
- Settings / Debug Module

These modules handle SillyTavern-specific APIs and runtime hooks.

### Infrastructure Logic

Replaceable technical modules:

- LLM Adapter
- SQLite persistence implementation
- semantic search implementation for background matching

---

## Suggested Module Map

This is a logical module map, not a strict final file tree.

```text
src/
  core/
    analyzer/
    state/
    initialization/
    background/
    prompt/
    context/
  integration/
    st-events/
    image-generation/
    settings/
    logging/
  infrastructure/
    llm/
    storage/
    semantic-search/
  shared/
    models/
    config/
    utils/
```

---

## Dependency Direction

### Preferred dependency direction:
- integration → core
- core → infrastructure through interfaces/abstractions
- shared → usable by all
- infrastructure must not depend on integration

### Avoid:
- prompt builder depending on UI
- state store depending on SillyTavern runtime hooks
- analyzer directly embedding provider-specific network logic

---

## Failure Handling

### LLM Failure

If LLM call fails or returns invalid data:
- do not corrupt state
- keep previous state unchanged
- emit debug log if enabled

### Background Match Failure

If no reliable background match is found:
- do not change current background

### Storage Failure

If persistence fails:
- do not apply partial invalid state silently
- emit debug information
- fail safely

---

## Design Constraints
- single active character only
- one current state per chat session
- no state history
- no user message analysis
- no LLM-based prompt generation
- no replacement of native SillyTavern image generation system

---

## Extension Strategy

The extension should integrate with SillyTavern by augmentation, not replacement.
It should:
- observe
- analyze
- persist
- inject
- update UI state where appropriate

It should not reimplement existing native systems unless required by future scope.

---
