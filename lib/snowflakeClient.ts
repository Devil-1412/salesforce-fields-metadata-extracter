import { decrypt } from './encryption';
import SnowflakeConnectionManager from './SnowflakeConnectionManager';
import { getServiceRoleClient } from './supabaseClient';

export async function executeSnowflakeQuery(
  connectionId: string,
  userId: string,
  query: string,
  params: any[] = []
): Promise<any[]> {
  const supabase = getServiceRoleClient();

  // 1. Fetch connection details from Supabase (joined query)
  const { data: conn, error } = await supabase
    .from('connections')
    .select(
      'id, snowflake_connection_details(account_identifier, username, encrypted_password, warehouse, database, schema, role)'
    )
    .eq('id', connectionId)
    .eq('user_id', userId)
    .eq('connection_type', 'snowflake')
    .single();

  const connection = (conn as any)?.snowflake_connection_details;

  if (error || !connection) {
    throw new Error('Snowflake connection not found or unauthorized');
  }

  // 2. Decrypt password
  let password = '';
  try {
    password = decrypt(connection.encrypted_password);
  } catch (e) {
    console.error('Error decrypting password', e);
    throw new Error('Failed to decrypt Snowflake credentials');
  }

  // 3. Prepare connection options
  const options = {
    account: connection.account_identifier,
    username: connection.username,
    password: password,
    warehouse: connection.warehouse,
    database: connection.database,
    schema: connection.schema, // Optional
    role: connection.role, // Optional
  };

  // 4. Execute using the Manager
  const manager = SnowflakeConnectionManager.getInstance();
  try {
    const results = await manager.execute(options, query, params);
    return results;
  } catch (err: any) {
    console.error('Snowflake query execution failed', err);
    throw new Error(`Snowflake Error: ${err.message}`);
  }
}
