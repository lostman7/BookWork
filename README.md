# BookWork

BookWork is a concept for an AI-assisted writing workspace built around a split-screen workflow:

- a conversational **Panel AI** that lives in the side panel,
- a document-aware **Canvas AI** that works directly against the manuscript,
- and a shared **Project Memory Bar** across the top for characters, lore, outlines, references, and RAG sources.

## Core product idea

The strongest direction for BookWork is a **two-model handshake**:

1. The user chats with the Panel AI as the main interface.
2. The Panel AI interprets the request and turns it into a structured task.
3. The coordinator sends that task to the Canvas AI with page, chapter, selection, and RAG context.
4. The Canvas AI reviews or edits the manuscript and returns a structured result.
5. The Panel AI tells the user what happened in plain English.

This keeps **conversation context** separate from **document context**, which should reduce context-window waste and make the experience feel more deliberate.

## What should live in the top bar

The top area should not just be a generic upload strip. It should be a shared project layer used by both AIs:

- **Characters**: name, role, traits, voice, relationships, secrets, arc status.
- **World / lore**: settings, rules, timeline events, factions, magic or tech systems.
- **Story structure**: outline, chapter goals, scene cards, unresolved threads.
- **Reference files**: PDFs, notes, research, style guides, revision instructions.
- **RAG controls**: enable or disable a source, pin it to a chapter, mark it authoritative.

That top bar becomes the shared medium between both AIs, so the system can say “this fact came from the character sheet” or “this rewrite used the house style guide.”

## Suggested interface layout

A strong default layout would be:

- **Left sidebar**: Panel AI chat, task controls, and quick commands.
- **Center canvas**: manuscript pages, tracked changes, and inline suggestions.
- **Right drawer or bottom tray**: handshake log, source log, and job status history.
- **Top Project Memory Bar**: tabs for Characters, Lore, Outline, Sources, and Settings.

The log area matters because the user should be able to see when the Panel AI delegated work, when the Canvas AI accepted it, what sources it used, and whether the result is ready for review.

## Recommended system shape

Start with a lightweight orchestration layer instead of two totally free agents:

- one visible chat thread for the user,
- one hidden task protocol between Panel AI and Canvas AI,
- explicit scopes such as `current_selection`, `current_page`, `chapter_range`, or `full_manuscript`,
- and per-role model settings so the user can choose one model for chat and another for canvas work.

This preserves the “two minds working together” feel without creating a confusing double-chat experience.

## Provider flexibility

The system should support both **local** and **API-hosted** providers for each role independently.

Examples:

- Panel AI on Ollama or LM Studio for low-cost conversational work.
- Canvas AI on OpenRouter, OpenAI, Anthropic, Gemini, or xAI for deeper document review.
- Local embeddings plus remote reasoning, or the reverse, depending on speed and hardware.

That means users should be able to mix and match, such as:

- local chat + remote canvas,
- remote chat + local canvas,
- or fully local / fully hosted setups.

## Performance direction

The best performance gains will come from **role separation plus resource controls**:

- separate context limits for Panel AI and Canvas AI,
- separate model providers per role,
- independent keep-alive and batching behavior,
- and separate hardware preferences when a local backend supports them.

For Ollama specifically, per-request `num_ctx` and global/default context settings are worth exposing in the UI, and the app should report whether a model is running on CPU, GPU, or a split processor allocation.

## Practical efficiency ideas

If the user has limited VRAM, the app should let them do exactly what you described:

- keep a **smaller Panel AI** on the GPU for fast chat,
- give the **Canvas AI** a larger context budget for review jobs,
- place the Canvas AI on a different backend if needed,
- and store project memory locally so repeated jobs do not keep rebuilding the same context.

In practice, that means exposing per-role controls for:

- context window
- provider / model
- compute preference
- keep-alive behavior
- retrieval depth
- and edit permission mode

That is more efficient than making one giant model do chat, retrieval, planning, and manuscript review all inside the same context window.

## Detailed proposal

See `docs/dual-model-workflow.md` for the full handshake design, shared-memory model, and UI behavior.

See `docs/provider-routing-and-performance.md` for provider integration notes, API-key setup references, and performance recommendations.
