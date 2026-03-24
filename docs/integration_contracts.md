# SceneState Extension — Integration Contracts

## Overview

This document defines the interaction contracts between modules and external systems.

Contracts describe:

- inputs and outputs
- responsibilities
- allowed side effects

Contracts must remain stable to ensure predictable behavior and safe integration.

---

## Internal Contracts

### 1. Context Collector → Context Analyzer

#### Input

- chat session identifier
- analysis mode (last_message | recent_window)
- window size

#### Output

- normalized context payload (ordered messages)
- includes only character messages

#### Rules

- must not interpret content
- must not modify state
- must not call LLM

---

### 2. Context Analyzer → LLM Adapter

#### Input

- normalized context payload

#### Output

- structured diff result (normalized)

#### Rules

- analyzer does not handle networking
- analyzer does not persist state
- analyzer does not perform validation beyond basic structure

---

### 3. LLM Adapter → Context Analyzer

#### Input

- analysis request payload

#### Output

- structured diff (validated or rejected)

#### Responsibilities

- handle communication with LLM provider
- validate response structure
- normalize result format
- return safe fallback if invalid

#### Failure Behavior

- on invalid response → return empty/no-op diff
- must not throw unhandled errors to upstream modules

---

### 4. Context Analyzer → State Store

#### Input

- structured diff result

#### Output

- update request

#### Rules

- analyzer does not apply updates directly
- analyzer does not access storage

---

### 5. State Store (Update Contract)

#### Input

- partial update (diff)

#### Behavior

- apply only provided fields
- preserve existing values for missing fields
- apply null semantics for explicit removals
- update metadata

#### Output

- updated current state

#### Constraints

- must remain single source of truth
- must persist state after update

---

### 6. State Store → Background Manager

#### Input

- current state (location field)

#### Output

- background candidate or no-op

#### Rules

- background manager must not modify state
- background manager operates on read-only state

---

### 7. State Store → Prompt Builder

#### Input

- full current state

#### Output

- deterministic prompt

#### Rules

- prompt builder must not modify state
- prompt builder must not call LLM

---

## External Contracts

### 8. SillyTavern Event System → Event Integration Layer

#### Input

- message events
- chat lifecycle events

#### Responsibilities

- detect new messages
- identify message source (character vs user)

#### Rules

- only character messages trigger analysis flow
- must not block UI thread

---

### 9. Event Integration Layer → Context Collector

#### Input

- message event trigger

#### Output

- analysis request

---

### 10. Image Generation Hook (SillyTavern)

#### Input

- generation request event

#### Responsibilities

- allow extension to modify prompt before generation

---

### 11. Image Generation Bridge → SillyTavern

#### Input

- original generation request
- injected prompt

#### Output

- modified request passed to native pipeline

#### Rules

- must not break native generation flow
- must preserve compatibility with existing integrations (e.g., ComfyUI)

---

### 12. Prompt Builder → Image Generation Bridge

#### Input

- current state

#### Output

- final prompt string

#### Rules

- output must be deterministic
- must not depend on runtime randomness

---

### 13. LLM Adapter → External LLM

#### Input

- structured analysis request

#### Output

- structured diff response

#### Requirements

- response must follow expected schema
- adapter must validate before passing upstream

---

### 14. Storage Layer (SQLite)

#### Input

- state write requests
- state read requests

#### Output

- persisted state
- restored state

#### Rules

- must guarantee persistence across restarts
- must not expose partial writes

---

## Contract Stability Rules

- contracts must be backward-compatible once implemented
- breaking changes must be explicitly documented
- internal contracts should not leak platform-specific details
- external contracts must respect SillyTavern API constraints

---

## Allowed Side Effects

| Module                  | Allowed Side Effects                |
|------------------------|------------------------------------|
| Event Integration      | logging, triggering flows          |
| Context Collector      | none                               |
| Context Analyzer       | none                               |
| LLM Adapter            | network requests                   |
| State Store            | storage writes                     |
| Background Manager     | UI background update               |
| Prompt Builder         | none                               |
| Image Generation Bridge| modify generation request          |
| Settings Module        | UI updates, config persistence     |

---

## Forbidden Behaviors

- direct state mutation outside State Store
- LLM usage outside LLM Adapter
- prompt generation using LLM
- blocking UI thread with synchronous operations
- tight coupling between core logic and SillyTavern APIs

---

## Design Intent

The contract system ensures:

- modular development
- safe parallel work (Codex tasks)
- easier debugging and logging
- future extensibility without breaking core behavior

---