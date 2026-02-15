/**
 * POST /api/connections/[id]/fields
 *
 * Returns detailed field/column metadata for one or more objects/tables.
 * Provider-agnostic: works with both Salesforce and Snowflake connections.
 *
 * Body: { objects: ["Account", "Contact"] }
 * Returns: { success: true, data: { Account: [...fields], Contact: [...fields] } }
 */

import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { getProvider } from '@lib/providers/registry';
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

    const connectionId = req.query.id as string;
    const { objects } = req.body;

    if (!objects || !Array.isArray(objects) || objects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid body param: objects (array of table/object names)',
      });
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
    const data = await provider.getDetailedFields(connectionId, user.id, objects);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(err, req, res, 'connection-fields');
  }
}
