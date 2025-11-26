import jsforce from "jsforce";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { accessToken, instanceUrl, query } = req.body;

    if (!accessToken || !instanceUrl || !query) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        const conn = new jsforce.Connection({ accessToken, instanceUrl });
        const result = await conn.query(query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("SOQL Query Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}
