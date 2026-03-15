import { useCallback, useEffect, useState } from 'react';

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
  container: {
    padding: '32px 28px',
    maxWidth: 520,
    margin: '0 auto',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  } as React.CSSProperties,

  header: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
    color: '#1a202c',
  } as React.CSSProperties,

  subtitle: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 24,
  } as React.CSSProperties,

  card: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '20px',
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  } as React.CSSProperties,

  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 16,
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#4a5568',
    marginBottom: 4,
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #cbd5e0',
    fontSize: 14,
    marginBottom: 12,
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  row: {
    display: 'flex',
    gap: 12,
  } as React.CSSProperties,

  btnPrimary: {
    padding: '10px 20px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    width: '100%',
  } as React.CSSProperties,

  btnDanger: {
    padding: '8px 16px',
    backgroundColor: '#e53e3e',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  } as React.CSSProperties,

  btnOutline: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#3182ce',
    border: '1px solid #3182ce',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  } as React.CSSProperties,

  statusBadge: (connected: boolean) =>
    ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 14px',
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      backgroundColor: connected ? '#c6f6d5' : '#fed7d7',
      color: connected ? '#22543d' : '#742a2a',
    }) as React.CSSProperties,

  dot: (connected: boolean) =>
    ({
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: connected ? '#38a169' : '#e53e3e',
    }) as React.CSSProperties,

  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #edf2f7',
    fontSize: 13,
  } as React.CSSProperties,

  statLabel: {
    color: '#718096',
    fontWeight: 500,
  } as React.CSSProperties,

  statValue: {
    color: '#2d3748',
    fontWeight: 600,
    fontFamily: 'monospace',
  } as React.CSSProperties,

  successMsg: {
    padding: '8px 12px',
    backgroundColor: '#c6f6d5',
    color: '#22543d',
    borderRadius: 6,
    fontSize: 13,
    marginTop: 8,
  } as React.CSSProperties,

  errorMsg: {
    padding: '8px 12px',
    backgroundColor: '#fed7d7',
    color: '#742a2a',
    borderRadius: 6,
    fontSize: 13,
    marginTop: 8,
  } as React.CSSProperties,
};

