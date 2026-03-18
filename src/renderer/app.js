const settingsDialog = document.getElementById('settings-dialog');
const settingsForm = document.getElementById('settings-form');
const openSettingsButton = document.getElementById('open-settings');
const openWorkspaceButton = document.getElementById('open-workspace');
const storyList = document.getElementById('story-list');
const characterList = document.getElementById('character-list');
const sourceList = document.getElementById('source-list');
const panelCacheBadge = document.getElementById('panel-cache-badge');
const canvasCacheBadge = document.getElementById('canvas-cache-badge');
const refreshButtons = document.querySelectorAll('.refresh-button');
const panelComposer = document.getElementById('panel-composer');
const panelInput = document.getElementById('panel-input');
const chatStream = document.getElementById('chat-stream');
const panelTaskCallout = document.getElementById('panel-task-callout');
const panelTaskText = document.getElementById('panel-task-text');
const canvasStatusText = document.getElementById('canvas-status-text');
const canvasModePill = document.getElementById('canvas-mode-pill');
const canvasLogText = document.getElementById('canvas-log-text');
const memoryLogText = document.getElementById('memory-log-text');

const ROLE_FIELDS = {
  panel: {
    provider: 'panel-provider',
    model: 'panel-model',
    status: document.getElementById('panel-model-status')
  },
  canvas: {
    provider: 'canvas-provider',
    model: 'canvas-model',
    status: document.getElementById('canvas-model-status')
  }
};

let bootstrap;

function renderEntries(listElement, entries) {
  listElement.innerHTML = '';
  entries.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = `${entry.name}${entry.type === 'directory' ? '/' : ''}`;
    listElement.appendChild(li);
  });
}

function appendChatMessage(kind, text) {
  const message = document.createElement('div');
  message.className = `message ${kind}`;
  message.textContent = text;
  chatStream.appendChild(message);
  chatStream.scrollTop = chatStream.scrollHeight;
}

function summarizeTask(userText) {
  const trimmed = userText.trim();
  if (!trimmed) {
    return null;
  }

  const short = trimmed.length > 90 ? `${trimmed.slice(0, 87)}...` : trimmed;
  return {
    request: short,
    taskLabel: `review_and_revise · ${short}`,
    canvasStatus: `Canvas AI is reviewing the delegated task: “${short}”`,
    memorySummary: 'Pulled shared project memory, story context, and any matching character/source records.',
    assistantReply: `Got it. I’ll handle the conversation here, turn that into a structured canvas task, and report back after the Canvas AI finishes its review.`
  };
}

function runPanelHandshake(userText) {
  const task = summarizeTask(userText);
  if (!task) {
    return;
  }

  appendChatMessage('user', userText.trim());
  appendChatMessage('assistant', task.assistantReply);

  panelTaskCallout.classList.remove('hidden');
  panelTaskText.textContent = task.taskLabel;
  canvasStatusText.textContent = task.canvasStatus;
  canvasModePill.textContent = 'Delegated by Panel AI';
  canvasLogText.textContent = `Scope confirmed for delegated task: ${task.request}`;
  memoryLogText.textContent = task.memorySummary;

  window.setTimeout(() => {
    appendChatMessage(
      'assistant',
      `The Canvas AI finished its first pass. Review the canvas and logs, and if you want, I can send a follow-up instruction or tighten the scope.`
    );
    canvasStatusText.textContent = `Canvas AI completed the delegated review for: “${task.request}”`;
    canvasModePill.textContent = 'Suggest only';
    canvasLogText.textContent = `Canvas AI completed the delegated task for: ${task.request}`;
  }, 450);
}

function fillModelSelect(selectElement, models, selectedModel) {
  selectElement.innerHTML = '';

  models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    option.selected = model === selectedModel;
    selectElement.appendChild(option);
  });

  if (selectedModel && !models.includes(selectedModel)) {
    const option = document.createElement('option');
    option.value = selectedModel;
    option.textContent = `${selectedModel} (saved)`;
    option.selected = true;
    selectElement.appendChild(option);
  }
}

