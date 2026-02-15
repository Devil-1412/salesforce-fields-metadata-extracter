import { getAuthToken } from '@lib/cookieAuth';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 1. Verify Authentication via Cookie
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
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    // 2. Validate Body
    const { filename, fileType } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, error: 'Filename is required' });
    }

    // 3. Generate a unique path: user_id/timestamp_uuid.ext
    const ext = filename.split('.').pop();
    const uniqueName = `${uuidv4()}.${ext}`;
    const filePath = `${user.id}/${uniqueName}`;

    // 4. Create Signed Upload URL
    // This allows the client to upload to this specific path without being fully logged in via Supabase JS
    const { data, error } = await supabase.storage.from('reports').createSignedUploadUrl(filePath);

    if (error) {
      throw error;
    }

    // 5. Get Public URL
    const { data: publicData } = supabase.storage.from('reports').getPublicUrl(filePath);

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token, // Some SDK versions need this, or the signedUrl contains it
      fullPath: filePath,
      publicUrl: publicData.publicUrl,
    });
  } catch (error: any) {
    console.error('Upload URL generation error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate upload URL' });
  }
}
