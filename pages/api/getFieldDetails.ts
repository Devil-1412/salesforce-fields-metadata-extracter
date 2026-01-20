import type { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';
import { jsforceRateLimiter } from '@lib/rateLimiter';

interface FieldDetailsResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<FieldDetailsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken, instanceUrl, objectName, fieldName } = req.body;

  if (!accessToken || !instanceUrl || !objectName || !fieldName) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }

  try {
    const conn = new jsforce.Connection({ accessToken, instanceUrl });

    const query = `
SELECT
  Id,
  DeveloperName,
  QualifiedApiName,
  Label,
  Description,
  CreatedDate,
  CreatedBy.Name,
  LastModifiedDate,
  LastModifiedBy.Name,
  SecurityClassification,
  ComplianceGroup
FROM FieldDefinition
WHERE EntityDefinition.QualifiedApiName = '${objectName}'
AND DeveloperName = '${fieldName}'
    `;

    const result = await conn.tooling.query(query);

    if (result.records && result.records.length > 0) {
      res.status(200).json({ success: true, data: result.records[0] });
    } else {
      res.status(404).json({ success: false, error: 'Field definition not found' });
    }
  } catch (err) {
    console.error('Error fetching field details:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

export default jsforceRateLimiter(handler);
