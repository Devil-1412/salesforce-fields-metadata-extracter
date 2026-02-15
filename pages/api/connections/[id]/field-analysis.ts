/**
 * POST /api/connections/[id]/field-analysis
 *
 * Returns field-level analysis (populated count, distinct count, sample value)
 * for all fields/columns in the given object/table.
 *
 * Body: { objectName: string }
 *
 * Works with all connection types (Salesforce, Snowflake, etc.)
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
    const { objectName } = req.body;

    if (!objectName) {
      return res.status(400).json({ success: false, error: 'Missing required field: objectName' });
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
    const result = await provider.getFieldAnalysis(connectionId, user.id, objectName);

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return handleApiError(err, req, res, 'field-analysis');
  }
}
