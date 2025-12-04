import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "Missing or invalid authorization token" });
    }

    const token = authHeader.split(" ")[1];

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing Supabase credentials in environment variables.");
        return res.status(500).json({ success: false, error: "Server misconfiguration." });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });

    try {
        // Get user from token
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ success: false, error: "Invalid token" });
        }

        // Delete the session from active_sessions table
        const { error: deleteError } = await supabase
            .from("active_sessions")
            .delete()
            .eq("session_token", token);

        if (deleteError) {
            console.error("Error deleting session:", deleteError);
            // Don't fail logout even if session deletion fails
        }

        // Sign out from Supabase Auth
        const { error: signOutError } = await supabase.auth.admin.signOut(token);

        if (signOutError) {
            console.error("Error signing out:", signOutError);
        }

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (err) {
        console.error("Unexpected logout error:", err);
        return res.status(500).json({ success: false, error: "Unexpected server error." });
    }
}
