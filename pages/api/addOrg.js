import { createClient } from "@supabase/supabase-js";
import jsforce from "jsforce";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { email, orgEmail, orgPassword, securityToken, isSandbox } = req.body;

        if (!email || !orgEmail || !orgPassword || !securityToken) {
            return res
                .status(400)
                .json({ success: false, error: "Missing required fields" });
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch user profile
        const { data: profile, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (userError || !profile)
            return res.status(404).json({ success: false, error: "User not found" });

        // Determine correct Salesforce login URL
        const loginUrl = isSandbox
            ? "https://test.salesforce.com"
            : "https://login.salesforce.com";

        // Attempt to connect to Salesforce to verify credentials
        let instanceUrl = null;
        try {
            const conn = new jsforce.Connection({ loginUrl });
            await conn.login(orgEmail, orgPassword + securityToken);
            instanceUrl = conn.instanceUrl; // Get instance URL if successful
            console.log(`✅ Salesforce connection verified: ${instanceUrl}`);
        } catch (sfError) {
            console.error("❌ Salesforce login failed:", sfError.message);
            return res.status(401).json({
                success: false,
                error: "Invalid Salesforce credentials. Please check and try again.",
            });
        }

        // Insert verified org into Supabase
        const { error: insertError } = await supabase.from("organizations").insert([
            {
                user_id: profile.id,
                org_email: orgEmail,
                org_password: orgPassword, // ⚠️ Consider encrypting later
                security_token: securityToken,
                is_sandbox: isSandbox,
                instance_url: instanceUrl, // ✅ Save verified instance
            },
        ]);

        if (insertError) {
            console.error("Insert error:", insertError.message);
            return res.status(500).json({
                success: false,
                error: "Failed to save organization in database",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Organization connected and verified successfully",
            instanceUrl,
        });
    } catch (err) {
        console.error("AddOrg API error:", err);
        return res.status(500).json({ success: false, error: "Server error" });
    }
}
