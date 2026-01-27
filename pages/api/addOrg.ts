import { validateContentType } from '@lib/contentTypeValidator';
import { getAuthToken } from '@lib/cookieAuth';
import { encrypt } from '@lib/encryption';
import { handleApiError, logError } from '@lib/errorHandler';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { validateRequestBody } from '@lib/validation/middleware';
import { addOrgSchema } from '@lib/validation/schemas';
import jsforce from 'jsforce';
import type { NextApiRequest, NextApiResponse } from 'next';

interface AddOrgResponse {
  success: boolean;
  message?: string;
  instanceUrl?: string;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<AddOrgResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!validateContentType(req, res)) {
    return;
  }

  try {
    const validated = validateRequestBody(addOrgSchema, req, res);
    if (!validated) {
      return;
    }

    const { orgEmail, orgPassword, securityToken, isSandbox } = validated;

    const supabase = getServiceRoleClient();

    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing authentication token' });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const loginUrl = isSandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com';

    let instanceUrl: string | null = null;
    let orgName: string | null = null;
    try {
      const conn = new jsforce.Connection({ loginUrl });
      await conn.login(orgEmail, orgPassword + securityToken);
      instanceUrl = conn.instanceUrl;

      const orgInfo = await conn.query<{ Name: string }>('SELECT Name FROM Organization LIMIT 1');
      if (orgInfo.records?.length > 0) {
        orgName = orgInfo.records?.[0]?.Name || 'Unknown Org';
      } else {
        orgName = 'Unknown Org';
      }

      console.log(`✅ Salesforce connection verified: ${instanceUrl}`);
    } catch (sfError) {
      logError(sfError, req, 'addOrg-salesforce');
      return res.status(401).json({
        success: false,
        error: 'Invalid Salesforce credentials. Please check and try again.',
      });
    }

    console.log('🔐 Encrypting credentials with AES-256...');

    let encryptedPassword: string;
    let encryptedToken: string;
    try {
      encryptedPassword = encrypt(orgPassword);
      encryptedToken = encrypt(securityToken);
      console.log('✅ Credentials encrypted successfully');
    } catch (encryptError) {
      logError(encryptError, req, 'addOrg-encryption');
      return res.status(500).json({
        success: false,
        error: 'Failed to encrypt credentials. Please try again.',
      });
    }

    const { error: insertError } = await supabase.from('organizations').insert([
      {
        user_id: user.id,
        org_email: orgEmail,
        org_name: orgName,
        encrypted_org_password: encryptedPassword,
        encrypted_security_token: encryptedToken,
        is_sandbox: isSandbox,
        instance_url: instanceUrl,
      },
    ]);

    if (insertError) {
      console.error('Insert error:', insertError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to save organization in database',
      });
    }

    console.log('✅ Organization added with encrypted credentials');

    return res.status(201).json({
      success: true,
      message: 'Organization connected and verified successfully',
      instanceUrl: instanceUrl || undefined,
    });
  } catch (err) {
    return handleApiError(err, req, res, 'addOrg');
  }
}

export default jsforceRateLimiter(handler);
