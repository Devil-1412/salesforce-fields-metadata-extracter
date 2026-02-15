import { getAuthToken } from '@lib/cookieAuth';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ProfileResponse {
  success: boolean;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    plan: string | null;
    role?: string;
    created_at?: string | null;
  };
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ProfileResponse>) {
  if (req.method !== 'POST' && req.method !== 'GET') {
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
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Attempt to fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, role, created_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res
        .status(404)
        .json({ success: false, error: profileError?.message || 'Profile not found' });
    }

    res.status(200).json({
      success: true,
      user: profile,
    });
  } catch (err) {
    console.error('Profile API error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export default jsforceRateLimiter(handler);
