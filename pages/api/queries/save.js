import { createClient } from "@supabase/supabase-js";
import { getAuthToken } from "@lib/cookieAuth";
import { saveQuerySchema } from "@lib/validation/schemas";
import { validateRequestBody } from "@lib/validation/middleware";
import { handleApiError } from "@lib/errorHandler";
import { validateContentType } from "@lib/contentTypeValidator";

export default async function handler(req, res) {
    if (req.method != "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    // Validate Content-Type
    if (!validateContentType(req, res)) {
        return;
    }

    try {
        const token = getAuthToken(req);
        if (!token) {
            return res.status(401).json({ success: false, error: "Missing authentication token" });
        }

        // Validate request body
        const validated = validateRequestBody(saveQuerySchema, req, res);
        if (!validated) {
            return;
        }

        const { name, query } = validated;

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verify user token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ success: false, error: "Invalid token" });
        }

        // Insert query
        const { data, error } = await supabase
            .from("saved_queries")
            .insert([
                {
                    user_id: user.id,
                    name,
                    query
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(200).json({ success: true, data });

    } catch (error) {
        return handleApiError(error, req, res, 'queries-save');
    }
}
