import { getServiceRoleClient } from "@lib/supabaseClient";
import jsforce from "jsforce";
import { encrypt } from "@lib/encryption";
import { jsforceRateLimiter } from "@lib/rateLimiter";
import { getAuthToken } from "@lib/cookieAuth";
import { addOrgSchema } from "@lib/validation/schemas";
import { validateRequestBody } from "@lib/validation/middleware";
import { handleApiError, logError, sanitizeError } from "@lib/errorHandler";
import { validateContentType } from "@lib/contentTypeValidator";

async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    // Validate Content-Type
    if (!validateContentType(req, res)) {
        return;
    }

    try {
        // Validate request body
        const validated = validateRequestBody(addOrgSchema, req, res);
        if (!validated) {
            return;
        }

        const { orgEmail, orgPassword, securityToken, isSandbox } = validated;

        // Initialize Supabase client with service role (needed for Vault)
        const supabase = getServiceRoleClient();

        const token = getAuthToken(req);
        if (!token) {
            return res.status(401).json({ success: false, error: "Missing authentication token" });
        }

        // Verify user token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ success: false, error: "Invalid token" });
        }

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
            
            // Get org Name
            const orgInfo = await conn.query("SELECT Name FROM Organization LIMIT 1");
            if (orgInfo.records?.length > 0) {
                orgName = orgInfo.records[0].Name;
            } else {
                orgName = "Unknown Org";
            }
            
            console.log(`✅ Salesforce connection verified: ${instanceUrl}`);
        } catch (sfError) {
            logError(sfError, req, 'addOrg-salesforce');
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
            logError(encryptError, req, 'addOrg-encryption');
            return res.status(500).json({
                success: false,
                error: "Failed to encrypt credentials. Please try again.",
            });
        }

        // Insert org with encrypted credentials
        const { error: insertError } = await supabase.from("organizations").insert([
            {
                user_id: user.id,
                org_email: orgEmail,
                org_name: orgName,
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
        return handleApiError(err, req, res, 'addOrg');
    }
}

export default jsforceRateLimiter(handler);
