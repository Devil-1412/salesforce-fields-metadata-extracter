import { setAuthCookies } from '@lib/cookieAuth';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: { id: string; email: string };
  hasOrganization?: boolean;
  error?: string;
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return forwardedStr.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return (req.socket as { remoteAddress?: string })?.remoteAddress || 'unknown';
}

function getDeviceInfo(userAgent: string | undefined): string {
  if (!userAgent) return 'Unknown Device';

  if (
    userAgent.includes('Mobile') ||
    userAgent.includes('Android') ||
    userAgent.includes('iPhone')
  ) {
    if (userAgent.includes('Android')) return 'Android Mobile';
    if (userAgent.includes('iPhone')) return 'iPhone';
    return 'Mobile Device';
  }

  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Macintosh')) return 'Mac';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Linux')) return 'Linux';

  return 'Desktop';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<LoginResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const supabase = getServiceRoleClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data?.session) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Please verify your email first.',
      });
    }

    const ipAddress = getClientIp(req);
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const deviceInfo = getDeviceInfo(userAgent);

    try {
      const { error: sessionError } = await supabase.from('active_sessions').insert({
        user_id: data.user.id,
        session_token: data.session.access_token,
        device_info: deviceInfo,
        ip_address: ipAddress,
        user_agent: userAgent,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      if (sessionError) {
        console.error('Error saving session:', sessionError);
      }
    } catch (sessionErr) {
      console.error('Unexpected error saving session:', sessionErr);
    }

    const { count, error: orgError } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', data.user.id);

    if (orgError) {
      console.error('Error checking organizations:', orgError);
    }

    // Set both access and refresh token cookies
    setAuthCookies(res, data.session.access_token, data.session.refresh_token);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: data.user?.id,
        email: data.user?.email || '',
      },
      hasOrganization: (count || 0) > 0,
    });
  } catch (err) {
    console.error('Unexpected login error:', err);
    return res.status(500).json({ success: false, error: 'Unexpected server error.' });
  }
}
