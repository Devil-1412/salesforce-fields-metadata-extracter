import { getAuthToken } from '@lib/cookieAuth';
import { getServiceRoleClient } from '@lib/supabaseClient';
import jsforce from 'jsforce';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getServiceRoleClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const isSandbox = req.query.isSandbox === 'true';
    const loginUrl = isSandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com';

    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Salesforce OAuth credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const oauth2 = new jsforce.OAuth2({
      clientId,
      clientSecret,
      redirectUri,
      loginUrl,
    });

    // Pass user ID and sandbox flag in state for the callback
    const state = JSON.stringify({ userId: user.id, isSandbox });

    // Request refresh_token scope
    const authUrl = oauth2.getAuthorizationUrl({
      scope: 'api refresh_token web',
      state,
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('Salesforce auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
