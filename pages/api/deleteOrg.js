import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { email, orgId } = req.body;

        if (!email || !orgId) {
            return res.status(400).json({ 
                success: false, 
                error: "Missing required fields: email and orgId" 
            });
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Verify the organization belongs to the user
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("id, user_id")
            .eq("id", orgId)
            .single();

        if (orgError || !org) {
            return res.status(404).json({ 
                success: false, 
                error: "Organization not found" 
            });
        }

        if (org.user_id !== profile.id) {
            return res.status(403).json({ 
                success: false, 
                error: "You don't have permission to delete this organization" 
            });
        }

        // Delete the organization
        const { error: deleteError } = await supabase
            .from("organizations")
            .delete()
            .eq("id", orgId)
            .eq("user_id", profile.id);

        if (deleteError) {
            console.error("Delete organization error:", deleteError.message);
            return res.status(500).json({ 
                success: false, 
                error: "Failed to delete organization" 
            });
        }

        return res.status(200).json({
            success: true,
            message: "Organization deleted successfully",
        });
    } catch (err) {
        console.error("DeleteOrg API error:", err);
        return res.status(500).json({ success: false, error: "Server error" });
    }
}

