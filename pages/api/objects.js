import jsforce from "jsforce";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accessToken, instanceUrl } = req.body;

  try {
    const conn = new jsforce.Connection({ accessToken, instanceUrl });
    const describe = await conn.describeGlobal();
    const objectsWithCount = await Promise.all(
      describe.sobjects.map(async (obj) => {
        try {
          const result = await conn.query(`SELECT COUNT() FROM ${obj.name}`);
          const count = result.totalSize || 0;

          return {
            name: obj.name,
            label: obj.label,
            keyPrefix: obj.keyPrefix,
            recordCount: count, 
          };
        } catch (e) {
          return {
            name: obj.name,
            label: obj.label,
            keyPrefix: obj.keyPrefix,
            recordCount: "N/A",
          };
        }
      })
    );
    res.status(200).json({ success: true, objectsWithCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
