import { createClient } from "@supabase/supabase-js";
import { getAuthToken } from "./cookieAuth";

/**
 * Token validation middleware for API routes
 * Validates JWT token and returns user information
 * 
 * @param {object} req - Next.js request object
 * @returns {Promise<{valid: boolean, user?: object, error?: string}>}
 */
export async function validateToken(req) {
    try {
        const token = getAuthToken(req);

        if (!token) {
            return {
                valid: false,
                error: "Missing authentication token"
            };
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Supabase credentials in environment variables.");
            return {
                valid: false,
                error: "Server misconfiguration"
            };
        }

        const supabase = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } }
        );

        // Validate token with Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return {
                valid: false,
                error: authError?.message || "Invalid or expired token"
            };
        }

        return {
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                ...user
            }
        };
    } catch (err) {
        console.error("Token validation error:", err);
        return {
            valid: false,
            error: "Token validation failed"
        };
    }
}

/**
 * Middleware wrapper for API routes that require authentication
 * Usage: export default withAuth(handler)
 * 
 * @param {Function} handler - API route handler
 * @returns {Function} - Wrapped handler with auth validation
 */
export function withAuth(handler) {
    return async (req, res) => {
        const validation = await validateToken(req);

        if (!validation.valid) {
            return res.status(401).json({
                success: false,
                error: validation.error
            });
        }

        // Attach user to request object for use in handler
        req.user = validation.user;

        return handler(req, res);
    };
}
