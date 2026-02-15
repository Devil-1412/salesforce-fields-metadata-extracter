/**
 * GET /api/connections/[id]/columns?table=TABLE_NAME
 *
 * Returns columns/fields for a specific table/object in any connection type.
 * Delegates to the correct provider (Salesforce → describe, Snowflake → information_schema.columns).
 */

import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { getProvider } from '@lib/providers/registry';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id, table } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing connection ID' });
  }
  if (!table || typeof table !== 'string') {
    return res
      .status(400)
      .json({ success: false, error: 'Missing table name (use ?table=TABLE_NAME)' });
  }

  try {
    const supabase = getServiceRoleClient();

    const authToken = getAuthToken(req);
    if (!authToken) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authToken);
    if (authError || !user) return res.status(401).json({ success: false, error: 'Invalid token' });

    // Get connection type
    const { data: connection, error: connError } = await supabase
      .from('connections')
      .select('connection_type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    const provider = getProvider(connection.connection_type, req, res);
    const columns = await provider.getColumns(id, user.id, table);

    return res.status(200).json({ success: true, columns });
  } catch (err) {
    return handleApiError(err, req, res, 'connection-columns');
  }
}
