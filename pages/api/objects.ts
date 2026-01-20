import type { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';
import { jsforceRateLimiter } from '@lib/rateLimiter';

interface SObject {
  name: string;
  label: string;
  keyPrefix: string | null;
  custom: boolean;
  createdById: string | null;
  createdByName: string | null;
  createdDate: string | null;
  lastModifiedById: string | null;
  lastModifiedByName: string | null;
  lastModifiedDate: string | null;
}

interface ObjectsResponse {
  success: boolean;
  object?: SObject[];
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ObjectsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken, instanceUrl } = req.body;

  try {
    const conn = new jsforce.Connection({ accessToken, instanceUrl });
    const describe = await conn.describeGlobal();

    let metadataList: jsforce.FileProperties[] | jsforce.FileProperties = [];
    try {
      metadataList = await conn.metadata.list([{ type: 'CustomObject', folder: undefined }], '60.0');
      if (metadataList && !Array.isArray(metadataList)) {
        metadataList = [metadataList];
      }
    } catch (err) {
      console.error('Error fetching metadata list:', err);
    }

    const metadataMap: Record<string, jsforce.FileProperties> = {};
    if (metadataList && Array.isArray(metadataList)) {
      metadataList.forEach((m) => {
        if (m && m.fullName) {
          metadataMap[m.fullName] = m;
        }
      });
    }

    const object = describe.sobjects.map((obj) => {
      const meta = metadataMap[obj.name];
      return {
        name: obj.name,
        label: obj.label,
        keyPrefix: obj.keyPrefix,
        custom: obj.custom,
        createdById: (meta as any)?.createdById || null,
        createdByName: (meta as any)?.createdByName || null,
        createdDate: (meta as any)?.createdDate || null,
        lastModifiedById: (meta as any)?.lastModifiedById || null,
        lastModifiedByName: (meta as any)?.lastModifiedByName || null,
        lastModifiedDate: (meta as any)?.lastModifiedDate || null,
      };
    });

    res.status(200).json({ success: true, object });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}

export default jsforceRateLimiter(handler);
