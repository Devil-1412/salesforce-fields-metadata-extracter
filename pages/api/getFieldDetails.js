import jsforce from "jsforce";
import { jsforceRateLimiter } from "@lib/rateLimiter";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accessToken, instanceUrl, objectName, fieldName } = req.body;

  if (!accessToken || !instanceUrl || !objectName || !fieldName) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const conn = new jsforce.Connection({ accessToken, instanceUrl });

    // Use Tooling API to query FieldDefinition
    // Metadata is the specialized complex field on FieldDefinition that contains much of what we want, 
    // but standard fields like CreatedDate are directly on the record.
    const query = `
SELECT
  Id,
  DeveloperName,
  QualifiedApiName,
  Label,
  Description,
  CreatedDate,
  CreatedBy.Name,
  LastModifiedDate,
  LastModifiedBy.Name,
  SecurityClassification,
  ComplianceGroup
FROM FieldDefinition
WHERE EntityDefinition.QualifiedApiName = '${objectName}'
AND DeveloperName = '${fieldName}'
    `;

    const result = await conn.tooling.query(query);

    if (result.records && result.records.length > 0) {
      res.status(200).json({ success: true, data: result.records[0] });
    } else {
      // Fallback or just empty if not found (e.g. if it's a standard field that sometimes behaves oddly in Tooling API)
      res.status(404).json({ success: false, error: "Field definition not found" });
    }
  } catch (err) {
    console.error("Error fetching field details:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export default jsforceRateLimiter(handler);
