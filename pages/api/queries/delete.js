import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, error: "Missing authentication token" });
        }

        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, error: "Query ID is required" });
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

        // Delete query
        // RLS policy ensures user can only delete their own queries
        const { error } = await supabase
            .from("saved_queries")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id); // Extra safety check

        if (error) {
            throw error;
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Delete query error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to delete query" });
    }
}
