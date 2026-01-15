import jsforce from "jsforce";
import { jsforceRateLimiter } from "@lib/rateLimiter";
import { soqlQuerySchema } from "@lib/validation/schemas";
import { validateRequestBody } from "@lib/validation/middleware";
import { handleApiError, logError } from "@lib/errorHandler";
import { validateContentType } from "@lib/contentTypeValidator";

async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Validate Content-Type
    if (!validateContentType(req, res)) {
        return;
    }

    // Validate request body - prevents SOQL injection and oversized queries
    const validated = validateRequestBody(soqlQuerySchema, req, res);
    if (!validated) {
        return;
    }

    const { accessToken, instanceUrl, query } = validated;

    try {
        const conn = new jsforce.Connection({ accessToken, instanceUrl });
        const result = await conn.query(query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        return handleApiError(error, req, res, 'soql');
    }
}

export default jsforceRateLimiter(handler);
