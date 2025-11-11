import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { email, orgEmail, orgPassword, securityToken, isSandbox } = req.body;
        if (!email || !orgEmail || !orgPassword || !securityToken)
            return res.status(400).json({ success: false, error: "Missing fields" });

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Find the user by email
        const { data: profile, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (userError || !profile)
            return res.status(404).json({ success: false, error: "User not found" });


        // Insert org info
        const { error: insertError } = await supabase.from("organizations").insert([
            {
                user_id: profile.id,
                org_email: orgEmail,
                org_password: orgPassword,
                security_token: securityToken,
                is_sandbox: isSandbox
            },
        ]);

        if (insertError) {
            console.error("Insert error:", insertError.message);
            return res
                .status(500)
                .json({ success: false, error: "Failed to save organization" });
        }

        res
            .status(201)
            .json({ success: true, message: "Organization added successfully" });
    } catch (err) {
        console.error("AddOrg API error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
}
