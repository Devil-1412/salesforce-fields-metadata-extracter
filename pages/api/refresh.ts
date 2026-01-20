import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { getRefreshToken, setAuthCookies, getAuthToken } from '@lib/cookieAuth';

interface RefreshResponse {
  success: boolean;
  message?: string;
  expiresIn?: number;
  error?: string;
  requiresLogin?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<RefreshResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const refreshToken = getRefreshToken(req);
    const currentAccessToken = getAuthToken(req);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Missing refresh token',
        requiresLogin: true,
      });
    }

    const supabase = getServiceRoleClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data?.session) {
      console.error('Token refresh error:', error?.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        requiresLogin: true,
      });
    }

    const { session, user } = data;

    if (currentAccessToken && user) {
      try {
        const { error: updateError } = await supabase
          .from('active_sessions')
          .update({
            session_token: session.access_token,
            last_activity: new Date().toISOString(),
          })
          .eq('session_token', currentAccessToken)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating session:', updateError);
        }
      } catch (sessionErr) {
        console.error('Unexpected error updating session:', sessionErr);
      }
    }

    setAuthCookies(res, session.access_token, session.refresh_token || '');

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      expiresIn: session.expires_in,
    });
  } catch (err) {
    console.error('Unexpected refresh error:', err);
    return res.status(500).json({
      success: false,
      error: 'Unexpected server error.',
    });
  }
}
