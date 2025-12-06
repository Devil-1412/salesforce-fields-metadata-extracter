import { createClient } from "@supabase/supabase-js";
import { getAuthToken } from "../../lib/cookieAuth";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { action, data } = req.body;

        if (!action) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: action"
            });
        }

        const token = getAuthToken(req);
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
            .select("id")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        let result;

        switch (action) {
            case "toggle2FA":
                // Upsert security settings for 2FA
                const { data: securityData, error: securityError } = await supabase
                    .from("security_settings")
                    .upsert(
                        {
                            user_id: profile.id,
                            two_factor_enabled: data?.enabled ?? false,
                            updated_at: new Date().toISOString(),
                        },
                        {
                            onConflict: "user_id",
                        }
                    )
                    .select()
                    .single();

                if (securityError) {
                    console.error("Security settings error:", securityError.message);
                    return res.status(500).json({
                        success: false,
                        error: "Failed to update 2FA settings"
                    });
                }

                result = { two_factor_enabled: securityData.two_factor_enabled };
                break;

            case "updatePrivacy":
                // Update privacy settings
                const privacyUpdate = {};
                if (data?.profileVisible !== undefined) {
                    privacyUpdate.profile_visible = data.profileVisible;
                }
                if (data?.dataSharing !== undefined) {
                    privacyUpdate.data_sharing = data.dataSharing;
                }

                const { data: privacyData, error: privacyError } = await supabase
                    .from("security_settings")
                    .upsert(
                        {
                            user_id: profile.id,
                            ...privacyUpdate,
                            updated_at: new Date().toISOString(),
                        },
                        {
                            onConflict: "user_id",
                        }
                    )
                    .select()
                    .single();

                if (privacyError) {
                    console.error("Privacy settings error:", privacyError.message);
                    return res.status(500).json({
                        success: false,
                        error: "Failed to update privacy settings"
                    });
                }

                result = {
                    profile_visible: privacyData.profile_visible,
                    data_sharing: privacyData.data_sharing,
                };
                break;

            case "getSessions":
                // Get active sessions for user
                const { data: sessions, error: sessionsError } = await supabase
                    .from("active_sessions")
                    .select("*")
                    .eq("user_id", profile.id)
                    .order("last_activity", { ascending: false });

                if (sessionsError) {
                    console.error("Get sessions error:", sessionsError.message);
                    return res.status(500).json({
                        success: false,
                        error: "Failed to fetch sessions"
                    });
                }

                result = { sessions: sessions || [] };
                break;

            case "revokeSession":
                // Revoke a specific session
                if (!data?.sessionId) {
                    return res.status(400).json({
                        success: false,
                        error: "Missing sessionId"
                    });
                }

                const { error: revokeError } = await supabase
                    .from("active_sessions")
                    .delete()
                    .eq("id", data.sessionId)
                    .eq("user_id", profile.id);

                if (revokeError) {
                    console.error("Revoke session error:", revokeError.message);
                    return res.status(500).json({
                        success: false,
                        error: "Failed to revoke session"
                    });
                }

                result = { message: "Session revoked successfully" };
                break;

            case "revokeAllSessions":
                // Revoke all sessions except current
                const { error: revokeAllError } = await supabase
                    .from("active_sessions")
                    .delete()
                    .eq("user_id", profile.id);

                if (revokeAllError) {
                    console.error("Revoke all sessions error:", revokeAllError.message);
                    return res.status(500).json({
                        success: false,
                        error: "Failed to revoke sessions"
                    });
                }

                result = { message: "All sessions revoked successfully" };
                break;

            case "getSecuritySettings":
                // Get all security settings
                const { data: settings, error: settingsError } = await supabase
                    .from("security_settings")
                    .select("*")
                    .eq("user_id", profile.id)
                    .single();

                if (settingsError && settingsError.code !== "PGRST116") {
                    console.error("Get security settings error:", settingsError.message);
                    return res.status(500).json({
                        success: false,
                        error: "Failed to fetch security settings"
                    });
                }

                result = {
                    two_factor_enabled: settings?.two_factor_enabled ?? false,
                    profile_visible: settings?.profile_visible ?? true,
                    data_sharing: settings?.data_sharing ?? false,
                };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown action: ${action}`
                });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        console.error("SecuritySettings API error:", err);
        return res.status(500).json({ success: false, error: "Server error" });
    }
}
