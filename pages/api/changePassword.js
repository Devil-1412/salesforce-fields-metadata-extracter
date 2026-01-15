import { getServiceRoleClient } from "@lib/supabaseClient";
import { getAuthToken } from "@lib/cookieAuth";
import { changePasswordSchema } from "@lib/validation/schemas";
import { validateRequestBody } from "@lib/validation/middleware";
import { validateContentType } from "@lib/contentTypeValidator";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    // Validate Content-Type
    if (!validateContentType(req, res)) {
        return;
    }

    try {
        // Validate request body
        const validated = validateRequestBody(changePasswordSchema, req, res);
        if (!validated) {
            return;
        }

        const { currentPassword, newPassword } = validated;

        const token = getAuthToken(req);
        if (!token) {
            return res.status(401).json({ success: false, error: "Missing or invalid authorization token" });
        }

        // Create Supabase client with anon key for auth operations
        const supabase = getServiceRoleClient();

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
