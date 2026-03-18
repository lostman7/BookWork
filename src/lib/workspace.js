const fs = require('node:fs');
const path = require('node:path');
const { PROVIDER_CATALOG } = require('./providerCatalog');

const DEFAULT_SETTINGS = {
  panelAi: {
    provider: 'ollama',
    model: 'llama3.2:3b',
    providerBaseUrl: PROVIDER_CATALOG.ollama.endpoint,
    contextWindow: 4096,
    computePreference: 'gpu',
    temperature: 0.7,
    keepAlive: '10m'
  },
  canvasAi: {
    provider: 'lmstudio',
    model: 'deepseek-r1-distill-qwen-14b',
    providerBaseUrl: PROVIDER_CATALOG.lmstudio.endpoint,
    contextWindow: 16384,
    computePreference: 'system-memory',
    temperature: 0.2,
    keepAlive: '30m'
  },
  memory: {
    retrievalDepth: 8,
    localCacheMbPerRole: 100,
    projectName: 'default-project'
  },
  ui: {
    theme: 'graphite',
    showLogs: true,
    compactMode: false
  }
};

const SAMPLE_CHARACTER = {
  id: 'ava-stone',
  name: 'Ava Stone',
  role: 'Lead investigator',
  voice: 'Direct, observant, emotionally guarded',
  notes: [
    'Carries unresolved guilt about chapter 5.',
    'Prefers concise dialogue and precise observations.'
  ]
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJsonIfMissing(filePath, value) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  }
}

function writeTextIfMissing(filePath, value) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, value);
  }
}

function createWorkspaceLayout(baseDir) {
  const workspaceRoot = path.join(baseDir, 'workspace');
  const directories = {
    root: workspaceRoot,
    story: path.join(workspaceRoot, 'story'),
    characters: path.join(workspaceRoot, 'characters'),
    sources: path.join(workspaceRoot, 'sources'),
    logs: path.join(workspaceRoot, 'logs'),
    panelLogs: path.join(workspaceRoot, 'logs', 'panel'),
    canvasLogs: path.join(workspaceRoot, 'logs', 'canvas'),
    memory: path.join(workspaceRoot, 'memory'),
    panelMemory: path.join(workspaceRoot, 'memory', 'panel'),
    canvasMemory: path.join(workspaceRoot, 'memory', 'canvas')
  };

  Object.values(directories).forEach(ensureDir);

  writeTextIfMissing(
    path.join(directories.story, 'draft.md'),
    '# Draft\n\nStart writing here. The Canvas AI will review this document while the Panel AI handles chat and delegation.\n'
  );
  writeJsonIfMissing(path.join(directories.characters, 'ava-stone.json'), SAMPLE_CHARACTER);
  writeTextIfMissing(
    path.join(directories.sources, 'README.md'),
    '# Sources\n\nDrop outlines, research notes, and style guides here for shared retrieval.\n'
  );
  writeTextIfMissing(
    path.join(directories.panelLogs, 'latest.log'),
    '[panel] Initialized. Ready to translate chat requests into structured canvas tasks.\n'
  );
  writeTextIfMissing(
    path.join(directories.canvasLogs, 'latest.log'),
    '[canvas] Initialized. Ready to inspect pages, suggest edits, and return structured findings.\n'
  );
  writeJsonIfMissing(path.join(directories.panelMemory, 'state.json'), {
    role: 'panel',
    logicalBudgetMb: DEFAULT_SETTINGS.memory.localCacheMbPerRole,
    summary: 'Floating memory for recent chat preferences and delegation state.'
  });
  writeJsonIfMissing(path.join(directories.canvasMemory, 'state.json'), {
    role: 'canvas',
    logicalBudgetMb: DEFAULT_SETTINGS.memory.localCacheMbPerRole,
    summary: 'Floating memory for page review state, retrieval snapshots, and recent findings.'
  });

  return directories;
}

function loadSettings(settingsPath) {
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return structuredClone(DEFAULT_SETTINGS);
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      panelAi: { ...DEFAULT_SETTINGS.panelAi, ...(parsed.panelAi || {}) },
      canvasAi: { ...DEFAULT_SETTINGS.canvasAi, ...(parsed.canvasAi || {}) },
      memory: { ...DEFAULT_SETTINGS.memory, ...(parsed.memory || {}) },
      ui: { ...DEFAULT_SETTINGS.ui, ...(parsed.ui || {}) }
    };
  } catch {
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings(settingsPath, settings) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...settings,
    panelAi: { ...DEFAULT_SETTINGS.panelAi, ...(settings.panelAi || {}) },
    canvasAi: { ...DEFAULT_SETTINGS.canvasAi, ...(settings.canvasAi || {}) },
    memory: { ...DEFAULT_SETTINGS.memory, ...(settings.memory || {}) },
    ui: { ...DEFAULT_SETTINGS.ui, ...(settings.ui || {}) }
  };

  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2));
  return merged;
}

function listWorkspaceEntries(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).map((entry) => ({
    name: entry.name,
    type: entry.isDirectory() ? 'directory' : 'file'
  }));
}

module.exports = {
  DEFAULT_SETTINGS,
  createWorkspaceLayout,
  loadSettings,
  saveSettings,
  listWorkspaceEntries
};
