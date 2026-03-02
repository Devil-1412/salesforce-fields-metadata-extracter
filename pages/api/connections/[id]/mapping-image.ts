/**
 * GET /api/connections/[id]/mapping-image?mappingId=<id>&deployed=false
 *
 * Proxy for fetching a mapping image from IICS.
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
    const mappingId = req.query.mappingId as string;
    const deployed = req.query.deployed === 'true';

    if (!mappingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query param: mappingId',
      });
    }

    const provider = new IICSProvider();
    const { buffer, contentType } = await provider.getMappingImage(
      connectionId,
      user.id,
      mappingId,
      deployed
    );

    // Set caching and content type headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    // Send binary buffer directly
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    // Return standard JSON error for failed fetches
    return handleApiError(err, req, res, 'mapping-image');
  }
}
