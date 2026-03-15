import { app } from 'electron';
import { autoUpdater } from 'electron-updater';

export interface UpdateState {
  enabled: boolean;
  phase:
    | 'disabled'
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error';
  message: string;
  progress: number | null;
  version: string | null;
}

const state: UpdateState = {
  enabled: false,
  phase: 'disabled',
  message: 'Auto-update is disabled.',
  progress: null,
  version: null,
};

function setState(next: Partial<UpdateState>) {
  Object.assign(state, next);
}

function updatesEnabledInEnv() {
  const rawValue = process.env.AGENT_AUTO_UPDATE_ENABLED?.trim().toLowerCase();
  return rawValue !== 'false' && rawValue !== '0';
}

export function getUpdateState(): UpdateState {
  return { ...state };
}

export async function checkForUpdatesNow(): Promise<UpdateState> {
  if (!state.enabled) {
    return getUpdateState();
  }

  await autoUpdater.checkForUpdates();
  return getUpdateState();
}

export function configureAutoUpdater() {
  const updateUrl = process.env.AGENT_UPDATE_URL?.trim();
  const updateChannel = process.env.AGENT_UPDATE_CHANNEL?.trim() || 'latest';

  if (!updatesEnabledInEnv()) {
    setState({
      enabled: false,
      phase: 'disabled',
      message: 'Auto-update is disabled by AGENT_AUTO_UPDATE_ENABLED.',
      progress: null,
      version: null,
    });
    return;
  }

  if (!app.isPackaged) {
    setState({
      enabled: false,
      phase: 'disabled',
      message: 'Auto-update checks run only in packaged builds.',
      progress: null,
      version: null,
    });
    return;
  }

  if (!updateUrl) {
    setState({
      enabled: false,
      phase: 'disabled',
      message: 'Set AGENT_UPDATE_URL to enable packaged auto-updates.',
      progress: null,
      version: null,
    });
    return;
  }

  setState({
    enabled: true,
    phase: 'idle',
    message: 'Auto-update is configured.',
    progress: null,
    version: null,
  });

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: updateUrl,
    channel: updateChannel,
  });

  autoUpdater.on('checking-for-update', () => {
    setState({
      enabled: true,
      phase: 'checking',
      message: 'Checking for updates...',
      progress: null,
    });
  });

  autoUpdater.on('update-available', (info) => {
    setState({
      enabled: true,
      phase: 'available',
      message: `Update ${info.version} is available. Downloading now...`,
      progress: 0,
      version: info.version || null,
    });
  });

  autoUpdater.on('update-not-available', () => {
    setState({
      enabled: true,
      phase: 'not-available',
      message: 'This agent is up to date.',
      progress: null,
      version: app.getVersion(),
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    setState({
      enabled: true,
      phase: 'downloading',
      message: `Downloading update ${Math.round(progress.percent)}%`,
      progress: progress.percent,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    setState({
      enabled: true,
      phase: 'downloaded',
      message: `Update ${info.version} downloaded. It will install when the app closes.`,
      progress: 100,
      version: info.version || null,
    });
  });

  autoUpdater.on('error', (error) => {
    setState({
      enabled: true,
      phase: 'error',
      message: error?.message || 'Auto-update failed.',
      progress: null,
    });
  });

  void autoUpdater.checkForUpdates().catch((error) => {
    setState({
      enabled: true,
      phase: 'error',
      message: error?.message || 'Failed to check for updates.',
      progress: null,
    });
  });
}
