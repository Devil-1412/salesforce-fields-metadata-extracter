import jsforce from "jsforce";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Missing email" });
    }

    // 🔹 Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 🔹 Fetch the user's organizations
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id, org_email, org_password, security_token, is_sandbox")
      .eq("user_id", profile.id);

    if (orgError) {
      console.error("Supabase fetch error:", orgError);
      return res.status(500).json({ success: false, error: "Error fetching orgs" });
    }

    if (!orgs || orgs.length === 0) {
      return res.status(200).json({ success: false, error: "No org present" });
    }

    // 🔹 Login to all orgs concurrently and fetch org details
    const results = await Promise.all(
      orgs.map(async (org) => {
        const loginUrl = org.is_sandbox
          ? "https://test.salesforce.com"
          : "https://login.salesforce.com";

        const conn = new jsforce.Connection({ loginUrl });

        try {
          // 🔑 Login using org credentials
          await conn.login(
            org.org_email,
            org.org_password + (org.security_token || "")
          );

          // 🔹 Fetch organization info (org name, id, etc.)
          let orgName = "Unknown Org";
          try {
            const orgInfo = await conn.query("SELECT Name FROM Organization LIMIT 1");
            if (orgInfo.records?.length > 0) {
              orgName = orgInfo.records[0].Name;
            }
          } catch (orgErr) {
            console.warn(`⚠️ Could not fetch org name for ${org.org_email}:`, orgErr.message);
          }

          // ✅ Return only minimal info
          return {
            accessToken: conn.accessToken,
            instanceUrl: conn.instanceUrl,
            orgName,
            success: true,
          };
        } catch (loginErr) {
          console.error(
            `❌ Login failed for ${org.org_email}: ${loginErr.message}`
          );
          return {
            success: false,
            error: loginErr.message || "Login failed",
          };
        }
      })
    );

    // ✅ Return access tokens and instance URLs for all orgs
    res.status(200).json({
      success: true,
      data: results.filter((r) => r.success), // only successful logins
      failed: results.filter((r) => !r.success), // optional
    });
  } catch (err) {
    console.error("Salesforce login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}
