import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ success: false, error: "Missing email" });

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("email", email)
            .single();

        if (profileError || !profile)
            return res.status(404).json({ success: false, error: profileError.message });

        // Fetch organization linked to user
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("id, org_email, instance_url, is_sandbox")
            .eq("user_id", profile.id)

        if (orgError)
            console.error("Organization fetch error:", orgError.message);

        res.status(200).json({
            success: true,
            user: profile,
            organization: org || null,
        });
    } catch (err) {
        console.error("Profile API error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
}
