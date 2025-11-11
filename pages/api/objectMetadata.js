import jsforce from "jsforce";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const { accessToken, instanceUrl, selectedObject, type } = req.body;

  if (!accessToken || !instanceUrl || !type) {
    return res.status(400).json({ success: false, error: "Missing required parameters" });
  }

  try {
    const conn = new jsforce.Connection({
      instanceUrl,
      accessToken,
      version: "60.0", // Latest safe version
    });

    let result = [];

    switch (type) {
      // ✅ Validation Rules
      case "validationRules": {
        const query = `
          SELECT Id, ValidationName, EntityDefinition.DeveloperName, Active, Description, 
                 ErrorDisplayField, ErrorMessage
          FROM ValidationRule
          WHERE EntityDefinition.DeveloperName = '${selectedObject}'
        `;
        const records = await conn.tooling.query(query);
        result = records.records.map((r) => ({
          id: r.Id,
          name: r.ValidationName,
          object: r.EntityDefinition?.DeveloperName,
          active: r.Active,
          description: r.Description || "—",
          errorField: r.ErrorDisplayField || "—",
          errorMessage: r.ErrorMessage || "—",
        }));
        break;
      }

      // ✅ Triggers
      case "triggers": {
        const query = `
          SELECT Id, Name, TableEnumOrId, UsageBeforeInsert, UsageAfterInsert,
                 UsageBeforeUpdate, UsageAfterUpdate, UsageBeforeDelete, UsageAfterDelete,
                 Status, ApiVersion, Body
          FROM ApexTrigger
          WHERE TableEnumOrId = '${selectedObject}'
        `;
        const records = await conn.tooling.query(query);
        result = records.records.map((r) => ({
          id: r.Id,
          name: r.Name,
          object: r.TableEnumOrId,
          apiVersion: r.ApiVersion,
          status: r.Status,
          beforeInsert: r.UsageBeforeInsert,
          afterInsert: r.UsageAfterInsert,
          beforeUpdate: r.UsageBeforeUpdate,
          afterUpdate: r.UsageAfterUpdate,
          beforeDelete: r.UsageBeforeDelete,
          afterDelete: r.UsageAfterDelete,
          bodyPreview: r.Body ? r.Body.substring(0, 150) + "..." : "—",
        }));
        break;
      }

      // ✅ Apex Classes
      case "apexClasses": {
        const query = `
          SELECT Id, Name, ApiVersion, Status, LengthWithoutComments
          FROM ApexClass
          WHERE Name LIKE '%${selectedObject}%'
        `;
        const records = await conn.tooling.query(query);
        result = records.records.map((r) => ({
          id: r.Id,
          name: r.Name,
          apiVersion: r.ApiVersion,
          status: r.Status,
          length: r.LengthWithoutComments,
        }));
        break;
      }

      // ✅ Workflows
      case "workflows": {
        try {
          const metadata = await conn.metadata.read("Workflow", [selectedObject]);
          if (metadata && metadata.rules) {
            result = metadata.rules.map((r) => ({
              name: r.fullName,
              active: r.active,
              description: r.description || "—",
              formula: r.formula || "—",
              actions: r.actions ? r.actions.length : 0,
            }));
          } else {
            result = [];
          }
        } catch (err) {
          console.warn(`⚠️ Could not fetch workflows for ${selectedObject}:`, err.message);
          result = [];
        }
        break;
      }

      default:
        return res.status(400).json({ success: false, error: `Unsupported metadata type: ${type}` });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(`❌ Error fetching ${type} for ${selectedObject}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || `Error fetching ${type}`,
    });
  }
}
