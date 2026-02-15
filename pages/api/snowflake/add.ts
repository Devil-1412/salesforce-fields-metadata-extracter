import { getAuthToken } from '@lib/cookieAuth';
import { encrypt } from '@lib/encryption';
import { handleApiError } from '@lib/errorHandler';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';
import snowflake from 'snowflake-sdk';
import { z } from 'zod';

const addSnowflakeSchema = z.object({
  account: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  warehouse: z.string().optional(),
  database: z.string().optional(),
  schema: z.string().optional(),
  role: z.string().optional(),
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

    const body = addSnowflakeSchema.parse(req.body);

    console.log(`❄️ Verifying Snowflake connection for ${body.username} @ ${body.account}...`);

    // Verify connection
    const connection = snowflake.createConnection({
      account: body.account,
      username: body.username,
      password: body.password,
      warehouse: body.warehouse,
      database: body.database,
      schema: body.schema,
      role: body.role,
    });

    await new Promise<void>((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          console.error('Snowflake connection failed:', err.message);
          reject(new Error(`Connection failed: ${err.message}`));
        } else {
          console.log('✅ Snowflake connected successfully');
          resolve();
        }
      });
    });

    // Encrypt password
    const encryptedPassword = encrypt(body.password);

    // Insert into connections parent table
    const { data: newConnection, error: connectionError } = await supabase
      .from('connections')
      .insert({
        user_id: user.id,
        connection_type: 'snowflake',
        display_name: body.account + ' (' + body.username + ')',
      })
      .select('id')
      .single();

    if (connectionError || !newConnection) {
      console.error('Connection insert error:', connectionError);
      throw new Error('Failed to save connection');
    }

    // Insert Snowflake-specific details into child table
    const { error: detailsError } = await supabase.from('snowflake_connection_details').insert({
      connection_id: newConnection.id,
      account_identifier: body.account,
      username: body.username,
      encrypted_password: encryptedPassword,
      warehouse: body.warehouse,
      database: body.database,
      schema: body.schema,
      role: body.role,
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
    return handleApiError(err, req, res, 'snowflake-add');
  }
}
