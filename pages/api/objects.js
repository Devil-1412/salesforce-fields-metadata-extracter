import jsforce from "jsforce";
import { jsforceRateLimiter } from "@lib/rateLimiter";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accessToken, instanceUrl } = req.body;

  try {
    const conn = new jsforce.Connection({ accessToken, instanceUrl });
    const describe = await conn.describeGlobal();

    // Fetch metadata for CustomObjects (includes standard objects that are customizable)
    let metadataList = [];
    try {
      metadataList = await conn.metadata.list([{ type: 'CustomObject', folder: null }], '60.0');
      if (metadataList && !Array.isArray(metadataList)) {
        metadataList = [metadataList];
      }
    } catch (err) {
      console.error("Error fetching metadata list:", err);
    }

    const metadataMap = {};
    if (metadataList) {
      metadataList.forEach((m) => {
        if (m && m.fullName) {
          metadataMap[m.fullName] = m;
        }
      });
    }

    const object = describe.sobjects.map((obj) => {
      const meta = metadataMap[obj.name];
      return {
        name: obj.name,
        label: obj.label,
        keyPrefix: obj.keyPrefix,
        custom: obj.custom,
        createdById: meta?.createdById || null,
        createdByName: meta?.createdByName || null,
        createdDate: meta?.createdDate || null,
        lastModifiedById: meta?.lastModifiedById || null,
        lastModifiedByName: meta?.lastModifiedByName || null,
        lastModifiedDate: meta?.lastModifiedDate || null,
      };
    });

    res.status(200).json({ success: true, object });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export default jsforceRateLimiter(handler);
