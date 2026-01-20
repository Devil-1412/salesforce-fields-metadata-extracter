import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { getAuthToken } from '@lib/cookieAuth';
import { jsforceRateLimiter } from '@lib/rateLimiter';

interface Organization {
  id: string;
  org_email: string;
  org_name: string | null;
  instance_url: string;
  is_sandbox: boolean;
  created_at: string;
}

interface ListOrgsResponse {
  success: boolean;
  organizations?: Organization[];
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ListOrgsResponse>) {
  if (req.method !== 'GET' && req.method !== 'POST') {
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

    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, org_email, org_name, instance_url, is_sandbox, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (orgError) {
      console.error('Organization fetch error:', orgError.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch organizations' });
    }

    res.status(200).json({
      success: true,
      organizations: orgs || [],
    });
  } catch (err) {
    console.error('listAllOrgs API error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export default jsforceRateLimiter(handler);
