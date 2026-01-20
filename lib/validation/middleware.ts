/**
 * Validation middleware for Next.js API routes
 */

import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import type { ZodSchema } from 'zod';
import { formatZodErrors } from './schemas';

interface RequestWithValidatedBody<T> extends NextApiRequest {
  validatedBody: T;
}

/**
 * Validate request body against a Zod schema
 */
export function validateRequestBody<T>(
  schema: ZodSchema<T>,
  req: NextApiRequest,
  res: NextApiResponse
): T | null {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: formatZodErrors(result.error),
    });
    return null;
  }

  return result.data;
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  schema: ZodSchema<T>,
  req: NextApiRequest,
  res: NextApiResponse
): T | null {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: formatZodErrors(result.error),
    });
    return null;
  }

  return result.data;
}

/**
 * Higher-order function to wrap API route with validation
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: RequestWithValidatedBody<T>, res: NextApiResponse) => Promise<void> | void
): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const validatedData = validateRequestBody(schema, req, res);

    if (!validatedData) {
      return;
    }

    (req as RequestWithValidatedBody<T>).validatedBody = validatedData;

    return handler(req as RequestWithValidatedBody<T>, res);
  };
}