async function loadModelsForRole(role, selectedModel) {
  const config = ROLE_FIELDS[role];
  const provider = settingsForm.elements[config.provider].value;
  const select = settingsForm.elements[config.model];
  const refreshButton = document.querySelector(`.refresh-button[data-role="${role}"]`);

  config.status.textContent = `Loading ${provider} models…`;
  refreshButton.disabled = true;

  const result = await window.bookwork.getModels(provider);
  fillModelSelect(select, result.models, selectedModel);

  const sourceLabel = result.source === 'live' ? 'live provider list' : 'fallback list';
  config.status.textContent = result.error
    ? `Loaded ${result.models.length} models from ${sourceLabel} (${result.error}).`
    : `Loaded ${result.models.length} models from ${sourceLabel}.`;

  refreshButton.disabled = false;
}

async function hydrateSettingsForm(settings) {
  settingsForm.elements['panel-provider'].value = settings.panelAi.provider;
  settingsForm.elements['panel-context'].value = settings.panelAi.contextWindow;
  settingsForm.elements['panel-compute'].value = settings.panelAi.computePreference;
  settingsForm.elements['panel-keepalive'].value = settings.panelAi.keepAlive;

  settingsForm.elements['canvas-provider'].value = settings.canvasAi.provider;
  settingsForm.elements['canvas-context'].value = settings.canvasAi.contextWindow;
  settingsForm.elements['canvas-compute'].value = settings.canvasAi.computePreference;
  settingsForm.elements['canvas-keepalive'].value = settings.canvasAi.keepAlive;

  settingsForm.elements['project-name'].value = settings.memory.projectName;
  settingsForm.elements['retrieval-depth'].value = settings.memory.retrievalDepth;
  settingsForm.elements['cache-size'].value = settings.memory.localCacheMbPerRole;

  await Promise.all([
    loadModelsForRole('panel', settings.panelAi.model),
    loadModelsForRole('canvas', settings.canvasAi.model)
  ]);
}

function collectSettings() {
  return {
    panelAi: {
      provider: settingsForm.elements['panel-provider'].value,
      model: settingsForm.elements['panel-model'].value,
      contextWindow: Number(settingsForm.elements['panel-context'].value),
      computePreference: settingsForm.elements['panel-compute'].value,
      keepAlive: settingsForm.elements['panel-keepalive'].value
    },
    canvasAi: {
      provider: settingsForm.elements['canvas-provider'].value,
      model: settingsForm.elements['canvas-model'].value,
      contextWindow: Number(settingsForm.elements['canvas-context'].value),
      computePreference: settingsForm.elements['canvas-compute'].value,
      keepAlive: settingsForm.elements['canvas-keepalive'].value
    },
    memory: {
      projectName: settingsForm.elements['project-name'].value,
      retrievalDepth: Number(settingsForm.elements['retrieval-depth'].value),
      localCacheMbPerRole: Number(settingsForm.elements['cache-size'].value)
    }
  };
}

function updateMemoryBadges(settings) {
  const cacheText = `${settings.memory.localCacheMbPerRole} MB floating memory`;
  panelCacheBadge.textContent = cacheText;
  canvasCacheBadge.textContent = cacheText;
}

async function bootstrapApp() {
  bootstrap = await window.bookwork.getBootstrap();
  renderEntries(storyList, bootstrap.workspace.story);
  renderEntries(characterList, bootstrap.workspace.characters);
  renderEntries(sourceList, bootstrap.workspace.sources);
  await hydrateSettingsForm(bootstrap.settings);
  updateMemoryBadges(bootstrap.settings);
}

openSettingsButton.addEventListener('click', () => {
  settingsDialog.showModal();
});

openWorkspaceButton.addEventListener('click', async () => {
  await window.bookwork.openWorkspace();
});

panelComposer.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = panelInput.value.trim();
  if (!value) {
    return;
  }

  runPanelHandshake(value);
  panelInput.value = '';
  panelInput.focus();
});

settingsForm.elements['panel-provider'].addEventListener('change', () => loadModelsForRole('panel'));
settingsForm.elements['canvas-provider'].addEventListener('change', () => loadModelsForRole('canvas'));

refreshButtons.forEach((button) => {
  button.addEventListener('click', () => {
    loadModelsForRole(button.dataset.role);
  });
});

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const savedSettings = await window.bookwork.saveSettings(collectSettings());
  bootstrap.settings = savedSettings;
  updateMemoryBadges(savedSettings);
  settingsDialog.close();
});

bootstrapApp().catch((error) => {
  console.error('Failed to bootstrap BookWork', error);
});
