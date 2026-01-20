/**
 * Error handling utilities for API routes
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface ErrorDetails {
  timestamp: string;
  context: string;
  endpoint: string;
  method: string;
  message: string;
  stack: string;
  name: string;
}

/**
 * Log error details server-side
 */
export function logError(error: Error | unknown, req?: NextApiRequest, context = 'API'): void {
  const timestamp = new Date().toISOString();
  const err = error as Error;
  const errorDetails: ErrorDetails = {
    timestamp,
    context,
    endpoint: req?.url || 'unknown',
    method: req?.method || 'unknown',
    message: err?.message || 'Unknown error',
    stack: err?.stack || 'No stack trace',
    name: err?.name || 'Error',
  };

  console.error(`[${context} Error]`, errorDetails);
}

/**
 * Sanitize error for client response
 */
export function sanitizeError(error: Error | unknown): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const err = error as Error;

  if (isDevelopment) {
    return err?.message || 'An error occurred';
  }

  const errorMessage = err?.message?.toLowerCase() || '';

  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('token') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden')
  ) {
    return 'Authentication failed';
  }

  if (
    errorMessage.includes('database') ||
    errorMessage.includes('query') ||
    errorMessage.includes('supabase') ||
    errorMessage.includes('postgres')
  ) {
    return 'Database operation failed';
  }

  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return 'Service temporarily unavailable';
  }

  if (errorMessage.includes('salesforce') || errorMessage.includes('jsforce')) {
    return 'Salesforce operation failed';
  }

  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'Invalid request data';
  }

  return 'An unexpected error occurred';
}

interface ApiErrorResponse {
  success: false;
  error: string;
  _dev?: {
    originalError: string;
    stack: string;
  };
}

/**
 * Combined error handler for API routes
 */
export function handleApiError(
  error: Error | unknown,
  req: NextApiRequest,
  res: NextApiResponse<ApiErrorResponse>,
  context = 'API',
  statusCode = 500
): void {
  logError(error, req, context);

  const sanitizedMessage = sanitizeError(error);
  const err = error as Error;

  res.status(statusCode).json({
    success: false,
    error: sanitizedMessage,
    ...(process.env.NODE_ENV === 'development' && {
      _dev: {
        originalError: err?.message || '',
        stack: err?.stack || '',
      },
    }),
  });
}

/**
 * Check if error is safe to expose to client
 */
export function isSafeError(error: Error | unknown): boolean {
  const err = error as Error;
  const safeErrorTypes = ['ValidationError', 'ZodError', 'AuthenticationError', 'NotFoundError'];

  return safeErrorTypes.includes(err?.name);
}
