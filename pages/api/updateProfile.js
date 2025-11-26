import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { email, full_name } = req.body;

        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, error: "Missing authentication token" });
        }

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
            .select("id, email")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Prepare update data
        const updateData = {};
        if (full_name !== undefined) {
            updateData.full_name = full_name;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, error: "No fields to update" });
        }

        // Update profile
        const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", profile.id)
            .select()
            .single();

        if (updateError) {
            console.error("Update profile error:", updateError.message);
            return res.status(500).json({ success: false, error: "Failed to update profile" });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedProfile,
        });
    } catch (err) {
        console.error("UpdateProfile API error:", err);
        return res.status(500).json({ success: false, error: "Server error" });
    }
}

