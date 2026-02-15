import { validateContentType } from '@lib/contentTypeValidator';
import { getAuthToken, setSalesforceTokenCookie } from '@lib/cookieAuth';
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
    let accessToken: string | undefined;

    try {
      const conn = new jsforce.Connection({ loginUrl });
      await conn.login(orgEmail, orgPassword + securityToken);
      instanceUrl = conn.instanceUrl;
      accessToken = conn.accessToken;

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

    // Insert into connections parent table
    const { data: newConnection, error: connectionError } = await supabase
      .from('connections')
      .insert({
        user_id: user.id,
        connection_type: 'salesforce',
        display_name: orgName || 'Salesforce Org',
      })
      .select('id')
      .single();

    if (connectionError || !newConnection) {
      console.error('Connection insert error:', connectionError?.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to save connection in database',
      });
    }

    // Insert Salesforce-specific details into child table
    const { error: detailsError } = await supabase.from('salesforce_connection_details').insert({
      connection_id: newConnection.id,
      org_email: orgEmail,
      org_name: orgName,
      encrypted_org_password: encryptedPassword,
      encrypted_security_token: encryptedToken,
      is_sandbox: isSandbox,
      instance_url: instanceUrl,
    });

    if (detailsError) {
      console.error('Details insert error:', detailsError.message);
      // Clean up the parent connection if details fail
      await supabase.from('connections').delete().eq('id', newConnection.id);
      return res.status(500).json({
        success: false,
        error: 'Failed to save organization details in database',
      });
    }

    // Set the token cookie immediately for better UX
    if (accessToken) {
      setSalesforceTokenCookie(res, accessToken, newConnection.id);
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
