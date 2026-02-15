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

    const { connectionId } = req.body;
    if (!connectionId)
      return res.status(400).json({ success: false, error: 'Missing connectionId' });

    const query = `
      SELECT table_name, table_schema, row_count, comment
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      AND table_schema != 'INFORMATION_SCHEMA'
      ORDER BY table_name;
    `;

    const tables = await executeSnowflakeQuery(connectionId, user.id, query);

    // map fields to match UI expectation if needed
    const mappedTables = tables.map((t: any) => ({
      name: t.TABLE_NAME,
      label: t.TABLE_NAME, // Dictionary compatibility
      schema: t.TABLE_SCHEMA,
      rowCount: t.ROW_COUNT,
      comment: t.COMMENT,
      custom: true, // Treat as "custom" object for UI filters
    }));

    return res.status(200).json({ success: true, tables: mappedTables });
  } catch (err) {
    return handleApiError(err, req, res, 'snowflake-tables');
  }
}
