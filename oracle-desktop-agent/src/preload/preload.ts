import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Agent pairing
  storeAgentToken: (token: string) => ipcRenderer.invoke('agent:store-token', token),
  getAgentToken: () => ipcRenderer.invoke('agent:get-token'),
  clearAgentToken: () => ipcRenderer.invoke('agent:clear-token'),

  // Oracle credentials (stored ONLY locally, never sent to backend)
  storeOracleCredentials: (creds: {
    host: string;
    port: number;
    service: string;
    username: string;
    password: string;
  }) => ipcRenderer.invoke('oracle:store-credentials', creds),
  getOracleCredentials: () => ipcRenderer.invoke('oracle:get-credentials'),
  clearOracleCredentials: () => ipcRenderer.invoke('oracle:clear-credentials'),
  testOracleConnection: () => ipcRenderer.invoke('oracle:test-connection'),

  // Agent status
  getAgentStatus: () => ipcRenderer.invoke('agent:get-status'),

  // App updates
  getUpdateStatus: () => ipcRenderer.invoke('updates:get-status'),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
});
