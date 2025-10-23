import jsforce from "jsforce";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password, token, isSandbox } = req.body;

  try {
    const loginUrl = isSandbox ? "https://test.salesforce.com" : "https://login.salesforce.com";
    const conn = new jsforce.Connection({ loginUrl });

    await conn.login(username, password + (token || ""));
    res.status(200).json({
      success: true,
      accessToken: conn.accessToken,
      instanceUrl: conn.instanceUrl,
    });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
}
