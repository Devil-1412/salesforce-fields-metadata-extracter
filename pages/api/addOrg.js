import { createClient } from "@supabase/supabase-js";
import jsforce from "jsforce";
import { encrypt } from "../../lib/encryption";
import { jsforceRateLimiter } from "../../lib/rateLimiter";
import { getAuthToken } from "../../lib/cookieAuth";

async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { orgEmail, orgPassword, securityToken, isSandbox } = req.body;

        if (!orgEmail || !orgPassword || !securityToken) {
            return res
                .status(400)
                .json({ success: false, error: "Missing required fields" });
        }

        // Initialize Supabase client with service role (needed for Vault)
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const token = getAuthToken(req);
        if (!token) {
            return res.status(401).json({ success: false, error: "Missing authentication token" });
        }

        // Verify user token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ success: false, error: "Invalid token" });
        }

        // Fetch user profile
        const { data: profile, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

        if (userError || !profile)
            return res.status(404).json({ success: false, error: "User not found" });

        // Determine correct Salesforce login URL
        const loginUrl = isSandbox
            ? "https://test.salesforce.com"
            : "https://login.salesforce.com";

        // Attempt to connect to Salesforce to verify credentials
        let instanceUrl = null;
        let orgName = null;
        try {
            const conn = new jsforce.Connection({ loginUrl });
            await conn.login(orgEmail, orgPassword + securityToken);
            instanceUrl = conn.instanceUrl;
            
            // Get org details
            const identity = await conn.identity();
            orgName = identity.organization_id; // You can get actual org name if needed
            
            console.log(`✅ Salesforce connection verified: ${instanceUrl}`);
        } catch (sfError) {
            console.error("❌ Salesforce login failed:", sfError.message);
            return res.status(401).json({
                success: false,
                error: "Invalid Salesforce credentials. Please check and try again.",
            });
        }

        // 🔐 ENCRYPT CREDENTIALS using AES-256
        console.log('🔐 Encrypting credentials with AES-256...');
        
        let encryptedPassword, encryptedToken;
        try {
            encryptedPassword = encrypt(orgPassword);
            encryptedToken = encrypt(securityToken);
            console.log('✅ Credentials encrypted successfully');
        } catch (encryptError) {
            console.error('❌ Encryption failed:', encryptError);
            return res.status(500).json({
                success: false,
                error: "Failed to encrypt credentials. Please try again.",
            });
        }

        // Insert org with encrypted credentials
        const { error: insertError } = await supabase.from("organizations").insert([
            {
                user_id: profile.id,
                org_email: orgEmail,
                encrypted_org_password: encryptedPassword, // ✅ AES-256 Encrypted
                encrypted_security_token: encryptedToken,   // ✅ AES-256 Encrypted
                is_sandbox: isSandbox,
                instance_url: instanceUrl,
            },
        ]);

        if (insertError) {
            console.error("Insert error:", insertError.message);
            return res.status(500).json({
                success: false,
                error: "Failed to save organization in database",
            });
        }

        console.log('✅ Organization added with encrypted credentials');

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

export default jsforceRateLimiter(handler);
