/**
 * GET /api/connections/[id]/runtime-detail?envId=<id>
 *
 * Returns full detail for a specific IICS runtime environment.
 * Uses the IICS Data Integration REST API: GET /api/v2/runtimeEnvironment/<id>
 */

import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { IICSProvider } from '@lib/providers/IICSProvider';
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
    const envId = req.query.envId as string;

    if (!envId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query param: envId',
      });
    }

    // Verify the connection belongs to this user and is IICS
    const { data: conn, error: connError } = await supabase
      .from('connections')
      .select('id, connection_type')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single();

    if (connError || !conn) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    if (conn.connection_type !== 'iics') {
      return res
        .status(400)
        .json({ success: false, error: 'Runtime detail is only available for IICS connections' });
    }

    const provider = new IICSProvider();
    const data = await provider.getRuntimeEnvDetail(connectionId, user.id, envId);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(err, req, res, 'runtime-detail');
  }
}
