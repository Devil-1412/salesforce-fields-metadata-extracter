import type { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';
import { jsforceRateLimiter } from '@lib/rateLimiter';

interface RecordCountResponse {
  success: boolean;
  count?: number;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<RecordCountResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { instanceUrl, accessToken, objectName } = req.body;

  const conn = new jsforce.Connection({ instanceUrl, accessToken });

  try {
    const result = await conn.query(`SELECT COUNT() FROM ${objectName}`);
    const count = result.totalSize;
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(401).json({ success: false, error: (error as Error).message });
  }
}

export default jsforceRateLimiter(handler);
