/// <reference types="vite/client" />

interface OracleCredentials {
  host: string;
  port: number;
  service: string;
  username: string;
  password: string;
}

interface AgentStatus {
  connected: boolean;
  lastHeartbeat: string | null;
  lastJobTime: string | null;
  lastJobStatus: 'SUCCESS' | 'FAILED' | null;
  jobsExecuted: number;
}

interface UpdateStatus {
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

interface Window {
  electronAPI: {
    storeAgentToken: (token: string) => Promise<boolean>;
    getAgentToken: () => Promise<string | null>;
    clearAgentToken: () => Promise<boolean>;
    storeOracleCredentials: (creds: OracleCredentials) => Promise<boolean>;
    getOracleCredentials: () => Promise<OracleCredentials | null>;
    clearOracleCredentials: () => Promise<boolean>;
    testOracleConnection: () => Promise<{ success: boolean; error?: string }>;
    getAgentStatus: () => Promise<AgentStatus>;
    getUpdateStatus: () => Promise<UpdateStatus>;
    checkForUpdates: () => Promise<UpdateStatus>;
  };
}
