# Provider Routing and Performance Plan

## Goal

BookWork should let the user choose different providers and models for the two AI roles:

- **Panel AI** for chat, planning, and delegation.
- **Canvas AI** for page-level review, rewrite, and document analysis.

That means the app needs a provider layer that can mix:

- local backends,
- hosted API providers,
- different context limits per role,
- and separate hardware or runtime preferences when the backend supports it.

## Recommended architecture

### 1. Provider adapters

Use a provider adapter per backend rather than hard-coding one API style.

Recommended adapter families:

- `ollama`
- `lm_studio`
- `openrouter`
- `openai`
- `anthropic`
- `gemini`
- `xai`

Each adapter should normalize the following fields:

- provider name,
- base URL,
- auth mode,
- model identifier,
- streaming support,
- structured output support,
- context setting support,
- timeout,
- and error shape.

### 2. Per-role model profiles

Store separate model profiles for the panel and canvas roles.

This is important because the two roles should not share the same defaults. The Panel AI usually needs faster replies and a smaller context, while the Canvas AI may need a larger context and slower, more deliberate execution.

Example:

```json
{
  "panel_ai": {
    "provider": "ollama",
    "model": "qwen3:8b",
    "context_window": 8192,
    "temperature": 0.7,
    "compute_preference": "gpu",
    "purpose": "chat"
  },
  "canvas_ai": {
    "provider": "openrouter",
    "model": "anthropic/claude-sonnet-4",
    "context_window": 32000,
    "temperature": 0.2,
    "purpose": "document_review"
  }
}
```

### 3. Shared embeddings / memory profile

Treat retrieval as its own subsystem.

The shared memory and RAG layer should have its own profile for:

- embedding provider,
- chunking strategy,
- index location,
- and source-priority rules.

That prevents the manuscript agents from having to carry the entire project state in a normal chat history.

## Provider notes from official docs

### Ollama

Official docs say Ollama serves its local API at `http://localhost:11434/api`, and the FAQ documents both a global `OLLAMA_CONTEXT_LENGTH` setting and request-level `options.num_ctx` overrides for context sizing. The same FAQ also documents `ollama ps`, which reports whether a loaded model is using CPU, GPU, or a mixed processor allocation. Source: <https://docs.ollama.com/api>, <https://docs.ollama.com/faq>

#### What BookWork should expose for Ollama

- base URL
- model picker
- context window override per role
- keep-alive behavior
- processor visibility in the UI
- role assignment such as “Panel on Ollama, Canvas elsewhere”
- parallel request setting
- max loaded models setting
- flash-attention toggle when supported
- K/V cache policy note when exposed globally

#### Important constraint

The official FAQ describes context configuration clearly, but processor placement is reported rather than fully promised as a simple per-role pinning API in the docs I found. So the BookWork UI should describe GPU / CPU as a **preference or observed runtime state**, not as an unconditional guarantee.

The current Ollama docs also note default context sizing based on available VRAM, show that larger context windows increase memory use, and document additional server knobs like `OLLAMA_NUM_PARALLEL`, `OLLAMA_MAX_LOADED_MODELS`, `OLLAMA_FLASH_ATTENTION`, and `OLLAMA_KV_CACHE_TYPE`. Those should be treated as advanced settings because they materially affect latency and memory pressure.

### LM Studio

LM Studio's official docs describe a local server that runs by default on port `1234`, offers OpenAI-compatible endpoints, and also exposes a native REST API for model management and local inference. The quickstart says authentication is off by default unless enabled by the user. Sources: <https://lmstudio.ai/docs/developer/core/server>, <https://lmstudio.ai/docs/developer/openai-compat>, <https://lmstudio.ai/docs/developer/rest>, <https://lmstudio.ai/docs/developer/rest/quickstart>, <https://lmstudio.ai/docs/developer/core/authentication>

#### What BookWork should expose for LM Studio

- server URL, defaulting to `http://localhost:1234`
- model picker for local models
- optional auth token field
- role assignment per model
- separate context and runtime settings where supported by the served model/runtime

### OpenRouter

OpenRouter's authentication docs say requests use a Bearer token and OpenRouter can be used through its API base at `https://openrouter.ai/api/v1`. Source: <https://openrouter.ai/docs/api/reference/authentication>

#### What BookWork should expose for OpenRouter

- API key stored server-side
- base URL preset
- model search / picker
- budget and usage labels
- fallback chain for “if model A fails, try model B”

### OpenAI

OpenAI's production best-practices docs say the API uses API keys for authentication and recommend keeping keys in secure locations such as environment variables or secret managers rather than in source code or client-side JavaScript. Sources: <https://platform.openai.com/docs/quickstart>, <https://platform.openai.com/docs/guides/production-best-practices>

