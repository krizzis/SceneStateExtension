# SceneState Extension — Requirements

## Functional Requirements

### 1. Message Processing

* The extension must detect new messages in the chat
* The extension must trigger analysis only when a **character message** is received
* The extension must pair the latest user message with the responding character message and treat them as one analysis unit
* The extension must not analyze user messages independently from the paired character response

---

### 2. Context Analysis

* The extension must trigger analysis after each character message
* The extension must collect context based on settings:

  * last turn only
  * recent window of turns
* The extension must support configurable window size
* Each turn must preserve the ordered `user -> character` structure when both messages are present
* If no immediately preceding user message exists, the character message may form a single-message turn

---

### 3. LLM Integration

* The extension must send context to an external LLM
* The extension must receive a **structured diff response**
* The extension must not rely on LLM to return full state

---

### 4. State Management

* The extension must maintain a **single current state per chat session**
* The extension must apply only changed fields from LLM response
* The extension must not overwrite fields that are not present in the diff
* The extension must support explicit null updates (e.g., clothing removal)
* The extension must update metadata:

  * last_updated_at
  * source_message_id
  * confidence

---

### 5. State Initialization

* The extension must initialize state at chat start
* The extension must extract location from scenario using pattern:

  * `[Location]: <value>`
* The extension must parse outfit from character card using rule-based logic
* The extension must initialize emotion and pose as null

---

### 6. Storage

* The extension must persist state using local storage
* The extension must use SQLite as storage backend
* The extension must restore state after restart
* The extension must store only the current state (no history)

---

### 7. Background Management

* The extension must evaluate location updates
* The extension must perform semantic matching between location and available backgrounds
* The extension must update background only if:

  * confidence is high, OR
  * location change is explicitly confirmed
* The extension must not change background if no reliable match is found

---

### 8. Image Generation Integration

* The extension must integrate with the native SillyTavern image generation pipeline
* The extension must not replace or bypass the native system
* The extension must construct image prompts from current state
* The extension must inject prompt into the generation pipeline before execution
* The extension must not use LLM for prompt construction

---

### 9. Prompt Building

* The extension must build prompts deterministically
* The extension must construct prompts in **danbooru-style tag format**
* The extension must use state fields as input
* For the initial implementation, prompt tags may be produced using deterministic mechanical normalization:
  * lowercase text
  * spaces replaced with underscores
  * comma-separated values split into separate tags
* The initial implementation must not depend on a danbooru tag synonym dictionary or semantic canonicalization
* The extension must support nudity inference based on outfit slots:

  * bra
  * panties

---

### 10. Settings UI

The extension must provide a settings panel with:

* enabled (on/off)
* analysis mode (last_turn / recent_turns)
* window size (numeric)
* debug mode (on/off)

---

### 11. Debugging

* The extension must support debug logging
* The extension must output logs to SillyTavern when debug mode is enabled

---

## Non-Functional Requirements

### 1. Performance

* The extension must not block the chat UI
* LLM calls must be asynchronous
* The extension must minimize unnecessary LLM calls

---

### 2. Reliability

* The extension must handle invalid or malformed LLM responses
* The extension must fail safely (no state corruption)

---

### 3. Determinism

* State updates must be predictable and reproducible
* Prompt generation must be deterministic

---

### 4. Extensibility

* The architecture must allow:

  * adding multi-character support
  * adding state history
  * adding advanced rules

---

### 5. Compatibility

* The extension must be compatible with SillyTavern extension system
* The extension must work with existing image generation integrations (e.g., ComfyUI)

---
