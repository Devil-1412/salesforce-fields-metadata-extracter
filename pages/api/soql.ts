import { AuthStore } from '@lib/AuthStore';
import { validateContentType } from '@lib/contentTypeValidator';
import { handleApiError } from '@lib/errorHandler';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import { validateRequestBody } from '@lib/validation/middleware';
import { soqlQuerySchema } from '@lib/validation/schemas';
import jsforce from 'jsforce';
import type { NextApiRequest, NextApiResponse } from 'next';

interface SoqlResponse {
  success: boolean;
  data?: jsforce.QueryResult<unknown>;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<SoqlResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!validateContentType(req, res)) {
    return;
  }

  const validated = validateRequestBody(soqlQuerySchema, req, res);
  if (!validated) {
    return;
  }

  const { accessToken, instanceUrl, query } = validated;

  try {
    const store = new AuthStore(req, res, instanceUrl);
    const conn = await store.getConnection();
    const result = await conn.query(query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const err = error as Error & { errorCode?: string };
    // If it's a specific SOQL error (usually has an errorCode like MALFORMED_QUERY),
    // return the actual message so the user can fix their query.
    if (err.errorCode || err.name === 'SfError' || err.message?.includes('SOQL')) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Invalid SOQL query',
      });
    }
    return handleApiError(error, req, res, 'soql');
  }
}

export default jsforceRateLimiter(handler);
