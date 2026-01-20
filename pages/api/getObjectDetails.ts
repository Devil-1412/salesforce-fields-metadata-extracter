import type { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';
import { jsforceRateLimiter } from '@lib/rateLimiter';

interface ObjectDetailsResponse {
  success: boolean;
  data?: jsforce.DescribeSObjectResult;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ObjectDetailsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken, instanceUrl, objectName } = req.body;

  if (!accessToken || !instanceUrl || !objectName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: accessToken, instanceUrl, objectName',
    });
  }

  const conn = new jsforce.Connection({
    accessToken,
    instanceUrl,
  });

  try {
    const metadata = await conn.describe(objectName);
    res.status(200).json({ success: true, data: metadata });
  } catch (error) {
    console.error('Error fetching object details:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}

export default jsforceRateLimiter(handler);
