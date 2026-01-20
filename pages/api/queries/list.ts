import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getAuthToken } from '@lib/cookieAuth';

interface QueriesListResponse {
  success: boolean;
  queries?: unknown[];
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<QueriesListResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing authentication token' });
    }

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
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, queries: data });
  } catch (error) {
    console.error('List queries error:', error);
    res.status(500).json({ success: false, error: (error as Error).message || 'Failed to fetch queries' });
  }
}
