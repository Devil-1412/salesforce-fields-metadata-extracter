import { encrypt } from '@lib/encryption';
import { getServiceRoleClient } from '@lib/supabaseClient';
import jsforce from 'jsforce';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  if (error) {
    console.error('Salesforce OAuth error:', error);
    return res.redirect('/profile?error=Salesforce%20login%20failed');
  }

  if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
    return res.redirect('/profile?error=Invalid%20request');
  }

  try {
    const { userId, isSandbox } = JSON.parse(state);
    const loginUrl = isSandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com';

    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`;

    const oauth2 = new jsforce.OAuth2({
      clientId,
      clientSecret,
      redirectUri,
      loginUrl,
    });

    const conn = new jsforce.Connection({ oauth2 });

    // Exchange code for tokens
    await conn.authorize(code);

    const accessToken = conn.accessToken;
    const refreshToken = conn.refreshToken;
    const instanceUrl = conn.instanceUrl;

    if (!refreshToken) {
      console.warn('No refresh token received from Salesforce');
      // This happens if the user already authorized the app and we didn't ask for approval again.
      // We might need to handle this by prompting (prompt=login or consent) in login.ts if needed.
    }

    // Get Org Info
    const identity = await conn.identity();
    const orgId = identity.organization_id;
    // We can query Organization object for Name if needed, or use identity display name?
    // Let's allow default to 'Salesforce Org' if name fetch fails, or query it.
    let orgName = 'Salesforce Org';
    try {
      const orgInfo = await conn.query<{ Name: string }>('SELECT Name FROM Organization LIMIT 1');
      if (orgInfo.records?.[0]) {
        orgName = orgInfo.records[0].Name;
      }
    } catch (e) {
      console.warn('Could not fetch Org Name', e);
    }

    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;
    // We can optionally store encrypted access token too if we want, but refresh is key.

    const supabase = getServiceRoleClient();

    // Check if org already exists for this user (by org_id or instance_url?)
    // Existing logic used instance_url mostly. Let's stick to that or just insert.
    // Ideally we should verify uniqueness or upsert.

    const { data: newConnection, error: connectionError } = await supabase
      .from('connections')
      .insert({
        user_id: userId,
        connection_type: 'salesforce',
        display_name: orgName,
      })
      .select('id')
      .single();

    if (connectionError || !newConnection) {
      console.error('DB Connection Insert Error:', connectionError);
      return res.redirect('/profile?error=Failed%20to%20save%20connection');
    }

    const { error: detailsError } = await supabase.from('salesforce_connection_details').insert({
      connection_id: newConnection.id,
      org_name: orgName,
      org_email: identity.username,
      instance_url: instanceUrl,
      is_sandbox: isSandbox,
      refresh_token: encryptedRefreshToken,
    });

    if (detailsError) {
      console.error('DB Details Insert Error:', detailsError);
      return res.redirect('/profile?error=Failed%20to%20save%20organization');
    }

    // Success redirect
    // We could check if they came from onboarding vs profile, but profile is safe default.
    res.redirect('/profile?success=Organization%20connected');
  } catch (err: any) {
    console.error('Salesforce Callback Exception:', err);
    res.redirect(`/profile?error=${encodeURIComponent(err.message || 'Unknown error')}`);
  }
}
