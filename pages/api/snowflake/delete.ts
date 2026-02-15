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

    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing ID' });
    }

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // RLS redundancy for safety

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    return handleApiError(err, req, res, 'snowflake-delete');
  }
}
