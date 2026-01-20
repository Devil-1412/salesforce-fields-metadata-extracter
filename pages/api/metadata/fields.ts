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

export default async function handler(req: NextApiRequest, res: NextApiResponse<MetadataFieldsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { accessToken, instanceUrl, objectName } = req.body;

    if (!accessToken || !instanceUrl || !objectName) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/${objectName}/describe`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch fields for ${objectName}`);
    }

    const data = await response.json();

    const fields: FieldData[] = data.fields
      .map((field: { name: string; label: string; type: string; referenceTo?: string[] }) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        referenceTo: field.referenceTo || [],
      }))
      .sort((a: FieldData, b: FieldData) => a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      data: { objectName: data.name, fields },
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to fetch fields',
    });
  }
}
