import { createClient } from '@supabase/supabase-js';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { getAuthToken } from './cookieAuth';

/**
 * In-memory rate limiter using sliding window algorithm
 */

// Rate limit configuration
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 100;

interface RateLimitData {
  requests: number[];
  lastCleanup: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
  remaining: number;
  limit: number;
}

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

// In-memory store
const rateLimitStore = new Map<string, RateLimitData>();

// Cleanup interval
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupInterval: NodeJS.Timeout | null = null;

function initCleanup(): void {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [userId, data] of rateLimitStore.entries()) {
        const validRequests = data.requests.filter(
          (timestamp) => now - timestamp < DEFAULT_WINDOW_MS
        );

        if (validRequests.length === 0) {
          rateLimitStore.delete(userId);
        } else {
          data.requests = validRequests;
          data.lastCleanup = now;
        }
      }
    }, CLEANUP_INTERVAL_MS);
  }
}

/**
 * Check if a user has exceeded the rate limit
 */
export function checkRateLimit(userId: string, options: RateLimitOptions = {}): RateLimitResult {
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const maxRequests = options.maxRequests || DEFAULT_MAX_REQUESTS;
  const now = Date.now();

  initCleanup();

  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, {
      requests: [],
      lastCleanup: now,
    });
  }

  const userData = rateLimitStore.get(userId)!;
  userData.requests = userData.requests.filter((timestamp) => now - timestamp < windowMs);

  if (userData.requests.length >= maxRequests) {
    const oldestRequest = userData.requests[0];
    const retryAfter =
      oldestRequest != null ? Math.ceil((oldestRequest + windowMs - now) / 1000) : 1;

    return {
      allowed: false,
      retryAfter: retryAfter > 0 ? retryAfter : 1,
      remaining: 0,
      limit: maxRequests,
    };
  }

  userData.requests.push(now);

  return {
    allowed: true,
    retryAfter: 0,
    remaining: maxRequests - userData.requests.length,
    limit: maxRequests,
  };
}

async function getUserIdFromRequest(req: NextApiRequest): Promise<string | null> {
  const token = getAuthToken(req);

  if (!token) {
    return null;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
}

/**
 * Middleware wrapper for Next.js API routes to add rate limiting
 */
export function jsforceRateLimiter(
  handler: NextApiHandler,
  options: RateLimitOptions = {}
): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const userId = await getUserIdFromRequest(req);

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized - Invalid or missing authentication token',
        });
      }

      const rateLimitResult = checkRateLimit(userId, options);

      res.setHeader('X-RateLimit-Limit', rateLimitResult.limit.toString());
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

      if (!rateLimitResult.allowed) {
        res.setHeader('Retry-After', rateLimitResult.retryAfter.toString());
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      return await handler(req, res);
    } catch (error) {
      console.error('Rate limiter error:', error);
      return await handler(req, res);
    }
  };
}

/**
 * Reset rate limit for a specific user
 */
export function resetRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId: string): {
  requestCount: number;
  limit: number;
  remaining: number;
} {
  const userData = rateLimitStore.get(userId);

  if (!userData) {
    return {
      requestCount: 0,
      limit: DEFAULT_MAX_REQUESTS,
      remaining: DEFAULT_MAX_REQUESTS,
    };
  }

  const now = Date.now();
  const validRequests = userData.requests.filter(
    (timestamp) => now - timestamp < DEFAULT_WINDOW_MS
  );

  return {
    requestCount: validRequests.length,
    limit: DEFAULT_MAX_REQUESTS,
    remaining: DEFAULT_MAX_REQUESTS - validRequests.length,
  };
}