// ─── App Component ─────────────────────────────────────────────────────────
export default function App() {
  // --- Agent State ---
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('Oracle Desktop Agent');
  const [pairingInput, setPairingInput] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);

  // --- Oracle Credentials State ---
  const [oracleHost, setOracleHost] = useState('');
  const [oraclePort, setOraclePort] = useState('1521');
  const [oracleService, setOracleService] = useState('');
  const [oracleUser, setOracleUser] = useState('');
  const [oraclePass, setOraclePass] = useState('');
  const [oracleConfigured, setOracleConfigured] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // --- Agent Status ---
  const [status, setStatus] = useState<AgentStatus>({
    connected: false,
    lastHeartbeat: null,
    lastJobTime: null,
    lastJobStatus: null,
    jobsExecuted: 0,
  });
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    enabled: false,
    phase: 'disabled',
    message: 'Auto-update is disabled.',
    progress: null,
    version: null,
  });

  // --- Load existing state on mount ---
  useEffect(() => {
    (async () => {
      const token = await window.electronAPI.getAgentToken();
      if (token) {
        setAgentToken(token);
        setAgentId(token.split(':')[0]);
      }

      const creds = await window.electronAPI.getOracleCredentials();
      if (creds) {
        setOracleHost(creds.host);
        setOraclePort(String(creds.port));
        setOracleService(creds.service);
        setOracleUser(creds.username);
        setOracleConfigured(true);
      }

      const updater = await window.electronAPI.getUpdateStatus();
      setUpdateStatus(updater);
    })();
  }, []);

  // --- Poll agent status ---
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const s = await window.electronAPI.getAgentStatus();
        setStatus(s);
        const updater = await window.electronAPI.getUpdateStatus();
        setUpdateStatus(updater);
      } catch {
        /* ignore */
      }
    }, 3_000);
    return () => clearInterval(interval);
  }, []);

  // --- Pairing ---
  const handlePairing = useCallback(async () => {
    setPairingLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const resp = await fetch(`${backendUrl}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairing_token: pairingInput,
          agent_name: agentName.trim() || 'Oracle Desktop Agent',
          version: '1.0.0',
        }),
      });

      if (!resp.ok) throw new Error('Registration failed');

      const data = await resp.json();
      await window.electronAPI.storeAgentToken(data.agent_token);
      setAgentToken(data.agent_token);
      setAgentId(data.agent_id);
      if (data.agent_name) {
        setAgentName(data.agent_name);
      }
    } catch (e: any) {
      alert(`Pairing failed: ${e.message}`);
    } finally {
      setPairingLoading(false);
    }
  }, [agentName, pairingInput]);

  // --- Oracle Credentials ---
  const handleSaveOracle = useCallback(async () => {
    const creds: OracleCredentials = {
      host: oracleHost.trim(),
      port: Number(oraclePort) || 1521,
      service: oracleService.trim(),
      username: oracleUser.trim(),
      password: oraclePass,
    };

    if (!creds.host || !creds.service || !creds.username || !creds.password) {
      alert('Please fill in all fields.');
      return;
    }

    await window.electronAPI.storeOracleCredentials(creds);
    setOracleConfigured(true);
    setOraclePass(''); // Clear password from UI state
    setTestResult(null);
  }, [oracleHost, oraclePort, oracleService, oracleUser, oraclePass]);

  const handleTestConnection = useCallback(async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const result = await window.electronAPI.testOracleConnection();
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTestLoading(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    await window.electronAPI.clearAgentToken();
    setAgentToken(null);
    setAgentId(null);
    setStatus({
      connected: false,
      lastHeartbeat: null,
      lastJobTime: null,
      lastJobStatus: null,
      jobsExecuted: 0,
    });
  }, []);

  const handleCheckForUpdates = useCallback(async () => {
    try {
      const next = await window.electronAPI.checkForUpdates();
      setUpdateStatus(next);
    } catch (e: any) {
      setUpdateStatus((current) => ({
        ...current,
        phase: 'error',
        message: e.message || 'Failed to check for updates.',
      }));
    }
  }, []);

  const timeAgo = (iso: string | null) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return `${Math.floor(diff / 3_600_000)}h ago`;
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.header}>Oracle Connector Agent</div>
      <div style={styles.subtitle}>Secure bridge to your enterprise Oracle database</div>

      {/* ── Connection Status ── */}
      <div
        style={{
          ...styles.card,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={styles.statusBadge(status.connected)}>
          <div style={styles.dot(status.connected)} />
          {status.connected ? 'Connected' : 'Disconnected'}
        </div>
        {agentId && (
          <span style={{ fontSize: 12, color: '#a0aec0', fontFamily: 'monospace' }}>
            {agentId.substring(0, 8)}…
          </span>
        )}
      </div>

      {/* ── Pairing (if not paired) ── */}
      {!agentToken && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>🔗 Pair Agent</div>
          <p style={{ fontSize: 13, color: '#718096', margin: '0 0 12px' }}>
            Generate a pairing token from your SaaS dashboard and paste it below.
          </p>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Agent display name"
            style={styles.input}
          />
          <input
            type="text"
            value={pairingInput}
            onChange={(e) => setPairingInput(e.target.value)}
            placeholder="Paste pairing token..."
            style={styles.input}
          />
          <button
            onClick={handlePairing}
            disabled={!pairingInput.trim() || !agentName.trim() || pairingLoading}
            style={{
              ...styles.btnPrimary,
              opacity: !pairingInput.trim() || !agentName.trim() || pairingLoading ? 0.6 : 1,
            }}
          >
            {pairingLoading ? 'Connecting…' : 'Connect Agent'}
          </button>
        </div>
      )}

      {/* ── Oracle Database Config ── */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>🗄️ Oracle Database</div>

        <label style={styles.label}>Host</label>
        <input
          type="text"
          value={oracleHost}
          onChange={(e) => setOracleHost(e.target.value)}
          placeholder="oracle.company.local"
          style={styles.input}
        />

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Port</label>
            <input
              type="text"
              value={oraclePort}
              onChange={(e) => setOraclePort(e.target.value)}
              placeholder="1521"
              style={styles.input}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={styles.label}>Service Name</label>
            <input
              type="text"
              value={oracleService}
              onChange={(e) => setOracleService(e.target.value)}
              placeholder="ORCL"
              style={styles.input}
            />
          </div>
        </div>

        <label style={styles.label}>Username</label>
        <input
          type="text"
          value={oracleUser}
          onChange={(e) => setOracleUser(e.target.value)}
          placeholder="DB_USER"
          style={styles.input}
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={oraclePass}
          onChange={(e) => setOraclePass(e.target.value)}
          placeholder={oracleConfigured ? '••••••••  (saved securely)' : 'Enter password'}
          style={styles.input}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={handleSaveOracle} style={styles.btnPrimary}>
            {oracleConfigured ? 'Update Credentials' : 'Save Credentials'}
          </button>
        </div>

        {oracleConfigured && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={handleTestConnection}
              disabled={testLoading}
              style={{ ...styles.btnOutline, opacity: testLoading ? 0.6 : 1 }}
            >
              {testLoading ? 'Testing…' : 'Test Connection'}
            </button>
            <button
              onClick={async () => {
                await window.electronAPI.clearOracleCredentials();
                setOracleHost('');
                setOraclePort('1521');
                setOracleService('');
                setOracleUser('');
                setOraclePass('');
                setOracleConfigured(false);
                setTestResult(null);
              }}
              style={styles.btnDanger}
            >
              Clear
            </button>
          </div>
        )}

        {testResult && (
          <div style={testResult.success ? styles.successMsg : styles.errorMsg}>
            {testResult.success ? '✅ Connection successful!' : `❌ ${testResult.error}`}
          </div>
        )}
      </div>

      {/* ── Status Dashboard ── */}
      {agentToken && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>📊 Agent Status</div>

          <div style={styles.statRow}>
            <span style={styles.statLabel}>Last Heartbeat</span>
            <span style={styles.statValue}>{timeAgo(status.lastHeartbeat)}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Last Job</span>
            <span style={styles.statValue}>
              {status.lastJobStatus
                ? `${status.lastJobStatus} · ${timeAgo(status.lastJobTime)}`
                : '—'}
            </span>
          </div>
          <div style={{ ...styles.statRow, borderBottom: 'none' }}>
            <span style={styles.statLabel}>Jobs Executed</span>
            <span style={styles.statValue}>{status.jobsExecuted}</span>
          </div>

          <button onClick={handleDisconnect} style={{ ...styles.btnDanger, marginTop: 16 }}>
            Disconnect &amp; Unpair
          </button>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.cardTitle}>⬆️ App Updates</div>
        <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 12 }}>
          {updateStatus.message}
        </div>
        {updateStatus.progress !== null && (
          <div style={{ ...styles.statRow }}>
            <span style={styles.statLabel}>Download Progress</span>
            <span style={styles.statValue}>{Math.round(updateStatus.progress)}%</span>
          </div>
        )}
        {updateStatus.version && (
          <div style={{ ...styles.statRow, borderBottom: 'none' }}>
            <span style={styles.statLabel}>Version</span>
            <span style={styles.statValue}>{updateStatus.version}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={handleCheckForUpdates}
            disabled={!updateStatus.enabled || updateStatus.phase === 'checking'}
            style={{
              ...styles.btnOutline,
              opacity: !updateStatus.enabled || updateStatus.phase === 'checking' ? 0.6 : 1,
            }}
          >
            {updateStatus.phase === 'checking' ? 'Checking…' : 'Check for Updates'}
          </button>
        </div>
      </div>
    </div>
  );
}
