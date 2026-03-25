# Issue: M1 SillyTavern Runtime Integration

## Status

Implemented

---

## Goal

Make the Milestone 1 vertical slice work against real SillyTavern runtime behavior instead of only against assumed event and context shapes.

---

## Why This Issue Exists

The current scaffold already provides:

- installable extension structure
- settings wiring
- in-memory state initialization
- stub analyzer flow
- deterministic prompt logging

The main remaining M1 risk is the integration layer:

- actual `event_types` names may differ from current assumptions
- message-event payloads may not match the current generic extractor
- `getContext()` field shapes may differ between SillyTavern versions
- settings mount timing may require more defensive runtime handling

---

## Scope

- verify and harden message-event subscriptions
- verify and harden chat lifecycle subscriptions
- improve runtime guards around missing chat/message/context data
- adapt context extraction to more realistic SillyTavern message shapes
- preserve M1 constraints:
  - no LLM integration
  - no prompt injection
  - no persistence

---

## Expected Outcome

After this issue is complete:

- the extension should subscribe to plausible SillyTavern runtime events conservatively
- message handling should be more robust to payload shape variations
- chat initialization should remain safe when runtime context is incomplete
- the M1 debug flow should be easier to validate in a live SillyTavern session

## Actual Outcome

- runtime event handling was adapted to the current SillyTavern API shape
- startup no longer relies on an outdated `loadExtensionSettings(extensionName)` pattern
- template rendering now resolves the runtime extension path dynamically
- settings render successfully in the Extensions UI for installed copies
- installer-compatible repository layout was prepared on the release-oriented branch

---

## Notes

- This issue is implementation-focused, not only a manual test task.
- Manual smoke-testing in SillyTavern is still needed after the code changes land.
- A small cosmetic drawer-state mismatch remains and is intentionally deferred.
