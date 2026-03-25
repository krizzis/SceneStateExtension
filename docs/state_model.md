# SceneState Extension — State Model

## Overview

The extension maintains a single **current scene state** per chat session.

The state represents the latest known attributes of the scene and the active character.

There is no historical tracking in MVP — only the current state is stored and updated incrementally.

---

## State Structure

### Root Fields

* location: string | null
* emotion: string | null
* pose: string | null

### Outfit

Outfit is divided into explicit slots:

* outfit.top: string | null
* outfit.bottom: string | null
* outfit.bra: string | null
* outfit.panties: string | null
* outfit.legwear: string | null
* outfit.accessory: string | null

---

### Metadata

* metadata.last_updated_at: timestamp
* metadata.source_message_id: string
* metadata.confidence: number (0..1)

---

## State Semantics

### 1. Partial Updates

State is updated using **partial updates (diff-based)**.

Rules:

* Only fields explicitly present in the update are modified
* All other fields remain unchanged

---

### 2. Null Semantics

* `null` means the attribute is explicitly absent
* Example:

  * `"top": null` → character removed top clothing
* `undefined / missing` → no change

---

### 3. Confidence

Each update includes confidence information.

* Confidence is used by higher-level systems (e.g., background manager)
* State itself stores only the latest confidence value (MVP simplification)

---

### 4. Source Attribution

Each update stores:

* `source_message_id` — message that caused the update

This is used for debugging and traceability.

---

## Initialization Rules

At chat start:

* outfit is initialized from character card (rule-based parsing)
* location is extracted from scenario using pattern:

  * `[Location]: <value>`
* emotion = null
* pose = null

No LLM is used during initialization.

---

## Update Flow

1. New character message is received
2. The latest user message and the responding character message are grouped into one analysis turn when available
3. Context Analyzer produces structured diff
4. State Store applies diff:

   * updates only changed fields
   * respects null semantics
5. Metadata is updated:

   * timestamp
   * source_message_id
   * confidence

---

## Derived Logic (Not Stored)

The following are **not stored in state**, but derived when needed:

* nudity conditions (based on bra/panties/top/bottom)
* prompt formatting
* background selection mapping

---

## Constraints

* Single state per chat session
* No versioning
* No history
* No multi-character support

---

## Design Notes

* State is intentionally simple to ensure deterministic behavior
* Slot-based outfit model enables precise prompt construction
* Diff-based updates prevent unintended overwrites
* Separation of stored vs derived data keeps model clean and extensible

---
