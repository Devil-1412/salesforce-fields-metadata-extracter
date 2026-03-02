import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const supabase = getServiceRoleClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { data: connections, error } = await supabase
      .from('connections')
      .select('id, display_name, created_at, iics_connection_details(username, pod_region)')
      .eq('user_id', user.id)
      .eq('connection_type', 'iics')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten to match frontend shape
    const flatConnections = (connections || []).map((c: any) => ({
      id: c.id,
      username: c.iics_connection_details?.username,
      pod_region: c.iics_connection_details?.pod_region,
      created_at: c.created_at,
    }));

    return res.status(200).json({ success: true, connections: flatConnections });
  } catch (err) {
    return handleApiError(err, req, res, 'iics-list');
  }
}
