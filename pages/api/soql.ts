import type { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import { soqlQuerySchema } from '@lib/validation/schemas';
import { validateRequestBody } from '@lib/validation/middleware';
import { handleApiError } from '@lib/errorHandler';
import { validateContentType } from '@lib/contentTypeValidator';

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
    const conn = new jsforce.Connection({ accessToken, instanceUrl });
    const result = await conn.query(query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, req, res, 'soql');
  }
}

export default jsforceRateLimiter(handler);
