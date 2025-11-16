import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    if (req.method !== "POST")
        return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { email, action, preferences } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: "Missing email" });
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

        if (action === "update") {
            // Validate preferences
            if (!preferences) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Missing preferences data" 
                });
            }

            // Validate theme
            if (preferences.theme && !["light", "dark"].includes(preferences.theme)) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Invalid theme. Must be 'light' or 'dark'" 
                });
            }

            // Validate language
            const validLanguages = ["en", "es", "fr", "de"];
            if (preferences.language && !validLanguages.includes(preferences.language)) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Invalid language. Must be one of: ${validLanguages.join(", ")}` 
                });
            }

            // Prepare update data
            const updateData = {
                user_id: profile.id,
                updated_at: new Date().toISOString(),
            };

            if (preferences.theme !== undefined) {
                updateData.theme = preferences.theme;
            }
            if (preferences.notifications !== undefined) {
                updateData.notifications = preferences.notifications;
            }
            if (preferences.emailUpdates !== undefined) {
                updateData.email_updates = preferences.emailUpdates;
            }
            if (preferences.language !== undefined) {
                updateData.language = preferences.language;
            }

            // Upsert preferences
            const { data: updatedPrefs, error: updateError } = await supabase
                .from("user_preferences")
                .upsert(updateData, {
                    onConflict: "user_id",
                })
                .select()
                .single();

            if (updateError) {
                console.error("Update preferences error:", updateError.message);
                return res.status(500).json({ 
                    success: false, 
                    error: "Failed to update preferences" 
                });
            }

            return res.status(200).json({
                success: true,
                message: "Preferences updated successfully",
                preferences: {
                    theme: updatedPrefs.theme,
                    notifications: updatedPrefs.notifications,
                    emailUpdates: updatedPrefs.email_updates,
                    language: updatedPrefs.language,
                },
            });
        } else if (action === "get") {
            // Get current preferences
            const { data: userPrefs, error: getError } = await supabase
                .from("user_preferences")
                .select("*")
                .eq("user_id", profile.id)
                .single();

            if (getError && getError.code !== "PGRST116") {
                console.error("Get preferences error:", getError.message);
                return res.status(500).json({ 
                    success: false, 
                    error: "Failed to fetch preferences" 
                });
            }

            // Return defaults if no preferences exist
            const defaultPrefs = {
                theme: "light",
                notifications: true,
                emailUpdates: true,
                language: "en",
            };

            return res.status(200).json({
                success: true,
                preferences: userPrefs ? {
                    theme: userPrefs.theme || defaultPrefs.theme,
                    notifications: userPrefs.notifications ?? defaultPrefs.notifications,
                    emailUpdates: userPrefs.email_updates ?? defaultPrefs.emailUpdates,
                    language: userPrefs.language || defaultPrefs.language,
                } : defaultPrefs,
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: `Unknown action: ${action}. Use 'update' or 'get'` 
            });
        }
    } catch (err) {
        console.error("UserPreferences API error:", err);
        return res.status(500).json({ success: false, error: "Server error" });
    }
}

