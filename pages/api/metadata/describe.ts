import type { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';
import { jsforceRateLimiter } from '@lib/rateLimiter';

interface FieldInfo {
  name: string;
  label: string;
  type: string;
  sortable: boolean;
  filterable: boolean;
}

interface ObjectInfo {
  name: string;
  label: string;
  labelPlural: string;
  keyPrefix: string | null;
}

interface DescribeResponse {
  success: boolean;
  data?: { name: string; label: string; fields: FieldInfo[] } | ObjectInfo[];
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<DescribeResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken, instanceUrl, objectName } = req.body;

  if (!accessToken || !instanceUrl) {
    return res.status(400).json({ success: false, error: 'Missing accessToken or instanceUrl' });
  }

  const conn = new jsforce.Connection({ accessToken, instanceUrl });

  try {
    if (objectName) {
      const metadata = await conn.describe(objectName);
      const fields = metadata.fields.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        sortable: f.sortable,
        filterable: f.filterable,
      }));

      return res.status(200).json({
        success: true,
        data: {
          name: metadata.name,
          label: metadata.label,
          fields,
        },
      });
    } else {
      const metadata = await conn.describeGlobal();
      const objects = metadata.sobjects
        .filter((obj) => obj.queryable)
        .map((obj) => ({
          name: obj.name,
          label: obj.label,
          labelPlural: obj.labelPlural,
          keyPrefix: obj.keyPrefix,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return res.status(200).json({ success: true, data: objects });
    }
  } catch (error) {
    console.error('Describe error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to fetch metadata',
    });
  }
}

export default jsforceRateLimiter(handler);
