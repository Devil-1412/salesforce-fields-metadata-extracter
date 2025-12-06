import { createClient } from "@supabase/supabase-js";
import { getAuthToken } from "../../lib/cookieAuth";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: currentPassword, newPassword"
            });
        }

        const token = getAuthToken(req);
        if (!token) {
            return res.status(401).json({ success: false, error: "Missing or invalid authorization token" });
        }

        // Validate new password strength
        if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: "New password must be at least 8 characters and include letters and numbers",
            });
        }

        // Create Supabase client with anon key for auth operations
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                auth: { persistSession: false },
            }
        );

        // Verify user token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ success: false, error: "Invalid token" });
        }

        // First, verify current password by attempting to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError || !signInData?.user) {
            return res.status(401).json({
                success: false,
                error: "Current password is incorrect",
            });
        }

        // Update password using Supabase Auth Admin API
        const adminSupabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: { persistSession: false },
            }
        );

        const { data: updateData, error: updateError } = await adminSupabase.auth.admin.updateUserById(
            signInData.user.id,
            { password: newPassword }
        );

        if (updateError) {
            console.error("Password update error:", updateError.message);
            return res.status(500).json({
                success: false,
                error: "Failed to update password. Please try again.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (err) {
        console.error("ChangePassword API error:", err);
        return res.status(500).json({ success: false, error: "Server error" });
    }
}
