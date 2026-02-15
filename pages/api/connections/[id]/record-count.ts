/**
 * GET /api/connections/[id]/record-count?object=ObjectName
 *
 * Returns the total record/row count for a specific table/object.
 * Provider-agnostic: works with both Salesforce and Snowflake connections.
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

  try {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const supabase = getServiceRoleClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) return res.status(401).json({ success: false, error: 'Invalid token' });

    const connectionId = req.query.id as string;
    const objectName = req.query.object as string;

    if (!objectName) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing required query param: object' });
    }

    // Look up connection type
    const { data: conn, error: connError } = await supabase
      .from('connections')
      .select('id, connection_type')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single();

    if (connError || !conn) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    const provider = getProvider(conn.connection_type, req, res);
    const count = await provider.getRecordCount(connectionId, user.id, objectName);

    return res.status(200).json({ success: true, count });
  } catch (err) {
    return handleApiError(err, req, res, 'connection-record-count');
  }
}
