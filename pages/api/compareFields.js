import jsforce from "jsforce";
import { jsforceRateLimiter } from "@lib/rateLimiter";

async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { selectedObjects, org1, org2 } = req.body;

  try {
    const conn1 = new jsforce.Connection({
      accessToken: org1.accessToken,
      instanceUrl: org1.instanceUrl,
    });
    const conn2 = new jsforce.Connection({
      accessToken: org2.accessToken,
      instanceUrl: org2.instanceUrl,
    });

    const data = [];

    for (const obj of selectedObjects) {
      const [desc1, desc2] = await Promise.allSettled([
        conn1.sobject(obj).describe(),
        conn2.sobject(obj).describe(),
      ]);

      const fields1 =
        desc1.status === "fulfilled"
          ? desc1.value.fields.reduce((acc, f) => {
              acc[f.name] = {
                type: f.type,
                length: f.length,
                required: !f.nillable,
              };
              return acc;
            }, {})
          : {};

      const fields2 =
        desc2.status === "fulfilled"
          ? desc2.value.fields.reduce((acc, f) => {
              acc[f.name] = {
                type: f.type,
                length: f.length,
                required: !f.nillable,
              };
              return acc;
            }, {})
          : {};

      const allFields = new Set([
        ...Object.keys(fields1),
        ...Object.keys(fields2),
      ]);

      const fields = Array.from(allFields).map((name) => {
        const f1 = fields1[name] || {};
        const f2 = fields2[name] || {};
        const diff =
          f1.type !== f2.type ||
          f1.length !== f2.length ||
          f1.required !== f2.required;

        return {
          fieldName: name,
          type1: f1.type ?? null,
          type2: f2.type ?? null,
          length1: f1.length ?? null,
          length2: f2.length ?? null,
          required1: f1.required ?? false,
          required2: f2.required ?? false,
          diff,
        };
      });

      data.push({ objectName: obj, fields });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Error comparing fields:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export default jsforceRateLimiter(handler);
