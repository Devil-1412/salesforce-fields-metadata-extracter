import jsforce from "jsforce";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accessToken, instanceUrl } = req.body;

  try {
    const conn = new jsforce.Connection({ accessToken, instanceUrl });
    const describe = await conn.describeGlobal();
    const object = describe.sobjects.map((obj) => ({
        name: obj.name,
        label: obj.label,
        keyPrefix: obj.keyPrefix,
    }));

    res.status(200).json({ success: true, object });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
