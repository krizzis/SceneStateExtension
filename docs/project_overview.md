# SceneState Extension — Project Overview

## Purpose

SceneState Extension is a SillyTavern extension that tracks and maintains the current scene state of a single active character during a chat session.

The extension automatically analyzes chat turn pairs composed of the latest user message and the responding character message, extracts structured scene attributes, and uses this data to:

* Maintain up-to-date scene context
* Dynamically update chat background based on location
* Provide deterministic input for image generation via the native SillyTavern pipeline (e.g., ComfyUI)

---

## MVP Scope

This project implements a minimal, stable, and deterministic system with the following capabilities:

### 1. Scene State Tracking

* Tracks **one active character per chat session**
* State is updated **after each character message**
* Analysis is triggered by a **character message**, but the analyzed context unit is the paired **user message + character message**
* User messages are not analyzed independently; they are only included together with the responding character message

### 2. State Structure

The extension maintains a single **current state**:

* location
* emotion
* pose
* outfit:

  * top
  * bottom
  * bra
  * panties
  * legwear
  * accessory
* metadata:

  * last_updated_at
  * source_message_id
  * confidence

### 3. State Update Model

* Uses **LLM-based analyzer**
* Analyzer returns **structured diff**, not full state
* Only explicitly changed fields are updated
* Unmentioned fields remain unchanged
* Explicit removal → `null`

### 4. Chat-Bound State

* State is tied to a **chat session**
* New chat = new state
* No shared global state

### 5. Initial State

At chat start:

* outfit → parsed from character card (rule-based)
* location → extracted from scenario using pattern:

  * `[Location]: <value>`
* emotion → null
* pose → null

No LLM is used for initialization.

---

## Background Management

* location is stored as **free text**
* background is selected via **semantic matching** against available backgrounds
* background updates only if:

  * high confidence OR
  * explicit location change

If no reliable match is found → no change

---

## Image Generation Integration

* Uses **native SillyTavern image generation pipeline**
* Extension does NOT replace generation system

Extension responsibilities:

* read current state
* build deterministic prompt in danbooru-style tag format
* inject prompt into generation pipeline

LLM is NOT used for prompt generation

---

## Storage

* Uses **local runtime storage (SQLite)**
* Persists across restarts
* Stores:

  * current state
  * metadata

No history tracking in MVP

---

## Settings (UI)

Minimal settings panel:

* enabled (boolean)
* analysis_mode:

  * last_turn
  * recent_turns
* window_size (number)
* debug_mode (boolean)

---

## High-Level Architecture

The extension is composed of the following modules:

### 1. Context Analyzer

* Triggered after each character message
* Collects context (based on settings) as one or more ordered `user + character` turn pairs
* Sends request to LLM
* Receives structured diff

### 2. State Store

* Maintains current state
* Applies diffs safely
* Persists to SQLite

### 3. Background Manager

* Resolves location → background via semantic search
* Applies background changes based on confidence rules

### 4. Prompt Builder

* Converts current state into deterministic image prompt in danbooru-style tag format
* Uses deterministic mechanical normalization in the initial implementation:
  * lowercase
  * spaces -> underscores
  * comma-separated values -> separate tags
* Applies rules (e.g., nudity based on outfit slots)

### 5. ST Integration Layer

* Hooks into SillyTavern lifecycle:

  * message events
  * image generation pipeline
* Injects prompt before generation

### 6. Settings / UI Module

* Provides minimal configuration
* Handles debug logging

---

## Technical Stack

* Language: TypeScript
* Platform: SillyTavern Extension API
* Storage: SQLite
* LLM: external (configurable, used only for analysis)

---

## Non-Goals (MVP)

* Multiple characters
* State history / memory system
* Standalone user message analysis without the paired character response
* Automatic image generation triggers
* Complex scene segmentation
* Multi-workflow routing
* Advanced conflict resolution

---

## Design Principles

* Deterministic behavior over creativity
* LLM used only for extraction, not generation
* Safe incremental updates (diff-based)
* Minimal UI, maximum automation
* Extensible architecture for future versions

---
