const PROVIDER_CATALOG = {
  ollama: {
    label: 'Ollama',
    endpoint: 'http://localhost:11434/api/tags',
    fallbackModels: ['llama3.2:3b', 'llama3.1:8b', 'qwen3:8b', 'gemma3:4b']
  },
  lmstudio: {
    label: 'LM Studio',
    endpoint: 'http://localhost:1234/api/v1/models',
    fallbackModels: ['openai/gpt-oss-20b', 'ibm/granite-4-micro', 'deepseek-r1-distill-qwen-14b']
  },
  openrouter: {
    label: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/models',
    fallbackModels: ['openai/gpt-4.1-mini', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-pro']
  },
  openai: {
    label: 'OpenAI',
    fallbackModels: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-5-mini']
  }
};

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function normalizeProviderResponse(provider, payload) {
  switch (provider) {
    case 'ollama':
      return uniqueSorted((payload.models || []).map((model) => model.name || model.model));
    case 'lmstudio':
      return uniqueSorted((payload.data || []).map((model) => model.id));
    case 'openrouter':
      return uniqueSorted((payload.data || []).map((model) => model.id));
    default:
      return [];
  }
}

async function fetchModelsForProvider(provider, options = {}) {
  const definition = PROVIDER_CATALOG[provider];
  if (!definition) {
    return {
      provider,
      models: [],
      source: 'unknown-provider',
      error: `Unknown provider: ${provider}`
    };
  }

  if (!definition.endpoint) {
    return {
      provider,
      models: definition.fallbackModels,
      source: 'fallback'
    };
  }

  try {
    const response = await fetch(options.baseUrl || definition.endpoint, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const models = normalizeProviderResponse(provider, payload);

    if (models.length === 0) {
      return {
        provider,
        models: definition.fallbackModels,
        source: 'fallback',
        error: 'Provider returned no models.'
      };
    }

    return {
      provider,
      models,
      source: 'live'
    };
  } catch (error) {
    return {
      provider,
      models: definition.fallbackModels,
      source: 'fallback',
      error: error.message
    };
  }
}

module.exports = {
  PROVIDER_CATALOG,
  normalizeProviderResponse,
  fetchModelsForProvider
};
