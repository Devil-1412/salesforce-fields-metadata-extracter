import type { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { decrypt } from '@lib/encryption';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError, logError } from '@lib/errorHandler';
import { validateContentType } from '@lib/contentTypeValidator';

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

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, org_email, org_name, encrypted_org_password, encrypted_security_token, is_sandbox, instance_url')
      .eq('user_id', user.id)
      .eq('instance_url', instanceUrl)
      .single();

    if (orgError || !org) {
      console.error('Supabase fetch error or org not found:', orgError);
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    const loginUrl = org.is_sandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com';

    const conn = new jsforce.Connection({ loginUrl });

    try {
      const orgPassword = org.encrypted_org_password ? decrypt(org.encrypted_org_password) : '';
      const securityToken = org.encrypted_security_token ? decrypt(org.encrypted_security_token) : '';

      await conn.login(org.org_email, orgPassword + securityToken);

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
        error: 'Login failed for this organization. Please add this organisation again in user profile.',
      });
    }
  } catch (err) {
    handleApiError(err, req, res, 'salesforceLogin');
  }
}

export default jsforceRateLimiter(handler);
