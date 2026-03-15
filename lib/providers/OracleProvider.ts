import { getServiceRoleClient } from '../supabaseClient';
import { enqueueAgentJob, waitForAgentJob } from '../agents/jobs';
import type {
  ColumnInfo,
  ConnectionProvider,
  FieldAnalysisResult,
  MetadataItem,
  ObjectDescribe,
  QueryResult,
  TableInfo,
} from './types';

/**
 * Executes a query on the connected Oracle Desktop Agent.
 * This looks up the `agent_id` stored in the `connections` table,
 * then enqueues the SQL payload in Supabase for the desktop agent to poll.
 */
async function queryAgent(connectionId: string, userId: string, query: string): Promise<any[]> {
  const supabase = getServiceRoleClient();
  const staleCutoff = new Date(Date.now() - 30_000).toISOString();

  const { data: connection, error: connError } = await supabase
    .from('connections')
    .select('id')
    .eq('id', connectionId)
    .eq('user_id', userId)
    .eq('connection_type', 'oracle')
    .single();

  if (connError || !connection) {
    throw new Error('Connection not found or unauthorized');
  }

  const { data: connectionDetails, error: detailsError } = await supabase
    .from('oracle_connection_details')
    .select('agent_id')
    .eq('connection_id', connectionId)
    .single();

  const agentId = connectionDetails?.agent_id;
  if (detailsError || !agentId) {
    throw new Error('No desktop agent ID associated with this connection');
  }

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, last_seen')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single();

  if (agentError || !agent) {
    throw new Error('The Oracle desktop agent was not found for this user');
  }

  if (!agent.last_seen || agent.last_seen < staleCutoff) {
    throw new Error('The Oracle desktop agent is offline. Open the desktop app and reconnect it.');
  }

  const jobId = await enqueueAgentJob(agent.id, userId, query);

  try {
    const result = await waitForAgentJob(jobId);
    return result.rows;
  } catch (err: any) {
    throw new Error(`Oracle Agent Query Failed: ${err.message}`);
  }
}


export class OracleProvider implements ConnectionProvider {
  readonly type = 'oracle';

  // ── Connection test ──
  async testConnection(connectionId: string, userId: string): Promise<boolean> {
    try {
      await queryAgent(connectionId, userId, 'SELECT 1 as "test" FROM dual');
      return true;
    } catch (err) {
      console.error('[OracleProvider testConnection] Failed:', err);
      return false;
    }
  }

  // ── List objects / tables ──
  async listTables(connectionId: string, userId: string): Promise<TableInfo[]> {
    const query = `
      SELECT table_name as "name", num_rows as "rowCount", 'TABLE' as "schema"
      FROM all_tables 
      WHERE owner = SYS_CONTEXT('USERENV', 'CURRENT_USER')
      ORDER BY table_name
    `;
    const rows = await queryAgent(connectionId, userId, query);

    return rows.map((r: any) => ({
      name: r.name,
      label: r.name,
      schema: r.schema,
      rowCount: r.rowCount,
      custom: false,
    }));
  }

  // ── Get columns / fields ──
  async getColumns(connectionId: string, userId: string, tableName: string): Promise<ColumnInfo[]> {
    // Note: Parameter binding would be ideal, but for now we sanitize/replace
    const safeTableName = tableName.replace(/'/g, "''").toUpperCase();
    
    const query = `
      SELECT column_name as "name", data_type as "type", data_length as "length", nullable as "nullable"
      FROM all_tab_columns 
      WHERE table_name = '${safeTableName}'
      AND owner = SYS_CONTEXT('USERENV', 'CURRENT_USER')
      ORDER BY column_id
    `;
    const rows = await queryAgent(connectionId, userId, query);

    return rows.map((r: any) => ({
      name: r.name,
      label: r.name,
      type: r.type,
      length: r.length,
      nullable: r.nullable === 'Y',
    }));
  }

  // ── Execute custom query ──
  async executeQuery(connectionId: string, userId: string, query: string): Promise<QueryResult> {
    const rows = await queryAgent(connectionId, userId, query);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    
    return {
      columns,
      rows,
      totalSize: rows.length,
    };
  }

  // ── Describe object ──
  async describeObject(
    connectionId: string,
    userId: string,
    objectName: string
  ): Promise<ObjectDescribe> {
    const columns = await this.getColumns(connectionId, userId, objectName);
    
    // Attempt to get row count
    const safeName = objectName.replace(/"/g, '""');
    let rowCount = 0;
    try {
      const rows = await queryAgent(connectionId, userId, `SELECT COUNT(*) as "cnt" FROM "${safeName}"`);
      if (rows && rows.length > 0) {
        rowCount = rows[0].cnt;
      }
    } catch {
      // ignore
    }

    return {
      name: objectName,
      label: objectName,
      fields: columns,
      connectionType: 'oracle',
      rowCount,
    };
  }

  // ── Object metadata ──
  async getObjectMetadata(
    _connectionId: string,
    _userId: string,
    _objectName: string,
    _metadataType: string
  ): Promise<MetadataItem[]> {
    // Oracle specific metadata like triggers or constraints can be added here
    return [];
  }

  // ── Record count ──
  async getRecordCount(
    connectionId: string,
    userId: string,
    objectName: string
  ): Promise<number> {
    const safeName = objectName.replace(/"/g, '""');
    const rows = await queryAgent(connectionId, userId, `SELECT COUNT(*) as "cnt" FROM "${safeName}"`);
    return rows[0]?.cnt || 0;
  }

  // ── Detailed fields ──
  async getDetailedFields(
    connectionId: string,
    userId: string,
    objectNames: string[]
  ): Promise<Record<string, Record<string, unknown>[]>> {
    const result: Record<string, Record<string, unknown>[]> = {};
    for (const obj of objectNames) {
      result[obj] = (await this.getColumns(connectionId, userId, obj)) as any;
    }
    return result;
  }

  // ── Field analysis ──
  async getFieldAnalysis(
    connectionId: string,
    userId: string,
    objectName: string
  ): Promise<FieldAnalysisResult> {
    const safeName = objectName.replace(/"/g, '""');
    const cols = await this.getColumns(connectionId, userId, objectName);
    
    // Very basic analysis implementation (can be optimized with batched counts)
    const totalRows = await this.getRecordCount(connectionId, userId, objectName);
    const fields: Record<string, any> = {};

    for (const col of cols.slice(0, 10)) { // Limit to 10 for performance
      const safeCol = col.name.replace(/"/g, '""');
      try {
        const query = `SELECT COUNT("${safeCol}") as "pop", COUNT(DISTINCT "${safeCol}") as "dist", MAX("${safeCol}") as "samp" FROM "${safeName}"`;
        const res = await queryAgent(connectionId, userId, query);
        fields[col.name] = {
          populated: res[0]?.pop || 0,
          distinct: res[0]?.dist || 0,
          sample: res[0]?.samp || null,
        };
      } catch {
        fields[col.name] = { populated: 0, distinct: 0, sample: null };
      }
    }

    return { totalRows, fields };
  }
}
