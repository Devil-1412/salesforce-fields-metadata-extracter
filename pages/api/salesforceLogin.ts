import { AuthStore } from '@lib/AuthStore';
import { validateContentType } from '@lib/contentTypeValidator';
import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError, logError } from '@lib/errorHandler';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

interface SalesforceLoginResponse {
  success: boolean;
  accessToken?: string;
  instanceUrl?: string;
  orgName?: string;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<SalesforceLoginResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!validateContentType(req, res)) {
    return;
  }

  try {
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing authentication token' });
    }

    const { instanceUrl } = req.body;
    if (!instanceUrl) {
      return res.status(400).json({ success: false, error: 'Missing instanceUrl' });
    }

    const supabase = getServiceRoleClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { data: conn, error: connError } = await supabase
      .from('connections')
      .select(
        'id, salesforce_connection_details(org_email, org_name, encrypted_org_password, encrypted_security_token, is_sandbox, instance_url)'
      )
      .eq('user_id', user.id)
      .eq('connection_type', 'salesforce')
      .single();

    // Flatten the nested details
    const details = (conn as any)?.salesforce_connection_details;
    const org =
      conn && details
        ? {
            id: conn.id,
            org_email: details.org_email,
            org_name: details.org_name,
            encrypted_org_password: details.encrypted_org_password,
            encrypted_security_token: details.encrypted_security_token,
            is_sandbox: details.is_sandbox,
            instance_url: details.instance_url,
          }
        : null;

    if (connError || !org) {
      console.error('Supabase fetch error or org not found:', connError);
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    const loginUrl = org.is_sandbox
      ? 'https://test.salesforce.com'
      : 'https://login.salesforce.com';

    // Use AuthStore to handle the connection (Cache -> Verify -> Login -> Cache)
    const store = new AuthStore(req, res, instanceUrl);

    try {
      const conn = await store.getConnection();

      res.status(200).json({
        success: true,
        accessToken: conn.accessToken || undefined,
        instanceUrl: conn.instanceUrl,
        orgName: org.org_name || 'Unknown Org',
      });
    } catch (loginErr) {
      logError(loginErr, req, 'salesforceLogin-login');
      return res.status(401).json({
        success: false,
        error:
          'Login failed for this organization. Please add this organisation again in user profile.',
      });
    }
  } catch (err) {
    handleApiError(err, req, res, 'salesforceLogin');
  }
}

export default jsforceRateLimiter(handler);
