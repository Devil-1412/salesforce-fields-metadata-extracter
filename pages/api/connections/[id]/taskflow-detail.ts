/**
 * GET /api/connections/[id]/taskflow-detail?taskflowId=<id>
 *
 * Returns the taskflow info and full mapping details for each mapping
 * referenced by the taskflow.
 * Uses V3 /objects/{id}/references and V2 /mapping/{id} for each.
 */

import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { IICSProvider } from '@lib/providers/IICSProvider';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const supabase = getServiceRoleClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) return res.status(401).json({ success: false, error: 'Invalid token' });

    const connectionId = req.query.id as string;
    const taskflowId = req.query.taskflowId as string;

    if (!taskflowId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query param: taskflowId',
      });
    }

    const provider = new IICSProvider();
    const data = await provider.getTaskflowMappings(connectionId, user.id, taskflowId);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(err, req, res, 'taskflow-detail');
  }
}
