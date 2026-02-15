/**
 * GET /api/connections/[id]/tables
 *
 * Returns the list of tables/objects for any connection type.
 * Delegates to the correct provider (Salesforce → sobjects, Snowflake → information_schema).
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

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing connection ID' });
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
    const tables = await provider.listTables(id, user.id);

    return res.status(200).json({ success: true, tables });
  } catch (err) {
    return handleApiError(err, req, res, 'connection-tables');
  }
}
