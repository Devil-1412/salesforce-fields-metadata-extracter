import snowflake from 'snowflake-sdk';

interface SnowflakeConnectionOptions {
  account: string;
  username: string;
  password?: string;
  warehouse?: string;
  database?: string;
  schema?: string;
  role?: string;
}

class SnowflakeConnectionManager {
  private static instance: SnowflakeConnectionManager;
  private connections: Map<string, snowflake.Connection>;
  private lastUsed: Map<string, number>;
  private readonly IDLE_TIMEOUT = 1000 * 60 * 60; // 60 minutes (1 hour)

  private constructor() {
    this.connections = new Map();
    this.lastUsed = new Map();

    // Periodic cleanup of idle connections
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupIdleConnections(), 1000 * 60 * 5); // Check every 5 mins
    }
  }

  public static getInstance(): SnowflakeConnectionManager {
    if (!SnowflakeConnectionManager.instance) {
      SnowflakeConnectionManager.instance = new SnowflakeConnectionManager();
    }
    return SnowflakeConnectionManager.instance;
  }

  private getConnectionKey(options: SnowflakeConnectionOptions): string {
    // Unique key based on critical connection parameters
    return `${options.account}:${options.username}:${options.database || ''}:${options.warehouse || ''}:${options.role || ''}`;
  }

  public async getConnection(options: SnowflakeConnectionOptions): Promise<snowflake.Connection> {
    const key = this.getConnectionKey(options);

    // Check if we have an active connection
    if (this.connections.has(key)) {
      const conn = this.connections.get(key)!;
      const lastUsed = this.lastUsed.get(key) || 0;
      const now = Date.now();

      // OPTIMIZATION: If used recently (within 15 mins), trust it without checking isUp()
      // This saves 1 API call per execution for frequent users.
      const isRecent = now - lastUsed < 1000 * 60 * 15; // 15 minutes trust

      if (isRecent) {
        console.log(`[Snowflake] Reusing existing connection (Trusted) for ${key}`);
        this.lastUsed.set(key, now);
        return conn;
      }

      // If not recent, verify it's still alive
      if (this.isConnectionValid(conn)) {
        console.log(`[Snowflake] Reusing existing connection (Verified) for ${key}`);
        this.lastUsed.set(key, now);
        return conn;
      } else {
        console.log(`[Snowflake] active connection found but invalid/closed for ${key}. Removing.`);
        this.connections.delete(key);
        this.lastUsed.delete(key);
      }
    }

    // Create new connection
    console.log(`[Snowflake] Creating NEW connection for ${key}`);
    const connection = snowflake.createConnection({
      account: options.account,
      username: options.username,
      password: options.password,
      warehouse: options.warehouse,
      database: options.database,
      schema: options.schema,
      role: options.role,
      clientSessionKeepAlive: true, // Keep session alive
    });

    return new Promise((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          console.error('[Snowflake] Connection failed:', err);
          reject(err);
        } else {
          console.log(`[Snowflake] Connected successfully to ${key}`);
          this.connections.set(key, conn);
          this.lastUsed.set(key, Date.now());
          resolve(conn);
        }
      });
    });
  }

  private isConnectionValid(conn: snowflake.Connection): boolean {
    return conn.isUp();
  }

  private cleanupIdleConnections() {
    const now = Date.now();
    for (const [key, lastUsedTime] of this.lastUsed.entries()) {
      if (now - lastUsedTime > this.IDLE_TIMEOUT) {
        console.log(`[Snowflake] Closing idle connection: ${key}`);
        const conn = this.connections.get(key);
        if (conn) {
          // Best effort destroy
          try {
            conn.destroy((err) => {
              if (err) console.error('Error destroying conn', err);
            });
          } catch (e) {
            console.error('Error destroying conn', e);
          }
        }
        this.connections.delete(key);
        this.lastUsed.delete(key);
      }
    }
  }

  /**
   * Helper to execute a query using the pooled connection
   */
  public async execute(
    options: SnowflakeConnectionOptions,
    sqlText: string,
    binds: any[] = []
  ): Promise<any[]> {
    const connection = await this.getConnection(options);

    return new Promise((resolve, reject) => {
      connection.execute({
        sqlText,
        binds,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('[Snowflake] Query execution error:', err);
            // If error is related to connection/session, we might want to invalidate the connection
            if (
              err.message &&
              (err.message.includes('Session no longer exists') ||
                err.message.includes('Connection closed'))
            ) {
              const key = this.getConnectionKey(options);
              this.connections.delete(key);
              this.lastUsed.delete(key);
            }
            reject(err);
          } else {
            resolve(rows || []);
          }
        },
      });
    });
  }
}

export default SnowflakeConnectionManager;
