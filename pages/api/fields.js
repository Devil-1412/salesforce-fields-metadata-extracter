import jsforce from "jsforce";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accessToken, instanceUrl, objects } = req.body;

  if (!accessToken || !instanceUrl || !objects || !Array.isArray(objects)) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
  }

  try {
    const conn = new jsforce.Connection({ accessToken, instanceUrl });
    const result = {};

    for (let obj of objects) {
      const desc = await conn.sobject(obj).describe();
      console.log(desc);
      result[obj] = desc.fields.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        length: f.length,
        precision: f.precision,
        scale: f.scale,
        digits: f.digits,
        byteLength: f.byteLength,
        DBOrder: f.DBOrder,
        soapType: f.soapType,
        extraTypeInfo: f.extraTypeInfo,
        defaultValue: f.defaultValue,
        defaultValueFormula: f.defaultValueFormula,
        compoundFieldName: f.compoundFieldName,
        controllerName: f.controllerName,
        filteredLookupInfo: f.filteredLookupInfo,
        mask: f.mask,
        maskType: f.maskType,
        referenceTo: f.referenceTo,
        referenceTargetField: f.referenceTargetField,
        relationshipName: f.relationshipName,
        relationshipOrder: f.relationshipOrder,
        aggregatable: f.aggregatable,
        aiPredictionField: f.aiPredictionField,
        autoNumber: f.autoNumber,
        calculated: f.calculated,
        cascadeDelete: f.cascadeDelete,
        cascadeDeleteSpecified: f.cascadeDeleteSpecified,
        caseSensitive: f.caseSensitive,
        custom: f.custom,
        dataTranslationEnabled: f.dataTranslationEnabled,
        dataTranslationEnabledSpecified: f.dataTranslationEnabledSpecified,
        defaultedOnCreate: f.defaultedOnCreate,
        dependentPicklist: f.dependentPicklist,
        dependentPicklistSpecified: f.dependentPicklistSpecified,
        deprecatedAndHidden: f.deprecatedAndHidden,
        displayLocationInDecimal: f.displayLocationInDecimal,
        displayLocationInDecimalSpecified: f.displayLocationInDecimalSpecified,
        encrypted: f.encrypted,
        encryptedSpecified: f.encryptedSpecified,
        externalId: f.externalId,
        externalIdSpecified: f.externalIdSpecified,
        filterable: f.filterable,
        formulaTreatNullNumberAsZero: f.formulaTreatNullNumberAsZero,
        formulaTreatNullNumberAsZeroSpecified: f.formulaTreatNullNumberAsZeroSpecified,
        groupable: f.groupable,
        highScaleNumber: f.highScaleNumber,
        highScaleNumberSpecified: f.highScaleNumberSpecified,
        htmlFormatted: f.htmlFormatted,
        htmlFormattedSpecified: f.htmlFormattedSpecified,
        idLookup: f.idLookup,
        nameField: f.nameField,
        namePointing: f.namePointing,
        namePointingSpecified: f.namePointingSpecified,
        permissionable: f.permissionable,
        polymorphicForeignKey: f.polymorphicForeignKey,
        queryByDistance: f.queryByDistance,
        relationshipOrderSpecified: f.relationshipOrderSpecified,
        restrictedDelete: f.restrictedDelete,
        restrictedDeleteSpecified: f.restrictedDeleteSpecified,
        restrictedPicklist: f.restrictedPicklist,
        searchPrefilterable: f.searchPrefilterable,
        sortable: f.sortable,
        sortableSpecified: f.sortableSpecified,
        unique: f.unique,
        writeRequiresMasterRead: f.writeRequiresMasterRead,
        writeRequiresMasterReadSpecified: f.writeRequiresMasterReadSpecified,
        SalesforceDataType: f.type,
        MSSQLDataType: f.MSSQLDataType,
        OracleDataType: f.OracleDataType,
        MySQLDataType: f.MySQLDataType,
        Properties: f.Properties,
        Nullable: f.nillable,
        Createable: f.createable,
        Updateable: f.updateable,
        OnPageLayout: f.OnPageLayout,
        PicklistValues: f.picklistValues?.map((p) => p.value) || [],
        Category: f.category,
        Description: f.inlineHelpText || f.description,
        HelpText: f.inlineHelpText,
        Formula: f.calculatedFormula,
      }));
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
