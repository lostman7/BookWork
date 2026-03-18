const settingsDialog = document.getElementById('settings-dialog');
const settingsForm = document.getElementById('settings-form');
const memoryDialog = document.getElementById('memory-dialog');
const memoryForm = document.getElementById('memory-form');
const memoryDialogCloseButton = document.getElementById('memory-dialog-close');
const memoryDialogCancelButton = document.getElementById('memory-dialog-cancel');
const settingsDialogCloseButton = document.getElementById('settings-dialog-close');
const settingsDialogCancelButton = document.getElementById('settings-dialog-cancel');
const openSettingsButton = document.getElementById('open-settings');
const openWorkspaceButton = document.getElementById('open-workspace');
const addMemoryItemButton = document.getElementById('add-memory-item');
const memoryDialogTitle = document.getElementById('memory-dialog-title');
const memoryDialogHint = document.getElementById('memory-dialog-hint');
const memoryItemName = document.getElementById('memory-item-name');
const memoryItemContent = document.getElementById('memory-item-content');
const memoryBar = document.getElementById('memory-bar');
const activeMemoryTitle = document.getElementById('active-memory-title');
const activeMemoryDescription = document.getElementById('active-memory-description');
const storyList = document.getElementById('story-list');
const characterList = document.getElementById('character-list');
const loreList = document.getElementById('lore-list');
const sourceList = document.getElementById('source-list');
const logList = document.getElementById('log-list');
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
const panelPresetTitle = document.getElementById('panel-preset-title');
const panelPresetMission = document.getElementById('panel-preset-mission');
const panelPresetCommands = document.getElementById('panel-preset-commands');
const canvasPresetTitle = document.getElementById('canvas-preset-title');
const canvasPresetMission = document.getElementById('canvas-preset-mission');
const canvasPresetCommands = document.getElementById('canvas-preset-commands');
const canvasEditor = document.getElementById('canvas-editor');
const canvasLineNumbers = document.getElementById('canvas-line-numbers');
const selectionBadge = document.getElementById('selection-badge');
const selectionFocusText = document.getElementById('selection-focus-text');
const canvasEditorShell = document.getElementById('canvas-editor-shell');
const toastRegion = document.getElementById('toast-region');

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

const TAB_COPY = {
  story: {
    title: 'Story',
    addLabel: 'story item',
    description: 'Select the working draft and create manuscript files here.'
  },
  characters: {
    title: 'Characters',
    addLabel: 'character',
    description: 'Add character cards so both AIs can pull voices, roles, and continuity facts.'
  },
  lore: {
    title: 'Lore',
    addLabel: 'lore entry',
    description: 'Store canon, world rules, timeline notes, and setting details here.'
  },
  sources: {
    title: 'Sources',
    addLabel: 'source note',
    description: 'Drop outlines, references, research notes, and style guides here.'
  },
  logs: {
    title: 'Logs',
    addLabel: 'log note',
    description: 'Save operator notes or workflow logs that the system can inspect later.'
  }
};

let bootstrap;
let activeMemoryTab = 'story';

function renderEntries(listElement, entries) {
  listElement.innerHTML = '';
  entries.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = `${entry.name}${entry.type === 'directory' ? '/' : ''}`;
    listElement.appendChild(li);
  });
}

function renderWorkspaceLists(workspace) {
  renderEntries(storyList, workspace.story);
  renderEntries(characterList, workspace.characters);
  renderEntries(loreList, workspace.lore);
  renderEntries(sourceList, workspace.sources);
  renderEntries(logList, workspace.logs);
}

function appendChatMessage(kind, text) {
  const message = document.createElement('div');
  message.className = `message ${kind}`;
  message.textContent = text;
  chatStream.appendChild(message);
  chatStream.scrollTop = chatStream.scrollHeight;
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastRegion.appendChild(toast);
  window.setTimeout(() => toast.classList.add('visible'), 10);
  window.setTimeout(() => {
    toast.classList.remove('visible');
    window.setTimeout(() => toast.remove(), 250);
  }, 2200);
}

function renderPreset(cardTitle, missionNode, commandNode, preset) {
  cardTitle.textContent = preset.title;
  missionNode.textContent = preset.mission;
  commandNode.innerHTML = '';

  preset.commands.forEach((command) => {
    const chip = document.createElement('span');
    chip.className = 'command-chip';
    chip.textContent = command;
    commandNode.appendChild(chip);
  });
}

function setActiveMemoryTab(tab) {
  activeMemoryTab = tab;
  activeMemoryTitle.textContent = TAB_COPY[tab].title;
  activeMemoryDescription.textContent = TAB_COPY[tab].description;
  addMemoryItemButton.textContent = `Add ${TAB_COPY[tab].addLabel}`;

  memoryBar.querySelectorAll('.memory-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.tab === tab);
  });
}

function syncLineNumbers() {
  const lineCount = canvasEditor.value.split('\n').length;
  canvasLineNumbers.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join('\n');
}

function getSelectionState() {
  const { selectionStart, selectionEnd, value } = canvasEditor;
  if (selectionStart === selectionEnd) {
    return null;
  }

  const selectedText = value.slice(selectionStart, selectionEnd).trim();
  const beforeStart = value.slice(0, selectionStart);
  const beforeEnd = value.slice(0, selectionEnd);
  const startLine = beforeStart.split('\n').length;
  const endLine = beforeEnd.split('\n').length;

  return {
    selectedText,
    startLine,
    endLine
  };
}

