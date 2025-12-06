import { createClient } from "@supabase/supabase-js";
import { setAuthCookie } from "../../lib/cookieAuth";

// Helper function to extract IP address from request
function getClientIp(req) {
    // Check for forwarded IP (common in production with proxies/load balancers)
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    
    // Check for real IP header
    const realIp = req.headers["x-real-ip"];
    if (realIp) {
        return realIp;
    }
    
    // Fallback to socket remote address
    return req.socket?.remoteAddress || "unknown";
}

// Helper function to extract device info from user agent
function getDeviceInfo(userAgent) {
    if (!userAgent) return "Unknown Device";
    
    // Simple device detection
    if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
        if (userAgent.includes("Android")) return "Android Mobile";
        if (userAgent.includes("iPhone")) return "iPhone";
        return "Mobile Device";
    }
    
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("Macintosh")) return "Mac";
    if (userAgent.includes("Windows")) return "Windows PC";
    if (userAgent.includes("Linux")) return "Linux";
    
    return "Desktop";
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing Supabase credentials in environment variables.");
        return res.status(500).json({ success: false, error: "Server misconfiguration." });
    }

    // Create Supabase server-side client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });

    try {
        // Sign in the user using Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
        });

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        if (!data?.session) {
            return res.status(401).json({
                success: false,
                error: "Authentication failed. Please verify your email first.",
            });
        }

        // Extract request metadata for session tracking
        const ipAddress = getClientIp(req);
        const userAgent = req.headers["user-agent"] || "unknown";
        const deviceInfo = getDeviceInfo(userAgent);

        // Save session to active_sessions table
        try {
            const { error: sessionError } = await supabase
                .from("active_sessions")
                .insert({
                    user_id: data.user.id,
                    session_token: data.session.access_token,
                    device_info: deviceInfo,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    last_activity: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                });

            if (sessionError) {
                console.error("Error saving session:", sessionError);
                // Don't fail login if session save fails, just log the error
            }
        } catch (sessionErr) {
            console.error("Unexpected error saving session:", sessionErr);
            // Continue with login even if session tracking fails
        }

        // Check if user has any organizations
        const { count, error: orgError } = await supabase
            .from("organizations")
            .select("*", { count: "exact", head: true })
            .eq("user_id", data.user.id);

        if (orgError) {
            console.error("Error checking organizations:", orgError);
        }

        // Set httpOnly cookie
        setAuthCookie(res, data.session.access_token);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                id: data.user?.id,
                email: data.user?.email,
            },
            // Token removed from response body for security
            hasOrganization: count > 0,
        });
    } catch (err) {
        console.error("Unexpected login error:", err);
        return res.status(500).json({ success: false, error: "Unexpected server error." });
    }
}
