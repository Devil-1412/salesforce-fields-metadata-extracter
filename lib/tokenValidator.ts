import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { getAuthToken } from './cookieAuth';

interface RequestWithCookies extends NextApiRequest {
  cookies: { [key: string]: string };
}

interface ValidationResult {
  valid: boolean;
  user?: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
  error?: string;
}

interface RequestWithUser extends RequestWithCookies {
  user?: ValidationResult['user'];
}

/**
 * Token validation middleware for API routes
 */
export async function validateToken(req: RequestWithCookies): Promise<ValidationResult> {
  try {
    const token = getAuthToken(req);

    if (!token) {
      return {
        valid: false,
        error: 'Missing authentication token',
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase credentials in environment variables.');
      return {
        valid: false,
        error: 'Server misconfiguration',
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        valid: false,
        error: authError?.message || 'Invalid or expired token',
      };
    }

    return {
      valid: true,
      user: {
        ...user,
        id: user.id,
        email: user.email,
      },
    };
  } catch (err) {
    console.error('Token validation error:', err);
    return {
      valid: false,
      error: 'Token validation failed',
    };
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth(handler: (req: RequestWithUser, res: NextApiResponse) => Promise<void> | void): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const validation = await validateToken(req as RequestWithCookies);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: validation.error,
      });
    }

    // Attach user to request object
    (req as RequestWithUser).user = validation.user;

    return handler(req as RequestWithUser, res);
  };
}
