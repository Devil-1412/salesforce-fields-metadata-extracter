/**
 * GET /api/connections/[id]/mct-references?mctId=<id>
 *
 * Returns child references for a Mapping Configuration Task (MCT).
 * Used for lazy L2 loading in the taskflow detail drilldown.
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
    const mctId = req.query.mctId as string;

    if (!mctId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query param: mctId',
      });
    }

    const provider = new IICSProvider();
    const data = await provider.getMctReferences(connectionId, user.id, mctId);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return handleApiError(err, req, res, 'mct-references');
  }
}
