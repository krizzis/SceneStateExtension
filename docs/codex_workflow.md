# SceneState Extension — Codex Workflow

## Purpose

This workflow defines how Codex should operate in the project.

The project uses a flexible implementation workflow:
- Codex may help with planning
- Codex may propose implementation details
- Codex may suggest file structure and local refactors

However, Codex must still operate within documented project boundaries and must not invent scope beyond the current task.

---

## Core Working Model

For each task, Codex should follow this sequence:

1. understand the task in project context
2. identify affected modules
3. propose a short implementation plan
4. implement only the required scope
5. summarize changes clearly
6. list assumptions, risks, and follow-up work if relevant

Codex may assist with both planning and implementation, but must keep behavior controlled and explicit.

---

## Source of Truth

Codex must treat project documentation as the source of truth.

If multiple documents exist, Codex should prefer them in this order:

1. project_overview.md
2. requirements.md
3. architecture.md
4. state_model.md
5. integration_contracts.md
6. this workflow document

If implementation assumptions conflict with documentation, documentation wins.

Codex must not silently override documented behavior.

---

## Allowed Codex Behavior

Codex may:

- propose implementation approach
- suggest module boundaries
- create new files when needed
- refactor small local code areas when required for the task
- add types, interfaces, validation, and helper utilities
- improve code clarity if directly related to the task
- add safe debug logging if relevant

---

## Forbidden Codex Behavior

Codex must not:

- expand MVP scope without explicit instruction
- introduce multi-character logic
- add state history or memory systems
- add standalone user-message analysis outside the paired turn with the responding character message
- replace native SillyTavern image generation flow
- use LLM for prompt generation
- rewrite unrelated modules
- perform broad architecture refactors without need
- change integration contracts silently
- introduce hidden behavior not described in code or docs

---

## Task Size Rules

Codex should prefer small and bounded tasks.

A good task should affect one of:

- one module
- one integration point
- one data contract
- one UI/settings area
- one bug or one narrow feature

If a task is too large, Codex should split it into smaller implementation steps.

---

## Planning Format

Before implementation, Codex should briefly state:

- goal
- affected modules
- intended approach
- files likely to change

The plan should be short and implementation-oriented.

---

## Implementation Rules

### 1. Respect Module Boundaries

Codex must preserve separation between:

- core logic
- integration logic
- infrastructure logic

### 2. Prefer Deterministic Logic

Codex should prefer explicit and deterministic code over clever or implicit behavior.

### 3. Keep Side Effects Local

State changes must go through State Store.
LLM calls must go through LLM Adapter.
Prompt construction must stay in Prompt Builder.

### 4. Fail Safely

If an external dependency fails:
- preserve previous valid state
- avoid partial corruption
- log useful debug information if debug mode is enabled

### 5. Avoid Premature Generalization

Codex should solve the current scope, not future hypothetical scope.

---

## Change Rules

Codex should clearly distinguish between:

- required changes
- optional improvements
- assumptions

If a useful improvement is outside scope, Codex should suggest it separately instead of mixing it into implementation.

---

## File Creation Rules

Codex may create files when needed, but should prefer a clean modular structure.

New files should be created only if they:

- isolate a real responsibility
- improve maintainability
- support existing architecture

Codex should avoid file explosion for trivial logic.

---

## Refactoring Rules

Codex may perform limited refactoring only when:

- needed to implement the task correctly
- needed to preserve module boundaries
- needed to remove obvious duplication blocking the task

Large refactors should be proposed before implementation, not bundled silently.

---

## Debugging Rules

When working on uncertain integrations, Codex should:

- prefer observable behavior
- add minimal debug logging
- keep logs easy to disable
- avoid noisy logging in normal mode

---

## Output Expectations

After implementation, Codex should report:

- what changed
- which files changed
- why the change was made
- any assumptions
- any known limitations

The summary should be concise and concrete.

---

## Review Expectations

Codex should support lightweight review by making changes easy to inspect.

Codex should aim for:

- small diffs
- readable code
- explicit naming
- comments only where useful
- predictable control flow

---

## Suggested Task Types

Good tasks for Codex in this project:

- create State Store skeleton
- implement scenario location parser
- add SQLite persistence for current state
- add LLM response validator
- implement background selection flow
- implement deterministic prompt builder
- add settings panel fields
- wire message event hook
- inject prompt into native image generation flow

---

## Decision Policy

When the documentation does not specify a low-level implementation detail, Codex may choose a reasonable solution that:

- matches current architecture
- keeps scope minimal
- remains easy to replace later

Codex should make such assumptions explicit in its summary.

---

## Design Intent

This workflow is flexible, but not uncontrolled.

Codex is allowed to help think through implementation, but must stay inside:
- documented scope
- module boundaries
- integration contracts
- deterministic design principles

The goal is fast progress without losing architectural consistency.

---
