import { getServiceRoleClient } from "@lib/supabaseClient";
import { getAuthToken } from "@lib/cookieAuth";
import { jsforceRateLimiter } from "@lib/rateLimiter";

async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const token = getAuthToken(req);
        if (!token)
            return res.status(401).json({ success: false, error: "Missing authentication token" });

        const supabase = getServiceRoleClient();

        // Verify user token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ success: false, error: "Invalid token" });
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email, plan")
            .eq("id", user.id)
            .single();

        if (profileError || !profile)
            return res.status(404).json({ success: false, error: profileError.message });

        res.status(200).json({
            success: true,
            user: profile,
        });
    } catch (err) {
        console.error("Profile API error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
}

export default jsforceRateLimiter(handler);
