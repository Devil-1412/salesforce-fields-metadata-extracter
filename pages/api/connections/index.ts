/**
 * GET /api/connections
 *
 * Returns all connections for the authenticated user, regardless of provider type.
 * Each connection includes its type and display name.
 */

import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
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

    const { data: connections, error } = await supabase
      .from('connections')
      .select('id, connection_type, display_name, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, connections: connections || [] });
  } catch (err) {
    return handleApiError(err, req, res, 'connections-list');
  }
}
