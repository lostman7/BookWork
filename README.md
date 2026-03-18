# BookWork

BookWork is now scaffolded as a **standalone Electron desktop app** for the dual-model writing workflow:

- a conversational **Panel AI** in the left sidebar,
- a document-focused **Canvas AI** in the main writing area,
- a shared **Project Memory Bar** across the top,
- and a visible **log surface** for handshakes, retrieval, and task status.

The goal is to make BookWork feel like an editor's desk instead of a generic chatbot.

## Current app shell

This repository now includes an Electron shell with:

- a dark desktop layout for chat, canvas, and logs,
- a settings dialog for Panel AI and Canvas AI model routing,
- local workspace bootstrapping for story files, characters, sources, logs, and role-specific memory,
- and a default project structure that the app creates in Electron's `userData` directory.

## Why Electron

Electron is a good fit for this project because it gives you:

- a standalone desktop app,
- easier local file and folder access,
- a predictable desktop-style layout for sidebars, editors, and settings,
- and a better path for integrating local model tools like Ollama and LM Studio.

## Workspace layout

On first launch, BookWork creates a local workspace with folders for:

- `story/` for manuscript files,
- `characters/` for character cards,
- `sources/` for RAG documents and notes,
- `logs/panel/` for Panel AI task and chat logs,
- `logs/canvas/` for Canvas AI execution logs,
- `memory/panel/` for panel-side floating memory,
- and `memory/canvas/` for canvas-side floating memory.

That matches your idea of a shared story area plus separate role-aware memory buckets.

## Interface layout

The current app shell is designed around this structure:

- **Left sidebar**: the only user-facing chat surface; the writer talks here and the Panel AI delegates work inward to the Canvas AI.
- **Center canvas**: manuscript surface with line numbers, text highlighting, and workspace file lists.
- **Right log rail**: handshake visibility, source usage, and memory state.
- **Top memory bar**: Story, Characters, Lore, Sources, and Logs tabs with an add action that saves new items into the local workspace.
- **Settings button**: model routing, context sizes, compute preference, and cache settings.

## Settings strategy

The app shell includes a settings dialog for:

- Panel AI provider and model dropdown,
- Canvas AI provider and model dropdown,
- locked Panel/Canvas mission presets and shared handshake commands,
- separate context windows for each role,
- compute preference for each role,
- keep-alive behavior,
- retrieval depth,
- floating memory size per role,
- selection-aware canvas work,
- and toast feedback for newly added project items.

That means the setup can match the workflow you described:

- a smaller, faster local chat model,
- a larger-context canvas model,
- local or hosted backends per role,
- and separate memory budgets instead of one overloaded context.

## Ollama-specific direction

For Ollama, the important controls to expose are:

- role-specific context sizing,
- provider selection for panel vs canvas,
- visible runtime state,
- and a clear indication that the app maps these settings to Ollama context controls like `num_ctx` and the global context configuration.

The main UX goal is to make Ollama setup feel less confusing than editing raw settings by hand. The settings screen now aims to populate model dropdowns from provider catalogs so the user can pick from real available models instead of memorizing names. The interaction rule is simple: the human only chats with the Panel AI, and the Canvas AI only receives delegated work from the Panel AI.

## Running the app

1. Install dependencies:
   - `npm install`
2. Start the Electron app:
   - `npm start`
3. Run the JS syntax checks used in this repo:
   - `npm run check`

## Project files

- `src/main.js` — Electron main process and IPC wiring.
- `src/preload.js` — safe bridge between renderer and main process.
- `src/lib/workspace.js` — local workspace initialization and settings persistence.
- `src/renderer/index.html` — desktop UI shell.
- `src/renderer/styles.css` — dark app styling.
- `src/renderer/app.js` — renderer bootstrapping and settings form logic.

## Detailed design docs

- `docs/dual-model-workflow.md` — handshake design, role boundaries, and task flow.
- `docs/provider-routing-and-performance.md` — provider adapters, routing, and performance guidance.
