import { createClient } from "@supabase/supabase-js";
import jsforce from "jsforce";
import { decrypt } from "../../lib/encryption";
import { getAuthToken } from "../../lib/cookieAuth";
import { jsforceRateLimiter } from "../../lib/rateLimiter";

async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const token = getAuthToken(req);
        if (!token)
            return res.status(401).json({ success: false, error: "Missing authentication token" });

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

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

        // Fetch organization linked to user
        const { data: orgs, error: orgError } = await supabase
            .from("organizations")
            .select("id, org_email, instance_url, is_sandbox, encrypted_org_password, encrypted_security_token")
            .eq("user_id", profile.id);

        if (orgError)
            console.error("Organization fetch error:", orgError.message);

        const organizationsWithUsage = await Promise.all(
            (orgs || []).map(async (org) => {
                let apiUsage = null;
                try {
                    if (org.org_email && org.encrypted_org_password && org.encrypted_security_token) {
                        // Decrypt credentials
                        const orgPassword = decrypt(org.encrypted_org_password);
                        const securityToken = decrypt(org.encrypted_security_token);
                        
                        const conn = new jsforce.Connection({
                            loginUrl: org.is_sandbox
                                ? "https://test.salesforce.com"
                                : "https://login.salesforce.com",
                        });
                        await conn.login(org.org_email, orgPassword + securityToken);
                        apiUsage = await conn.request('/services/data/v47.0/limits');
                        apiUsage = {
                            limit: apiUsage.DailyApiRequests.Max,
                            used: apiUsage.DailyApiRequests.Remaining
                        };

                    }
                } catch (err) {
                    console.error(`Failed to fetch API usage for org ${org.org_email}:`, err.message);
                }
                // Return org data without sensitive credentials
                return {
                    id: org.id,
                    org_email: org.org_email,
                    instance_url: org.instance_url,
                    is_sandbox: org.is_sandbox,
                    apiUsage: apiUsage,
                };
            })
        );

        res.status(200).json({
            success: true,
            user: profile,
            organization: organizationsWithUsage,
        });
    } catch (err) {
        console.error("Profile API error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
}

export default jsforceRateLimiter(handler);
