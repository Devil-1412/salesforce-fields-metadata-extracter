import { getAuthToken } from '@lib/cookieAuth';
import { encrypt } from '@lib/encryption';
import { handleApiError } from '@lib/errorHandler';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const addIICSSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  podRegion: z.string().min(1),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const supabase = getServiceRoleClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const body = addIICSSchema.parse(req.body);

    console.log(`🔗 Verifying IICS connection for ${body.username} @ ${body.podRegion}...`);

    // Verify connection by attempting login
    const loginUrl = `https://${body.podRegion}.informaticacloud.com/saas/public/core/v3/login`;
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: body.username,
        password: body.password,
      }),
    });

    if (!loginRes.ok) {
      const errorBody = await loginRes.text();
      console.error('IICS login verification failed:', errorBody);
      return res.status(400).json({
        success: false,
        error: `IICS connection failed: ${loginRes.status} — verify your credentials and pod region`,
      });
    }

    const loginData = await loginRes.json();
    if (!loginData?.userInfo?.sessionId) {
      return res.status(400).json({
        success: false,
        error: 'IICS login did not return a valid session — check credentials',
      });
    }

    console.log('✅ IICS connected successfully');

    // Encrypt password
    const encryptedPassword = encrypt(body.password);

    // Insert into connections parent table
    const { data: newConnection, error: connectionError } = await supabase
      .from('connections')
      .insert({
        user_id: user.id,
        connection_type: 'iics',
        display_name: body.podRegion + ' (' + body.username + ')',
      })
      .select('id')
      .single();

    if (connectionError || !newConnection) {
      console.error('Connection insert error:', connectionError);
      throw new Error('Failed to save connection');
    }

    // Insert IICS-specific details into child table
    const { error: detailsError } = await supabase.from('iics_connection_details').insert({
      connection_id: newConnection.id,
      username: body.username,
      encrypted_password: encryptedPassword,
      pod_region: body.podRegion,
    });

    if (detailsError) {
      // Clean up parent connection if details fail
      await supabase.from('connections').delete().eq('id', newConnection.id);
      throw detailsError;
    }

    return res.status(200).json({ success: true, message: 'Connected successfully' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err });
    }
    return handleApiError(err, req, res, 'iics-add');
  }
}
