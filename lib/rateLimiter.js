import { createClient } from "@supabase/supabase-js";
import { getAuthToken } from "./cookieAuth";

/**
 * In-memory rate limiter using sliding window algorithm
 * Tracks JSForce API calls per user to prevent abuse
 */

// Rate limit configuration
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 100; // 100 requests per window

// In-memory store for rate limit data
// Structure: { userId: { requests: [timestamps], lastCleanup: timestamp } }
const rateLimitStore = new Map();

// Cleanup interval to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let cleanupInterval = null;

/**
 * Initialize cleanup interval to remove expired records
 */
function initCleanup() {
    if (!cleanupInterval) {
        cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [userId, data] of rateLimitStore.entries()) {
                // Remove entries older than the window
                const validRequests = data.requests.filter(
                    timestamp => now - timestamp < DEFAULT_WINDOW_MS
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
 * @param {string} userId - The user ID to check
 * @param {object} options - Configuration options
 * @returns {object} - { allowed: boolean, retryAfter: number }
 */
export function checkRateLimit(userId, options = {}) {
    const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
    const maxRequests = options.maxRequests || DEFAULT_MAX_REQUESTS;
    const now = Date.now();

    // Initialize cleanup on first use
    initCleanup();

    // Get or create user's rate limit data
    if (!rateLimitStore.has(userId)) {
        rateLimitStore.set(userId, {
            requests: [],
            lastCleanup: now
        });
    }

    const userData = rateLimitStore.get(userId);

    // Remove expired requests from the sliding window
    userData.requests = userData.requests.filter(
        timestamp => now - timestamp < windowMs
    );

    // Check if limit exceeded
    if (userData.requests.length >= maxRequests) {
        // Calculate when the oldest request will expire
        const oldestRequest = userData.requests[0];
        const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
        
        return {
            allowed: false,
            retryAfter: retryAfter > 0 ? retryAfter : 1,
            remaining: 0,
            limit: maxRequests
        };
    }

    // Add current request timestamp
    userData.requests.push(now);

    return {
        allowed: true,
        retryAfter: 0,
        remaining: maxRequests - userData.requests.length,
        limit: maxRequests
    };
}

/**
 * Extract user ID from Supabase auth token (cookie or header)
 * @param {object} req - Request object
 * @returns {Promise<string|null>} - User ID or null if invalid
 */
async function getUserIdFromRequest(req) {
    const token = getAuthToken(req);

    if (!token) {
        return null;
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: { user }, error } = await supabase.auth.getUser(token);

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
 * @param {function} handler - The original API route handler
 * @param {object} options - Rate limit configuration options
 * @returns {function} - Wrapped handler with rate limiting
 */
export function jsforceRateLimiter(handler, options = {}) {
    return async (req, res) => {
        try {
            // Extract user ID
            const userId = await getUserIdFromRequest(req);

            if (!userId) {
                return res.status(401).json({ 
                    error: 'Unauthorized - Invalid or missing authentication token' 
                });
            }

            // Check rate limit
            const rateLimitResult = checkRateLimit(userId, options);

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', rateLimitResult.limit);
            res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);

            if (!rateLimitResult.allowed) {
                res.setHeader('Retry-After', rateLimitResult.retryAfter);
                return res.status(429).json({
                    error: 'Too many requests. Please try again later.',
                    retryAfter: rateLimitResult.retryAfter
                });
            }

            // Call the original handler
            return await handler(req, res);
        } catch (error) {
            console.error('Rate limiter error:', error);
            // On error, allow the request to proceed (fail open)
            return await handler(req, res);
        }
    };
}

/**
 * Reset rate limit for a specific user (useful for testing)
 * @param {string} userId - The user ID to reset
 */
export function resetRateLimit(userId) {
    rateLimitStore.delete(userId);
}

/**
 * Get current rate limit status for a user
 * @param {string} userId - The user ID to check
 * @returns {object} - Current rate limit status
 */
export function getRateLimitStatus(userId) {
    const userData = rateLimitStore.get(userId);
    
    if (!userData) {
        return {
            requestCount: 0,
            limit: DEFAULT_MAX_REQUESTS,
            remaining: DEFAULT_MAX_REQUESTS
        };
    }

    const now = Date.now();
    const validRequests = userData.requests.filter(
        timestamp => now - timestamp < DEFAULT_WINDOW_MS
    );

    return {
        requestCount: validRequests.length,
        limit: DEFAULT_MAX_REQUESTS,
        remaining: DEFAULT_MAX_REQUESTS - validRequests.length
    };
}
