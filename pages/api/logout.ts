import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { clearAuthCookies, getAuthToken } from '@lib/cookieAuth';

interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<LogoutResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing authentication token' });
    }

    const supabase = getServiceRoleClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { error } = await supabase.from('active_sessions').delete().eq('session_token', token);

    if (error) {
      console.error('Error removing session:', error);
    }

    const { error: signOutError } = await supabase.auth.admin.signOut(token);

    if (signOutError) {
      console.error('Error signing out from Supabase Auth:', signOutError);
    }

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (err) {
    console.error('Unexpected logout error:', err);
    return res.status(500).json({ success: false, error: 'Unexpected server error.' });
  }
}
