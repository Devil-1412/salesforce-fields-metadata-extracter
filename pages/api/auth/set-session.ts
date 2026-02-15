import { setAuthCookies } from '@lib/cookieAuth';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { NextApiRequest, NextApiResponse } from 'next';

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return forwardedStr!.split(',')[0]!.trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0]! : realIp;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { access_token, refresh_token, user } = req.body;

  if (!access_token || !refresh_token || !user) {
    return res.status(400).json({ error: 'Missing session data' });
  }

  const supabase = getServiceRoleClient();

  try {
    // Session Tracking
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const deviceInfo = getDeviceInfo(userAgent);
    const ipAddress = getClientIp(req);

    try {
      await supabase.from('active_sessions').insert({
        user_id: user.id,
        session_token: access_token,
        device_info: deviceInfo,
        ip_address: ipAddress,
        user_agent: userAgent,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    } catch (sessionErr) {
      console.error('Error saving session:', sessionErr);
      // Non-blocking
    }

    // Ensure Profile Exists (Critical for Google Auth)
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        console.log('Creating profile for Google Auth user:', user.email);
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0],
            created_at: new Date().toISOString(),
          },
        ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
    } catch (profileErr) {
      console.error('Unexpected error checking/creating profile:', profileErr);
    }

    // Set cookies
    setAuthCookies(res, access_token, refresh_token);

    // Check if user has any connection (for onboarding redirect)
    const { count, error: connError } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (connError) {
      console.error('Error checking connections:', connError);
    }

    return res.status(200).json({ success: true, hasOrganization: (count || 0) > 0 });
  } catch (error) {
    console.error('Set Session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
