import type { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';
import { jsforceRateLimiter } from '@lib/rateLimiter';

interface FieldAnalysisResponse {
  success: boolean;
  data?: Record<string, string | number | null>;
  message?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<FieldAnalysisResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { accessToken, instanceUrl, objectName, type } = req.body;

  if (!accessToken || !instanceUrl || !objectName || !type) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const conn = new jsforce.Connection({ instanceUrl, accessToken });

    let queryResult: Record<string, string | number | null>;

    switch (type) {
      case 'sample':
        queryResult = await getSampleValues(conn, objectName);
        break;
      case 'fieldCount':
        queryResult = await getFieldCount(conn, objectName);
        break;
      case 'nullCount':
        queryResult = await getNullCount(conn, objectName);
        break;
      case 'percentPresent':
        queryResult = await getPercentPresent(conn, objectName);
        break;
      case 'distinctCount':
        queryResult = await getDistinctCount(conn, objectName);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    return res.status(200).json({ success: true, data: queryResult });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
}

async function getNullCount(conn: jsforce.Connection, objectName: string): Promise<Record<string, string | number>> {
  const describe = await conn.sobject(objectName).describe();
  const counts: Record<string, string | number> = {};

  for (const f of describe.fields) {
    if (f.name === 'Id') continue;
    try {
      const result = await conn.query<{ c: number }>(`SELECT COUNT(Id) c FROM ${objectName} WHERE ${f.name} = null`);
      counts[f.name] = result.records?.[0]?.c || 0;
    } catch {
      counts[f.name] = 'N/A';
    }
  }

  return counts;
}

async function getFieldCount(conn: jsforce.Connection, objectName: string): Promise<Record<string, string | number>> {
  const describe = await conn.sobject(objectName).describe();
  const counts: Record<string, string | number> = {};

  for (const f of describe.fields) {
    if (f.name === 'Id') continue;
    try {
      const result = await conn.query<{ c: number }>(`SELECT COUNT(Id) c FROM ${objectName} WHERE ${f.name} != null`);
      counts[f.name] = result.records?.[0]?.c || 0;
    } catch {
      counts[f.name] = 'N/A';
    }
  }

  return counts;
}

async function getPercentPresent(conn: jsforce.Connection, objectName: string): Promise<Record<string, string>> {
  const describe = await conn.sobject(objectName).describe();
  const totalRes = await conn.query<{ total: number }>(`SELECT COUNT(Id) total FROM ${objectName}`);
  const total = totalRes.records[0].total;
  const completeness: Record<string, string> = {};

  for (const f of describe.fields) {
    if (f.name === 'Id') continue;
    try {
      const result = await conn.query<{ c: number }>(`SELECT COUNT(Id) c FROM ${objectName} WHERE ${f.name} != null`);
      const filled = result.records?.[0]?.c || 0;
      completeness[f.name] = ((filled / total) * 100).toFixed(2) + '%';
    } catch {
      completeness[f.name] = 'N/A';
    }
  }

  return completeness;
}

async function getDistinctCount(conn: jsforce.Connection, objectName: string): Promise<Record<string, string | number>> {
  const describe = await conn.sobject(objectName).describe();
  const distinctCounts: Record<string, string | number> = {};

  for (const f of describe.fields) {
    if (f.name === 'Id') continue;
    try {
      const result = await conn.query<{ d: number }>(`SELECT COUNT_DISTINCT(${f.name}) d FROM ${objectName}`);
      distinctCounts[f.name] = result.records?.[0]?.d || 0;
    } catch {
      distinctCounts[f.name] = 'N/A';
    }
  }

  return distinctCounts;
}

async function getSampleValues(conn: jsforce.Connection, objectName: string): Promise<Record<string, string | null>> {
  try {
    const desc = await conn.sobject(objectName).describe();
    const allFields = desc.fields.map((f) => f.name);

    if (allFields.length === 0) return {};

    const chunk = <T>(arr: T[], size: number): T[][] => {
      const chunks: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    const fieldChunks = chunk(allFields, 200);
    const sampleValues: Record<string, string | null> = {};

    for (const fields of fieldChunks) {
      try {
        const result = await conn.query<Record<string, unknown>>(`SELECT ${fields.join(', ')} FROM ${objectName} LIMIT 1`);
        const record = result.records?.[0] || {};

        for (const f of fields) {
          let val = record[f];
          if (val === null || val === undefined) val = null;
          if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
          sampleValues[f] = val as string | null;
        }
      } catch (err) {
        console.warn(`⚠️ Could not query some fields for ${objectName}: ${(err as Error).message}`);
        for (const f of fields) sampleValues[f] = null;
      }
    }

    for (const f of Object.keys(sampleValues)) {
      if (sampleValues[f] === null) {
        try {
          const result = await conn.query<Record<string, unknown>>(`SELECT ${f} FROM ${objectName} WHERE ${f} != NULL LIMIT 1`);
          if (result.records && result.records.length > 0) {
            const val = result.records[0][f];
            sampleValues[f] = val === null || val === undefined ? 'N/A' : String(val);
          } else {
            sampleValues[f] = 'N/A';
          }
        } catch {
          sampleValues[f] = 'N/A';
        }
      }
    }

    for (const f of allFields) {
      if (!(f in sampleValues)) sampleValues[f] = 'N/A';
    }

    return sampleValues;
  } catch (error) {
    console.error(`❌ Error fetching sample values for ${objectName}:`, error);
    return {};
  }
}

export default jsforceRateLimiter(handler);
