import { getAuthToken } from '@lib/cookieAuth';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

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

    const { data: connections, error: connError } = await supabase
      .from('connections')
      .select(
        'id, display_name, created_at, salesforce_connection_details(org_email, org_name, instance_url, is_sandbox)'
      )
      .eq('user_id', user.id)
      .eq('connection_type', 'salesforce')
      .order('created_at', { ascending: false });

    if (connError) {
      console.error('Organization fetch error:', connError.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch organizations' });
    }

    // Flatten to match existing frontend shape
    const organizations = (connections || []).map((c: any) => ({
      id: c.id,
      org_email: c.salesforce_connection_details?.org_email,
      org_name: c.salesforce_connection_details?.org_name || c.display_name,
      instance_url: c.salesforce_connection_details?.instance_url,
      is_sandbox: c.salesforce_connection_details?.is_sandbox,
      created_at: c.created_at,
    }));

    res.status(200).json({
      success: true,
      organizations,
    });
  } catch (err) {
    console.error('listAllOrgs API error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

export default jsforceRateLimiter(handler);
