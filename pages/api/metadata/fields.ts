import { AuthStore } from '@lib/AuthStore';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import type { NextApiRequest, NextApiResponse } from 'next';

interface FieldData {
  name: string;
  label: string;
  type: string;
  referenceTo: string[];
}

interface MetadataFieldsResponse {
  success: boolean;
  data?: { objectName: string; fields: FieldData[] };
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<MetadataFieldsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { accessToken, instanceUrl, objectName } = req.body;

    if (!instanceUrl || !objectName) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    const store = new AuthStore(req, res, instanceUrl);
    const conn = await store.getConnection();

    const describe = await conn.sobject(objectName).describe();

    const fields: FieldData[] = describe.fields
      .map((field) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        referenceTo: field.referenceTo || [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      data: { objectName: describe.name, fields },
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to fetch fields',
    });
  }
}

export default jsforceRateLimiter(handler);
