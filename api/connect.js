import jsforce from "jsforce";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password, token, isSandbox } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const loginUrl = isSandbox ? "https://test.salesforce.com" : "https://login.salesforce.com";
    const conn = new jsforce.Connection({ loginUrl });

    await conn.login(username, password + (token || ""));
    return res.status(200).json({ success: true, message: "Login successful!" });
  } catch (err) {
    return res.status(401).json({ success: false, error: err.message });
  }
}
