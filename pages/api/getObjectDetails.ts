import { AuthStore } from '@lib/AuthStore';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import jsforce from 'jsforce';
import type { NextApiRequest, NextApiResponse } from 'next';

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

  if (!instanceUrl || !objectName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: instanceUrl, objectName',
    });
  }

  try {
    const store = new AuthStore(req, res, instanceUrl);
    const conn = await store.getConnection();
    const metadata = await conn.describe(objectName);
    res.status(200).json({ success: true, data: metadata });
  } catch (error) {
    console.error('Error fetching object details:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}

export default jsforceRateLimiter(handler);
