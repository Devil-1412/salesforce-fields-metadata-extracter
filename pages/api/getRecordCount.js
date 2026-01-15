import jsforce from "jsforce";
import { jsforceRateLimiter } from "@lib/rateLimiter";

async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { instanceUrl, accessToken, objectName } = req.body;

    const conn = new jsforce.Connection({ instanceUrl, accessToken });

    try {
        const result = await conn.query(`SELECT COUNT() FROM ${objectName}`);
        const count = result.totalSize;
        res.status(200).json({ success: true, count });
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
}

export default jsforceRateLimiter(handler);
