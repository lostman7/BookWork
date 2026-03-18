const path = require('node:path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const {
  createWorkspaceLayout,
  createWorkspaceEntry,
  loadSettings,
  saveSettings,
  listWorkspaceEntries,
  ROLE_PRESETS
} = require('./lib/workspace');
const { fetchModelsForProvider } = require('./lib/providerCatalog');

let state;

function getBootstrapPayload() {
  return {
    appName: 'BookWork',
    workspace: {
      root: state.workspace.root,
      story: listWorkspaceEntries(state.workspace.story),
      characters: listWorkspaceEntries(state.workspace.characters),
      lore: listWorkspaceEntries(state.workspace.lore),
      sources: listWorkspaceEntries(state.workspace.sources),
      logs: listWorkspaceEntries(state.workspace.logs)
    },
    logs: {
      panel: path.join(state.workspace.panelLogs, 'latest.log'),
      canvas: path.join(state.workspace.canvasLogs, 'latest.log')
    },
    settings: state.settings,
    presets: ROLE_PRESETS
  };
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#111215',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  const baseDir = app.isPackaged ? path.dirname(app.getPath('exe')) : process.cwd();
  const bookworkRoot = path.join(baseDir, 'BookWorkData');
  const workspace = createWorkspaceLayout(bookworkRoot);
  const settingsPath = path.join(bookworkRoot, 'settings.json');
  const settings = loadSettings(settingsPath);

  state = {
    workspace,
    settingsPath,
    settings
  };

  ipcMain.handle('bookwork:get-bootstrap', async () => getBootstrapPayload());
  ipcMain.handle('bookwork:save-settings', async (_event, nextSettings) => {
    state.settings = saveSettings(state.settingsPath, nextSettings);
    return state.settings;
  });
  ipcMain.handle('bookwork:open-workspace', async () => {
    await shell.openPath(state.workspace.root);
    return state.workspace.root;
  });
  ipcMain.handle('bookwork:get-models', async (_event, provider, options = {}) =>
    fetchModelsForProvider(provider, options)
  );
  ipcMain.handle('bookwork:create-entry', async (_event, payload) => {
    const result = createWorkspaceEntry(state.workspace, payload.section, payload.name, payload.content);
    return {
      result,
      workspace: getBootstrapPayload().workspace
    };
  });

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
