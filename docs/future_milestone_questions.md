# SceneState Extension — Deferred Milestone Questions

## Purpose

This file collects questions intentionally deferred beyond Milestone 1.

The goal is to keep Milestone 1 implementation unblocked while preserving the open decisions that should be revisited before later milestones begin.

---

## Milestone 3 — Persistence Layer

### Storage Backend

- How will SQLite be accessed from a SillyTavern third-party extension in the actual runtime environment?
- Is SQLite still the mandatory MVP backend after validating SillyTavern integration constraints?
- If SQLite requires an adapter bridge, where should that bridge live and how should it be packaged?

### Persistence Behavior

- What is the stable chat-binding identifier for persisted state?
- When exactly should persisted state be restored during extension startup?
- What should happen if storage initialization fails but the extension can still run in-memory?

---

## Milestone 4 — Analysis Input Pipeline

### Context Collection

- What exact SillyTavern chat data shape should be treated as the source of truth for recent-window collection?
- How should message ordering be derived when SillyTavern context fields differ between versions?
- What exact pairing rule should be used when multiple user messages appear before one character reply?

---

## Milestone 5 — LLM Integration

### Provider / Transport

- Which LLM provider will be used first?
- How will authentication and endpoint configuration be stored?
- What timeout and retry policy should be applied?

### Schema / Validation

- What exact structured diff schema should the provider return?
- Should confidence be a global update-level value, field-level values, or both?
- How strict should validation be before converting malformed responses into no-op diffs?

---

## Milestone 7 — Prompt Construction Follow-Up

### Tag Quality

- Should canonical danbooru tag mapping use a local dictionary, curated rules, or another strategy?
- How should synonyms and ambiguous phrases be normalized?
- Which values should remain literal even after canonicalization rules are introduced?

### Derived Rules

- What exact nudity inference rules should be derived from `top`, `bottom`, `bra`, and `panties`?
- Should derived tags be additive only, or can they suppress raw outfit tags in some cases?

---

## Milestone 8 — Native Image Generation Integration

### Hook Point

- What is the exact native SillyTavern image-generation interception point in the target runtime version?
- How should prompt injection coexist with existing prompt text already present in the generation request?
- Should SceneState tags prepend, append, or merge into existing native prompt content?

### Compatibility

- What compatibility guarantees are required for ComfyUI and other native image integrations?
- Which integration behaviors require smoke tests before enabling prompt injection by default?

---

## Milestone 9 — Background Management

### Background Inventory

- What is the source of available background candidates?
- How are backgrounds identified and addressed through SillyTavern APIs?
- Is there a stable background metadata structure available at runtime?

### Matching Policy

- What semantic matching strategy is acceptable within MVP limits?
- What confidence threshold should trigger a background change?
- What counts as an explicit location confirmation versus a weak inference?

---

## Milestone 10 — Settings and Debugging Follow-Up

### UX / Operations

- Should later milestones add manual debug actions such as “log current state” or “preview prompt”?
- Should advanced settings remain hidden until the related features are implemented?
- How should migration be handled if setting keys evolve after Milestone 1?
