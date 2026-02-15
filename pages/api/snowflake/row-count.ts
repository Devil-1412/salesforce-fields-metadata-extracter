import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { executeSnowflakeQuery } from '@lib/snowflakeClient';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const supabase = getServiceRoleClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) return res.status(401).json({ success: false, error: 'Invalid token' });

    const { connectionId, tableName, schema } = req.body;
    if (!connectionId || !tableName) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    // Use SQL injection safe binding for identifiers if possible, or validate format.
    // Snowflake table names can be tricky so usually we should quote them,
    // but the driver's bind might handle values, not identifiers.
    // For safety in this MVP, we query INFORMATION_SCHEMA first or assume inputs are safe from `tables` API.
    // Better: Query row_count from tables view (fastest)

    const query = `
      SELECT row_count
      FROM information_schema.tables
      WHERE table_name = ?
      ${schema ? 'AND table_schema = ?' : ''}
    `;
    const binds = schema ? [tableName, schema] : [tableName];

    const rows = await executeSnowflakeQuery(connectionId, user.id, query, binds);
    const count = rows.length > 0 ? rows[0].ROW_COUNT : 0;

    return res.status(200).json({ success: true, count });
  } catch (err) {
    return handleApiError(err, req, res, 'snowflake-row-count');
  }
}
