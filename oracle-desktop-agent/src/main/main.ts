import './env';
import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { agentCore } from './AgentCore';
import { checkForUpdatesNow, configureAutoUpdater, getUpdateState } from './updates';

// ─── Encrypted File Storage ────────────────────────────────────────────────
const STORE_PATH = path.join(app.getPath('userData'), 'secure.json');

function saveToFile(key: string, val: string): boolean {
  let data: Record<string, string> = {};
  if (fs.existsSync(STORE_PATH)) {
    data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  }
  data[key] = val;
  fs.writeFileSync(STORE_PATH, JSON.stringify(data));
  return true;
}

function readFromFile(key: string): string | null {
  if (fs.existsSync(STORE_PATH)) {
    const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    return data[key] ?? null;
  }
  return null;
}

function deleteFromFile(key: string): void {
  if (fs.existsSync(STORE_PATH)) {
    const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    delete data[key];
    fs.writeFileSync(STORE_PATH, JSON.stringify(data));
  }
}

// ─── Secure Storage Helpers (Electron safeStorage) ─────────────────────────
function encryptAndStore(key: string, value: string): boolean {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[Main] OS encryption not available, storing as plaintext fallback.');
    return saveToFile(key, Buffer.from(value).toString('base64'));
  }
  const encrypted = safeStorage.encryptString(value);
  return saveToFile(key, encrypted.toString('base64'));
}

function retrieveAndDecrypt(key: string): string | null {
  const b64 = readFromFile(key);
  if (!b64) return null;
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(b64, 'base64').toString('utf-8');
  }
  const encrypted = Buffer.from(b64, 'base64');
  return safeStorage.decryptString(encrypted);
}

// ─── Window Creation ───────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 620,
    height: 780,
    minWidth: 500,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  setupIpcHandlers();

  // Wire up credential retriever: AgentCore reads Oracle creds from local
  // encrypted storage when executing jobs. Credentials NEVER leave this machine.
  agentCore.setCredentialRetriever(() => {
    const raw = retrieveAndDecrypt('oracleCredentials');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  // Auto-connect if we already have a stored agent token
  const existingToken = retrieveAndDecrypt('agentToken');
  if (existingToken) {
    agentCore.setToken(existingToken);
  }

  configureAutoUpdater();
});

app.on('window-all-closed', () => {
  agentCore.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ─── IPC Handlers ──────────────────────────────────────────────────────────
function setupIpcHandlers() {
  // --- Agent Token ---
  ipcMain.handle('agent:store-token', async (_event, token: string) => {
    const ok = encryptAndStore('agentToken', token);
    if (ok && token) {
      agentCore.setToken(token);
    }
    return ok;
  });

  ipcMain.handle('agent:get-token', async () => {
    return retrieveAndDecrypt('agentToken');
  });

  ipcMain.handle('agent:clear-token', async () => {
    agentCore.stop();
    deleteFromFile('agentToken');
    return true;
  });

  // --- Oracle Credentials (stored ONLY locally, never sent to backend) ---
  ipcMain.handle(
    'oracle:store-credentials',
    async (
      _event,
      creds: {
        host: string;
        port: number;
        service: string;
        username: string;
        password: string;
      }
    ) => {
      return encryptAndStore('oracleCredentials', JSON.stringify(creds));
    }
  );

  ipcMain.handle('oracle:get-credentials', async () => {
    const raw = retrieveAndDecrypt('oracleCredentials');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  ipcMain.handle('oracle:clear-credentials', async () => {
    deleteFromFile('oracleCredentials');
    return true;
  });

  // --- Oracle Test Connection ---
  ipcMain.handle('oracle:test-connection', async () => {
    const raw = retrieveAndDecrypt('oracleCredentials');
    if (!raw) return { success: false, error: 'No credentials configured.' };
    try {
      const creds = JSON.parse(raw);
      const result = await agentCore.testOracleConnection(creds);
      return result;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // --- Agent Status ---
  ipcMain.handle('agent:get-status', async () => {
    return agentCore.getStatus();
  });

  // --- App Updates ---
  ipcMain.handle('updates:get-status', async () => {
    return getUpdateState();
  });

  ipcMain.handle('updates:check', async () => {
    return checkForUpdatesNow();
  });
}
