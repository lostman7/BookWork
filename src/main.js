const path = require('node:path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const {
  createWorkspaceLayout,
  loadSettings,
  saveSettings,
  listWorkspaceEntries
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
      sources: listWorkspaceEntries(state.workspace.sources)
    },
    logs: {
      panel: path.join(state.workspace.panelLogs, 'latest.log'),
      canvas: path.join(state.workspace.canvasLogs, 'latest.log')
    },
    settings: state.settings
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
  const bookworkRoot = path.join(app.getPath('userData'), 'bookwork');
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
