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

export default async function handler(req: NextApiRequest, res: NextApiResponse<MetadataObjectsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { accessToken, instanceUrl } = req.body;

    if (!accessToken || !instanceUrl) {
      return res.status(400).json({ success: false, error: 'Missing accessToken or instanceUrl' });
    }

    const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch objects from Salesforce');
    }

    const data = await response.json();

    const objects: ObjectInfo[] = data.sobjects
      .filter((obj: { queryable: boolean }) => obj.queryable)
      .map((obj: { name: string; label: string; labelPlural: string }) => ({
        name: obj.name,
        label: obj.label,
        labelPlural: obj.labelPlural,
      }))
      .sort((a: ObjectInfo, b: ObjectInfo) => a.name.localeCompare(b.name));

    res.status(200).json({ success: true, data: objects });
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to fetch objects',
    });
  }
}
