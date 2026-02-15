import { AuthStore } from '@lib/AuthStore';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ObjectInfo {
  name: string;
  label: string;
  labelPlural: string;
}

interface MetadataObjectsResponse {
  success: boolean;
  data?: ObjectInfo[];
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<MetadataObjectsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { accessToken, instanceUrl } = req.body;

    if (!instanceUrl) {
      return res.status(400).json({ success: false, error: 'Missing instanceUrl' });
    }

    const store = new AuthStore(req, res, instanceUrl);
    const conn = await store.getConnection();
    const describe = await conn.describeGlobal();

    const objects: ObjectInfo[] = describe.sobjects
      .filter((obj) => obj.queryable)
      .map((obj) => ({
        name: obj.name,
        label: obj.label,
        labelPlural: obj.labelPlural,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ success: true, data: objects });
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to fetch objects',
    });
  }
}

export default jsforceRateLimiter(handler);
