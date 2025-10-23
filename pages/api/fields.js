import jsforce from "jsforce";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accessToken, instanceUrl, objects } = req.body;

  try {
    const conn = new jsforce.Connection({ accessToken, instanceUrl });
    const result = {};

    for (let obj of objects) {
      const desc = await conn.sobject(obj).describe();
      result[obj] = desc.fields.map(f => ({
        name: f.name,
        label: f.label,
        type: f.type,
        length: f.length,
        required: !f.nillable,
        picklistValues: f.picklistValues?.map(p => p.value) || [],
      }));
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
