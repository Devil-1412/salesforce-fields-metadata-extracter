import jsforce from "jsforce";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { org1, org2 } = req.body;

    // Connect to both orgs
    const conn1 = new jsforce.Connection({ instanceUrl: org1.instanceUrl, accessToken: org1.accessToken });
    const conn2 = new jsforce.Connection({ instanceUrl: org2.instanceUrl, accessToken: org2.accessToken });

    // Describe global (list of objects)
    const [meta1, meta2] = await Promise.all([
      conn1.describeGlobal(),
      conn2.describeGlobal(),
    ]);

    // Get object maps
    const org1Objects = meta1.sobjects.map(o => ({
      name: o.name,
      label: o.label,
      keyPrefix: o.keyPrefix || "—",
      custom: o.custom
    }));
    const org2Objects = meta2.sobjects.map(o => ({
      name: o.name,
      label: o.label,
      keyPrefix: o.keyPrefix || "—",
      custom: o.custom
    }));

    // Combine results
    const allObjectNames = new Set([
      ...org1Objects.map(o => o.name),
      ...org2Objects.map(o => o.name)
    ]);

    const comparison = Array.from(allObjectNames).map(name => {
      const obj1 = org1Objects.find(o => o.name === name);
      const obj2 = org2Objects.find(o => o.name === name);
      return {
        keyPrefix: obj1?.keyPrefix || obj2?.keyPrefix || "—",
        objectName: name,
        org1Present: !!obj1,
        org2Present: !!obj2
      };
    });

    res.status(200).json({
      comparison
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
