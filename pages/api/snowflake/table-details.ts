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

    // Query columns
    const query = `
      SELECT column_name, data_type, is_nullable, character_maximum_length, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = ?
      ${schema ? 'AND table_schema = ?' : ''}
      ORDER BY ordinal_position;
    `;

    const binds = schema ? [tableName, schema] : [tableName];
    const columns = await executeSnowflakeQuery(connectionId, user.id, query, binds);

    const mappedColumns = columns.map((c: any) => ({
      name: c.COLUMN_NAME,
      label: c.COLUMN_NAME,
      type: c.DATA_TYPE,
      length: c.CHARACTER_MAXIMUM_LENGTH,
      precision: c.NUMERIC_PRECISION,
      scale: c.NUMERIC_SCALE,
      nillable: c.IS_NULLABLE === 'YES',
    }));

    return res.status(200).json({
      success: true,
      data: {
        fields: mappedColumns,
        name: tableName,
        label: tableName,
      },
    });
  } catch (err) {
    return handleApiError(err, req, res, 'snowflake-table-details');
  }
}