#### What BookWork should expose for OpenAI

- API key storage via server secrets only
- project-scoped key naming
- panel / canvas role assignment
- model picker and usage budget warnings

### Anthropic

Anthropic's getting-started docs say requests require an `x-api-key` header, and API keys can be created through the Console. Anthropic also documents an OpenAI SDK compatibility path if the app wants to normalize around one SDK shape. Sources: <https://docs.anthropic.com/en/api/getting-started>, <https://docs.anthropic.com/en/api/openai-sdk>

#### What BookWork should expose for Anthropic

- API key field stored on the server
- native Anthropic adapter or normalized OpenAI-compatible adapter
- long-context canvas role option
- low-temperature review presets for document analysis

### Gemini

Google's Gemini API reference says requests include an `x-goog-api-key` header and keys can be created in Google AI Studio. Source: <https://ai.google.dev/api>

#### What BookWork should expose for Gemini

- API key field stored on the server
- model picker
- rate-limit / quota messaging
- optional use for panel or canvas role

### xAI

xAI's developer docs say users create an API key in the xAI Console, can store it as `XAI_API_KEY`, and authenticate inference requests with `Authorization: Bearer <key>` against `https://api.x.ai`. Sources: <https://docs.x.ai/developers/quickstart>, <https://docs.x.ai/developers/api-reference>

#### What BookWork should expose for xAI

- API key field stored on the server
- base URL preset
- model picker
- panel or canvas assignment
- usage and cost visibility

## Configuration UX

### Model routing screen

Create one settings page with three sections:

A good UI pattern is a compact dark settings view with quick presets for `Fast Chat`, `Deep Review`, and `Balanced`, plus an advanced drawer for backend-specific controls.

1. **Panel AI**
   - provider
   - model
   - context limit
   - temperature
   - timeout
   - local / hosted badge
2. **Canvas AI**
   - provider
   - model
   - context limit
   - edit mode default
   - timeout
   - local / hosted badge
3. **Memory / RAG**
   - embedding provider
   - vector store
   - chunk size
   - retrieval depth
   - source pinning

### Secret handling

Never place provider keys in the browser bundle or local storage for hosted providers.

Instead:

- save keys in the server environment or encrypted secret storage,
- keep only opaque connection IDs in the client,
- and let the backend mint and use provider clients.

### Connection test flow

Each provider setup should support:

- test connection,
- list available models,
- run a small probe request,
- and save a validated configuration.

## Performance recommendations

### 1. Keep chat cheap, keep document review strong

A good default strategy is:

- smaller or local model for Panel AI,
- stronger reasoning model for Canvas AI,
- separate retrieval service for memory.

### 2. Use separate context budgets

Do not mirror the same context size into both roles.

For example:

- Panel AI: smaller context, faster first-token speed, higher interactivity
- Canvas AI: larger context, lower temperature, more retrieval, slower but more thorough review

If a local machine has limited VRAM, prefer keeping the chat model small and responsive while sending larger-context review work to system RAM or to a hosted provider.

Recommended behavior:

- Panel AI gets enough context for recent chat plus project preferences.
- Canvas AI gets a larger context budget only when needed for review or rewrite jobs.

### 3. Cache shared memory retrieval

Character sheets, outline cards, and lore snippets should be cached as project memory lookups so repeated handshakes do not keep rebuilding the same context.

### 4. Make local-runtime state visible

For local providers, show:

This is especially useful for Ollama, where the user may want to confirm that the panel model is fitting fully on GPU while a heavier canvas model is partially or fully in system memory.

- loaded / unloaded state,
- warm / cold start state,
- active context size,
- and observed processor status when the backend provides it.

### 5. Fallback routing

If the preferred Canvas AI model is unavailable, fall back in this order:

1. same provider, smaller model
2. alternate provider, same task type
3. suggest switching to `suggest_only` mode or narrower scope

## Recommended MVP

The first real version should ship with:

One extra MVP feature that is worth adding early is a per-role preset button set:

- `Chat on GPU`
- `Canvas on larger context`
- `Fully local`
- `Local chat + cloud review`

That gives non-technical users an easy way to benefit from the architecture without understanding every backend flag.

- Panel AI provider picker
- Canvas AI provider picker
- shared Project Memory Bar
- provider connection testing
- separate context settings per role
- server-side secret storage
- visible task handshake states
- and explicit edit permissions

## Bottom line

The best version of this product is not “one AI with a giant prompt.”

It is a routed system where:

- one role handles the writer,
- one role handles the manuscript,
- one memory layer handles the project facts,
- and the user can mix local and hosted models depending on speed, cost, privacy, and hardware.
