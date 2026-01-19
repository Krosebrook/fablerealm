# FableRealm Technical Architecture

## 1. Overview
FableRealm follows a **Modular Simulation Pattern** where the visual layer (Three.js) is decoupled from the logical layer (SimulationService).

## 2. Core Systems

### Simulation Engine (`services/simulationService.ts`)
The game operates on a tick-based loop (default 2500ms).
- **Spatial Coverage Pass**: Calculates service radii (Guards, Mages, Wisdom) using a BFS-like grid traversal.
- **State Integration**: Pure function that accepts `(Grid, Stats)` and returns `(NewGrid, NewStats)`. This ensures determinism and simplified undo/redo capabilities.

### AI Service Layer (`services/geminiService.ts`)
Uses the `@google/genai` SDK with JSON schema enforcement.
- **Quest Generation**: Context-aware prompt engineering that analyzes building counts and gold reserves.
- **Atmospheric News**: Low-latency scrying for whimsical flavor text.

### Graphics & Interaction (`components/IsoMap.tsx`)
- **Instancing**: Currently uses memoized React components for 3D buildings.
- **Procedural Textures**: Custom Canvas-generated textures for terrain to minimize asset weight and improve offline speed.

### PWA & Persistence (`services/saveService.ts`)
- **Storage**: IndexedDB via Dexie.js (`FableRealmDB`).
- **Profile**: `KingdomProfile` structure to allow for future multi-user SaaS integration.
- **Offline**: Service worker manifests injected via `vite-plugin-pwa` to satisfy Chromium installability.

## 3. Data Flow
1.  **Input**: User clicks `IsoMap` or types in `WizardConsole`.
2.  **Action**: `ActionService` verifies cost/validity.
3.  **Update**: `App.tsx` updates React state (`grid`, `stats`).
4.  **Persist**: `SaveService` writes to Dexie (IndexedDB) asynchronously.
5.  **Simulate**: `SimulationService` tick runs every 2.5s, modifying state based on logic.
6.  **Augment**: `geminiService` occasionally fetches external text generation.

## 4. Trust Boundaries
- **Browser/User**: Untrusted. Full control over local state.
- **Google Gemini API**: Trusted External.
- **CDN (aistudiocdn.com)**: Trusted Resource.

## 5. Failure Modes
- **Offline**: Game continues; AI features (`geminiService`) degrade gracefully (fail-silent).
- **Storage Quota**: `SaveService` may fail if IndexedDB is full; error logged to console.
- **API Quota**: AI requests fail; fallback to no-op or error message in `WizardConsole`.

<!--
Source: code
Locator: services/simulationService.ts, services/saveService.ts
Confidence: HIGH
Last Verified: 2023-10-27
-->