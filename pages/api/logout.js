import { createClient } from "@supabase/supabase-js";
import { clearAuthCookie, getAuthToken } from "../../lib/cookieAuth";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const token = getAuthToken(req);

        if (!token) {
            return res.status(401).json({ success: false, error: "Missing authentication token" });
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Supabase credentials in environment variables.");
            return res.status(500).json({ success: false, error: "Server misconfiguration." });
        }

        // Create Supabase client
        const supabase = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } }
        );

        // Get user from token to verify it's a valid session
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            // If token is invalid or user not found, still clear the cookie
            clearAuthCookie(res);
            return res.status(401).json({ success: false, error: "Invalid token" });
        }

        // Remove session from active_sessions table
        // Note: We can't actually invalidate the JWT itself without a blacklist/expiry check
        // But we remove it from our tracking table and clear the cookie
        const { error } = await supabase
            .from("active_sessions")
            .delete()
            .eq("session_token", token);

        if (error) {
            console.error("Error removing session:", error);
            // Don't fail logout even if session deletion fails
        }

        // Sign out from Supabase Auth (admin context)
        const { error: signOutError } = await supabase.auth.admin.signOut(token);

        if (signOutError) {
            console.error("Error signing out from Supabase Auth:", signOutError);
        }

        // Clear the cookie
        clearAuthCookie(res);

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (err) {
        console.error("Unexpected logout error:", err);
        return res.status(500).json({ success: false, error: "Unexpected server error." });
    }
}