function updateSelectionState() {
  const selection = getSelectionState();
  if (!selection) {
    selectionBadge.textContent = 'No selection';
    selectionFocusText.textContent = 'Highlight lines in the canvas to aim the Canvas AI at a specific passage.';
    canvasEditorShell.classList.remove('selection-active');
    return;
  }

  selectionBadge.textContent = `Lines ${selection.startLine}-${selection.endLine}`;
  selectionFocusText.textContent = `Selected lines ${selection.startLine}-${selection.endLine}: “${selection.selectedText.slice(0, 160)}”`;
  canvasEditorShell.classList.add('selection-active');
}

function interpretChatIntent(message) {
  const lowered = message.toLowerCase();
  const selection = getSelectionState();
  const actionWords = ['rewrite', 'fix', 'check', 'review', 'edit', 'look at', 'go over', 'line ', 'lines ', 'highlight', 'selected'];
  const shouldDelegate = actionWords.some((word) => lowered.includes(word)) || Boolean(selection && lowered.includes('this'));

  if (!shouldDelegate) {
    return {
      type: 'chat',
      response:
        'Absolutely — we can talk through the story naturally here. If you want me to send something to the Canvas AI, just highlight text or mention a line number and tell me what to do.'
    };
  }

  const focusLabel = selection
    ? `selected lines ${selection.startLine}-${selection.endLine}`
    : lowered.includes('line ')
      ? 'the referenced lines'
      : 'the current canvas scope';

  return {
    type: 'delegate',
    focusLabel,
    selection,
    response: `Got it. I’ll treat this as a canvas task, aim the Canvas AI at ${focusLabel}, and then report back here once it finishes the pass.`
  };
}

function runPanelHandshake(userText) {
  const intent = interpretChatIntent(userText);
  appendChatMessage('user', userText.trim());

  if (intent.type === 'chat') {
    appendChatMessage('assistant', intent.response);
    return;
  }

  appendChatMessage('assistant', intent.response);

  const selectionDetail = intent.selection
    ? ` · lines ${intent.selection.startLine}-${intent.selection.endLine}`
    : '';
  panelTaskCallout.classList.remove('hidden');
  panelTaskText.textContent = `review_and_revise${selectionDetail} · ${userText.trim()}`;
  canvasStatusText.textContent = `Canvas AI is reviewing ${intent.focusLabel} for: “${userText.trim()}”`;
  canvasModePill.textContent = 'Delegated by Panel AI';
  canvasLogText.textContent = `Scope confirmed: ${intent.focusLabel}`;
  memoryLogText.textContent = intent.selection
    ? `Pulled selection lines ${intent.selection.startLine}-${intent.selection.endLine} plus shared memory.`
    : 'Pulled shared project memory and current canvas scope.';

  window.setTimeout(() => {
    appendChatMessage(
      'assistant',
      `The Canvas AI finished a first pass on ${intent.focusLabel}. If you want, I can send a tighter rewrite, check continuity again, or work on another highlighted section.`
    );
    canvasStatusText.textContent = `Canvas AI completed the delegated review for ${intent.focusLabel}.`;
    canvasModePill.textContent = 'Suggest only';
    canvasLogText.textContent = `Canvas AI completed the delegated task for ${intent.focusLabel}`;
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
  renderWorkspaceLists(bootstrap.workspace);
  await hydrateSettingsForm(bootstrap.settings);
  updateMemoryBadges(bootstrap.settings);
  renderPreset(panelPresetTitle, panelPresetMission, panelPresetCommands, bootstrap.presets.panel);
  renderPreset(canvasPresetTitle, canvasPresetMission, canvasPresetCommands, bootstrap.presets.canvas);
  setActiveMemoryTab(activeMemoryTab);
  syncLineNumbers();
  updateSelectionState();
}

openSettingsButton.addEventListener('click', () => {
  settingsDialog.showModal();
});

openWorkspaceButton.addEventListener('click', async () => {
  await window.bookwork.openWorkspace();
});

memoryDialogCloseButton.addEventListener('click', () => memoryDialog.close());
memoryDialogCancelButton.addEventListener('click', () => memoryDialog.close());
settingsDialogCloseButton.addEventListener('click', () => settingsDialog.close());
settingsDialogCancelButton.addEventListener('click', () => settingsDialog.close());

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

canvasEditor.addEventListener('input', () => {
  syncLineNumbers();
  updateSelectionState();
});
canvasEditor.addEventListener('select', updateSelectionState);
canvasEditor.addEventListener('click', updateSelectionState);
canvasEditor.addEventListener('keyup', updateSelectionState);

memoryBar.addEventListener('click', (event) => {
  const button = event.target.closest('.memory-chip');
  if (!button) {
    return;
  }

  setActiveMemoryTab(button.dataset.tab);
});

addMemoryItemButton.addEventListener('click', () => {
  memoryDialogTitle.textContent = `Add ${TAB_COPY[activeMemoryTab].addLabel}`;
  memoryDialogHint.textContent = `This item will be saved into ${TAB_COPY[activeMemoryTab].title}.`;
  memoryItemName.value = '';
  memoryItemContent.value = '';
  memoryDialog.showModal();
});

memoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    section: activeMemoryTab,
    name: memoryItemName.value.trim(),
    content: memoryItemContent.value
  };

  if (!payload.name) {
    return;
  }

  const result = await window.bookwork.createEntry(payload);
  bootstrap.workspace = result.workspace;
  renderWorkspaceLists(bootstrap.workspace);
  memoryDialog.close();
  showToast(`New ${TAB_COPY[activeMemoryTab].addLabel} added`);
  memoryLogText.textContent = `Updated shared memory from ${TAB_COPY[activeMemoryTab].title}: ${result.result.name}`;
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
