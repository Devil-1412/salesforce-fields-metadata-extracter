import { createClient } from "@supabase/supabase-js";

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

        // If you want to set a secure HTTP-only cookie for the session:
        // (optional, only if you're managing server sessions manually)
        // res.setHeader("Set-Cookie", `sb:token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`);

        // Check if user has any organizations
        const { count, error: orgError } = await supabase
            .from("organizations")
            .select("*", { count: "exact", head: true })
            .eq("user_id", data.user.id);

        if (orgError) {
            console.error("Error checking organizations:", orgError);
        }

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                id: data.user?.id,
                email: data.user?.email,
            },
            session: data.session,
            hasOrganization: count > 0,
        });
    } catch (err) {
        console.error("Unexpected login error:", err);
        return res.status(500).json({ success: false, error: "Unexpected server error." });
    }
}
