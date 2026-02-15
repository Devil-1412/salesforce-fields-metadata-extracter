/**
 * DELETE /api/connections/[id]
 * GET    /api/connections/[id]  — returns connection details
 *
 * Unified connection management endpoint.
 */

import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { getProvider } from '@lib/providers/registry';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Fetch the parent connection to determine the type
    const { data: connection, error: connError } = await supabase
      .from('connections')
      .select('id, connection_type, display_name, user_id, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // ── GET ──
    if (req.method === 'GET') {
      const provider = getProvider(connection.connection_type, req, res);
      const healthy = await provider.testConnection(id, user.id);

      return res.status(200).json({
        success: true,
        connection: {
          ...connection,
          healthy,
        },
      });
    }

    // ── DELETE ──
    if (req.method === 'DELETE') {
      const { error: deleteError } = await supabase
        .from('connections')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      return res.status(200).json({ success: true, message: 'Connection deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return handleApiError(err, req, res, 'connection-by-id');
  }
}
