import { AuthStore } from '@lib/AuthStore';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import type { NextApiRequest, NextApiResponse } from 'next';

interface FieldComparison {
  fieldName: string;
  type1: string | null;
  type2: string | null;
  length1: number | null;
  length2: number | null;
  required1: boolean;
  required2: boolean;
  diff: boolean;
}

interface ObjectComparison {
  objectName: string;
  fields: FieldComparison[];
}

interface CompareFieldsResponse {
  success: boolean;
  data?: ObjectComparison[];
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<CompareFieldsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { selectedObjects, org1, org2 } = req.body;

  try {
    // Use AuthStore to get robust connections
    const store1 = new AuthStore(req, res, org1.instanceUrl);
    const store2 = new AuthStore(req, res, org2.instanceUrl);

    // Fetch connections in parallel (auto-refreshing if needed)
    const [conn1, conn2] = await Promise.all([store1.getConnection(), store2.getConnection()]);

    const data: ObjectComparison[] = [];

    for (const obj of selectedObjects) {
      const [desc1, desc2] = await Promise.allSettled([
        conn1.sobject(obj).describe(),
        conn2.sobject(obj).describe(),
      ]);

      const fields1: Record<string, { type: string; length: number; required: boolean }> =
        desc1.status === 'fulfilled'
          ? desc1.value.fields.reduce(
              (acc, f) => {
                acc[f.name] = {
                  type: f.type,
                  length: f.length,
                  required: !f.nillable,
                };
                return acc;
              },
              {} as Record<string, { type: string; length: number; required: boolean }>
            )
          : {};

      const fields2: Record<string, { type: string; length: number; required: boolean }> =
        desc2.status === 'fulfilled'
          ? desc2.value.fields.reduce(
              (acc, f) => {
                acc[f.name] = {
                  type: f.type,
                  length: f.length,
                  required: !f.nillable,
                };
                return acc;
              },
              {} as Record<string, { type: string; length: number; required: boolean }>
            )
          : {};

      const allFields = new Set([...Object.keys(fields1), ...Object.keys(fields2)]);

      const fields = Array.from(allFields).map((name) => {
        const f1 = fields1[name] || { type: null, length: null, required: false };
        const f2 = fields2[name] || { type: null, length: null, required: false };
        const diff = f1.type !== f2.type || f1.length !== f2.length || f1.required !== f2.required;

        return {
          fieldName: name,
          type1: f1.type ?? null,
          type2: f2.type ?? null,
          length1: f1.length ?? null,
          length2: f2.length ?? null,
          required1: f1.required ?? false,
          required2: f2.required ?? false,
          diff,
        };
      });

      data.push({ objectName: obj, fields });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Error comparing fields:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

export default jsforceRateLimiter(handler);
