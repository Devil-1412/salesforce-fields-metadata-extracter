import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getAuthToken } from '@lib/cookieAuth';
import { saveQuerySchema } from '@lib/validation/schemas';
import { validateRequestBody } from '@lib/validation/middleware';
import { handleApiError } from '@lib/errorHandler';
import { validateContentType } from '@lib/contentTypeValidator';

interface SaveQueryResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SaveQueryResponse>) {
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

    const validated = validateRequestBody(saveQuerySchema, req, res);
    if (!validated) {
      return;
    }

    const { name, query } = validated;

    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { data, error } = await supabase
      .from('saved_queries')
      .insert([{ user_id: user.id, name, query }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    return handleApiError(error, req, res, 'queries-save');
  }
}
