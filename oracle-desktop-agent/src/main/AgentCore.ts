// We load oracledb dynamically so the agent can start even if the driver
// is missing. Oracle-specific operations then fail with a clear message.
let oracledb: any = null;
try {
  oracledb = require('oracledb');
} catch {
  console.warn('[AgentCore] oracledb driver not found. Oracle operations will fail.');
}

const AGENT_VERSION = '1.0.0';
const DEFAULT_POLL_MS = 5_000;
const DEFAULT_MAX_ROWS = 5_000;
const MAX_RESULT_BYTES = 1_500_000;

export interface OracleCredentials {
  host: string;
  port: number;
  service: string;
  username: string;
  password: string;
}

export interface AgentStatus {
  connected: boolean;
  lastHeartbeat: string | null;
  lastJobTime: string | null;
  lastJobStatus: 'SUCCESS' | 'FAILED' | null;
  jobsExecuted: number;
}

function getBackendUrl() {
  return (
    process.env.AGENT_BACKEND_URL || 'https://salesforce-fields-metadata-extracte-three.vercel.app'
  );
}

function byteLength(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

export class AgentCore {
  private token: string | null = null;
  private backendUrl: string;
  private pollTimer: NodeJS.Timeout | null = null;
  private pollInFlight = false;
  private isIntentionalStop = false;
  private credentialRetriever: (() => OracleCredentials | null) | null = null;
  private pool: any = null;
  private poolKey: string | null = null;

  private _status: AgentStatus = {
    connected: false,
    lastHeartbeat: null,
    lastJobTime: null,
    lastJobStatus: null,
    jobsExecuted: 0,
  };

  constructor() {
    this.backendUrl = getBackendUrl();
  }

  public setCredentialRetriever(fn: () => OracleCredentials | null) {
    this.credentialRetriever = fn;
  }

  public getStatus(): AgentStatus {
    return { ...this._status };
  }

  public setToken(token: string) {
    this.token = token;
    this.isIntentionalStop = false;
    this.schedulePoll(0);
  }

  public async stop() {
    this.isIntentionalStop = true;
    this.token = null;
    this._status.connected = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    await this.closePool();
  }

  private schedulePoll(delayMs = DEFAULT_POLL_MS) {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }

    if (!this.token || this.isIntentionalStop) {
      return;
    }

    this.pollTimer = setTimeout(() => {
      void this.pollOnce();
    }, delayMs);
  }

  private async pollOnce() {
    if (!this.token || this.pollInFlight || this.isIntentionalStop) {
      return;
    }

    this.pollInFlight = true;

    try {
      const response = await fetch(`${this.backendUrl}/api/agents/poll`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'x-agent-version': AGENT_VERSION,
        },
      });

      if (response.status === 401) {
        this._status.connected = false;
        console.error('[AgentCore] Agent authentication failed during poll');
        return;
      }

      if (!response.ok) {
        throw new Error(`Poll failed with status ${response.status}`);
      }

      const data = await response.json();
      this._status.connected = true;
      this._status.lastHeartbeat = new Date().toISOString();

      if (data.job?.id && data.job?.query) {
        await this.handleJob(data.job.id, data.job.query);
      }
    } catch (error: any) {
      this._status.connected = false;
      console.error('[AgentCore] Poll error:', error.message || error);
    } finally {
      this.pollInFlight = false;
      this.schedulePoll();
    }
  }

  private async ensurePool(creds: OracleCredentials) {
    if (!oracledb) {
      throw new Error('oracledb driver is not installed. Run: npm install oracledb');
    }

    const nextPoolKey = JSON.stringify(creds);
    if (this.pool && this.poolKey === nextPoolKey) {
      return this.pool;
    }

    await this.closePool();

    this.pool = await oracledb.createPool({
      user: creds.username,
      password: creds.password,
      connectString: `${creds.host}:${creds.port}/${creds.service}`,
      poolMin: 0,
      poolMax: 4,
      poolIncrement: 1,
    });
    this.poolKey = nextPoolKey;

    return this.pool;
  }

  private async closePool() {
    if (!this.pool) {
      return;
    }

    try {
      await this.pool.close(5);
    } catch (error) {
      console.error('[AgentCore] Failed to close Oracle pool:', error);
    } finally {
      this.pool = null;
      this.poolKey = null;
    }
  }

  private async validateQuery(connection: any, query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new Error('Query is empty');
    }

    const statements = trimmed
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);

    if (statements.length > 1) {
      throw new Error('Multiple statements are not allowed');
    }

    const startsReadOnly = /^(SELECT|WITH|EXPLAIN)\b/i.test(trimmed);
    if (!startsReadOnly) {
      throw new Error('Only read-only Oracle queries are allowed');
    }

    if (
      typeof connection.getStatementInfo === 'function' &&
      oracledb?.STMT_TYPE_SELECT !== undefined
    ) {
      const statementInfo = await connection.getStatementInfo(trimmed);
      if (statementInfo.statementType !== oracledb.STMT_TYPE_SELECT) {
        throw new Error('Only SELECT statements may be executed by the Oracle desktop agent');
      }
    }
  }

  private truncateRows(rows: Record<string, unknown>[]) {
    const output: Record<string, unknown>[] = [];
    let truncated = false;

    for (const row of rows) {
      output.push(row);
      if (byteLength({ rows: output }) > MAX_RESULT_BYTES) {
        output.pop();
        truncated = true;
        break;
      }
    }

    return {
      rows: output,
      truncated,
      bytes: byteLength({ rows: output }),
    };
  }

  private async submitJobResult(
    jobId: string,
    payload: {
      columns?: string[];
      rows?: Record<string, unknown>[];
      error?: string;
      meta?: Record<string, unknown>;
    }
  ) {
    if (!this.token) {
      throw new Error('Agent token is not configured');
    }

    const response = await fetch(`${this.backendUrl}/api/agents/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        job_id: jobId,
        ...payload,
      }),
    });

    if (!response.ok) {
      throw new Error(`Result submission failed with status ${response.status}`);
    }
  }

  private async handleJob(jobId: string, query: string) {
    console.log(`[AgentCore] Executing job ${jobId}`);

    const creds = this.credentialRetriever?.();
    if (!creds) {
      await this.submitFailure(jobId, 'No Oracle credentials configured locally.');
      return;
    }

    let connection: any = null;

    try {
      const pool = await this.ensurePool(creds);
      connection = await pool.getConnection();

      await this.validateQuery(connection, query);

      const result = await connection.execute(query, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        maxRows: DEFAULT_MAX_ROWS,
      });

      const rows = Array.isArray(result.rows) ? result.rows : [];
      const columns = Array.isArray(result.metaData)
        ? result.metaData
            .map((column: { name?: string }) => column?.name)
            .filter((name: string | undefined): name is string => Boolean(name))
        : rows.length > 0
          ? Object.keys(rows[0] ?? {})
          : [];
      const truncatedResult = this.truncateRows(rows);

      await this.submitJobResult(jobId, {
        columns,
        rows: truncatedResult.rows,
        meta: {
          truncated: truncatedResult.truncated,
          result_bytes: truncatedResult.bytes,
          rows_returned: rows.length,
        },
      });

      this._status.lastJobStatus = 'SUCCESS';
      this._status.lastJobTime = new Date().toISOString();
      this._status.jobsExecuted += 1;
    } catch (error: any) {
      console.error(`[AgentCore] Job ${jobId} failed:`, error.message || error);
      await this.submitFailure(jobId, error.message || 'Unknown Oracle error');
      this._status.lastJobStatus = 'FAILED';
      this._status.lastJobTime = new Date().toISOString();
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (error) {
          console.error('[AgentCore] Failed to close Oracle connection:', error);
        }
      }
    }
  }

  private async submitFailure(jobId: string, error: string) {
    try {
      await this.submitJobResult(jobId, { error });
    } catch (submitError) {
      console.error('[AgentCore] Failed to submit job failure:', submitError);
    }
  }

  public async testOracleConnection(
    creds: OracleCredentials
  ): Promise<{ success: boolean; error?: string }> {
    if (!oracledb) {
      return { success: false, error: 'oracledb driver is not installed.' };
    }

    let connection: any = null;
    try {
      connection = await oracledb.getConnection({
        user: creds.username,
        password: creds.password,
        connectString: `${creds.host}:${creds.port}/${creds.service}`,
      });

      await connection.execute('SELECT 1 FROM DUAL');
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.message ||
          'Oracle connection failed. Thin mode is expected by default; verify network access and credentials.',
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch {
          // ignore close errors in connection tests
        }
      }
    }
  }
}

export const agentCore = new AgentCore();
