const settingsDialog = document.getElementById('settings-dialog');
const settingsForm = document.getElementById('settings-form');
const openSettingsButton = document.getElementById('open-settings');
const openWorkspaceButton = document.getElementById('open-workspace');
const storyList = document.getElementById('story-list');
const characterList = document.getElementById('character-list');
const sourceList = document.getElementById('source-list');
const panelCacheBadge = document.getElementById('panel-cache-badge');
const canvasCacheBadge = document.getElementById('canvas-cache-badge');

let bootstrap;

function renderEntries(listElement, entries) {
  listElement.innerHTML = '';
  entries.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = `${entry.name}${entry.type === 'directory' ? '/' : ''}`;
    listElement.appendChild(li);
  });
}

function hydrateSettingsForm(settings) {
  settingsForm.elements['panel-provider'].value = settings.panelAi.provider;
  settingsForm.elements['panel-model'].value = settings.panelAi.model;
  settingsForm.elements['panel-context'].value = settings.panelAi.contextWindow;
  settingsForm.elements['panel-compute'].value = settings.panelAi.computePreference;
  settingsForm.elements['panel-keepalive'].value = settings.panelAi.keepAlive;

  settingsForm.elements['canvas-provider'].value = settings.canvasAi.provider;
  settingsForm.elements['canvas-model'].value = settings.canvasAi.model;
  settingsForm.elements['canvas-context'].value = settings.canvasAi.contextWindow;
  settingsForm.elements['canvas-compute'].value = settings.canvasAi.computePreference;
  settingsForm.elements['canvas-keepalive'].value = settings.canvasAi.keepAlive;

  settingsForm.elements['project-name'].value = settings.memory.projectName;
  settingsForm.elements['retrieval-depth'].value = settings.memory.retrievalDepth;
  settingsForm.elements['cache-size'].value = settings.memory.localCacheMbPerRole;
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
  hydrateSettingsForm(bootstrap.settings);
  updateMemoryBadges(bootstrap.settings);
}

openSettingsButton.addEventListener('click', () => {
  settingsDialog.showModal();
});

openWorkspaceButton.addEventListener('click', async () => {
  await window.bookwork.openWorkspace();
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
