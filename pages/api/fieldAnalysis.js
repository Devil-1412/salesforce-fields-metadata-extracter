import jsforce from "jsforce";
import { jsforceRateLimiter } from "../../lib/rateLimiter";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { accessToken, instanceUrl, objectName, type } = req.body;

  if (!accessToken || !instanceUrl || !objectName || !type) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const conn = new jsforce.Connection({ instanceUrl, accessToken });

    // Handle based on checkbox type
    let queryResult;

    switch (type) {
        case "sample":
            queryResult = await getSampleValues(conn, objectName);
            break;

        case "fieldCount":
            queryResult = await getFieldCount(conn, objectName);
            break;

        case "nullCount":
            queryResult = await getNullCount(conn, objectName);
            break;

        case "percentPresent":
            queryResult = await getPercentPresent(conn, objectName);
            break;

        case "distinctCount":
            queryResult = await getDistinctCount(conn, objectName);
            break;

        default:
            return res.status(400).json({ success: false, message: "Invalid type" });
    }

    return res.status(200).json({ success: true, data: queryResult });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ---- Helper Functions ----

async function getNullCount(conn, objectName) {
  const describe = await conn.sobject(objectName).describe();
  const counts = {};

  for (const f of describe.fields) {
    if (f.name === "Id") continue;
    try {
      const result = await conn.query(
        `SELECT COUNT(Id) c FROM ${objectName} WHERE ${f.name} = null`
      );
      counts[f.name] = result.records?.[0]?.c || 0;
    } catch {
      counts[f.name] = "N/A";
    }
  }

  return counts;
}

async function getFieldCount(conn, objectName) {
  const describe = await conn.sobject(objectName).describe();
  const counts = {};

  for (const f of describe.fields) {
    if (f.name === "Id") continue;
    try {
      const result = await conn.query(
        `SELECT COUNT(Id) c FROM ${objectName} WHERE ${f.name} != null`
      );
      counts[f.name] = result.records?.[0]?.c || 0;
    } catch {
      counts[f.name] = "N/A";
    }
  }

  return counts;
}

async function getPercentPresent(conn, objectName) {
  const describe = await conn.sobject(objectName).describe();
  const res = await conn.query(`SELECT COUNT(Id) total FROM ${objectName}`);
  const total = res.records[0].total;
  const completeness = {};

  for (const f of describe.fields) {
    if (f.name === "Id") continue;
    try {
      const result = await conn.query(
        `SELECT COUNT(Id) c FROM ${objectName} WHERE ${f.name} != null`
      );
      const filled = result.records?.[0]?.c || 0;
      completeness[f.name] = ((filled / total) * 100).toFixed(2) + "%";
    } catch {
      completeness[f.name] = "N/A";
    }
  }

  return completeness;
}

async function getDistinctCount(conn, objectName) {
  const describe = await conn.sobject(objectName).describe();
  const distinctCounts = {};

  for (const f of describe.fields) {
    if (f.name === "Id") continue;
    try {
      const result = await conn.query(`SELECT COUNT_DISTINCT(${f.name}) d FROM ${objectName}`);
      distinctCounts[f.name] = result.records?.[0]?.d || 0;
    } catch {
      distinctCounts[f.name] = "N/A";
    }
  }

  return distinctCounts;
}


// Fetch sample values for all fields in an object
async function getSampleValues(conn, objectName) {
  try {
    // 1️⃣ Get all field names from describe()
    const desc = await conn.sobject(objectName).describe();
    const allFields = desc.fields.map((f) => f.name);

    if (allFields.length === 0) return {};

    // 2️⃣ Split fields into chunks of 200 (SOQL limit)
    const chunk = (arr, size) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    const fieldChunks = chunk(allFields, 200);
    const sampleValues = {};

    // 3️⃣ Fetch one record per chunk
    for (const fields of fieldChunks) {
      try {
        const result = await conn.query(`SELECT ${fields.join(", ")} FROM ${objectName} LIMIT 1`);
        const record = result.records?.[0] || {};

        for (const f of fields) {
          let val = record[f];
          if (val === null || val === undefined) val = null; // leave null to handle later
          if (typeof val === "object" && val !== null) val = JSON.stringify(val);
          sampleValues[f] = val;
        }
      } catch (err) {
        console.warn(`⚠️ Could not query some fields for ${objectName}: ${err.message}`);
        for (const f of fields) sampleValues[f] = null;
      }
    }

    // 4️⃣ For fields with null, try fetching one non-null value
    for (const f of Object.keys(sampleValues)) {
      if (sampleValues[f] === null) {
        try {
          const result = await conn.query(
            `SELECT ${f} FROM ${objectName} WHERE ${f} != NULL LIMIT 1`
          );
          if (result.records && result.records.length > 0) {
            const val = result.records[0][f];
            sampleValues[f] = val === null || val === undefined ? "N/A" : String(val);
          } else {
            sampleValues[f] = "N/A";
          }
        } catch (err) {
          sampleValues[f] = "N/A"; // fallback if field not queryable
        }
      }
    }

    // 5️⃣ Ensure every field from describe() has a value
    for (const f of allFields) {
      if (!(f in sampleValues)) sampleValues[f] = "N/A";
    }

    return sampleValues;
  } catch (error) {
    console.error(`❌ Error fetching sample values for ${objectName}:`, error);
    return {};
  }
}

export default jsforceRateLimiter(handler);

