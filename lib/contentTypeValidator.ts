/**
 * Content-Type validation middleware
 */

import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

/**
 * Validate that request has correct Content-Type header
 */
export function validateContentType(req: NextApiRequest, res: NextApiResponse): boolean {
  const methodsRequiringContentType = ['POST', 'PUT', 'PATCH'];

  if (!methodsRequiringContentType.includes(req.method || '')) {
    return true;
  }

  const contentType = req.headers['content-type'];

  if (!contentType) {
    res.status(400).json({
      success: false,
      error: 'Missing Content-Type header',
    });
    return false;
  }

  if (!contentType.toLowerCase().includes('application/json')) {
    res.status(415).json({
      success: false,
      error: 'Content-Type must be application/json',
    });
    return false;
  }

  return true;
}

/**
 * Higher-order function to wrap API routes with Content-Type validation
 */
export function withContentType(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!validateContentType(req, res)) {
      return;
    }

    return handler(req, res);
  };
}
