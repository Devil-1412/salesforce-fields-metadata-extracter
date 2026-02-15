import { AuthStore } from '@lib/AuthStore';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import type { NextApiRequest, NextApiResponse } from 'next';

interface FieldInfo {
  label: string;
  ApiName: string;
  type: string;
  length: number;
  // Many additional properties
  [key: string]: unknown;
}

interface FieldsResponse {
  success: boolean;
  data?: Record<string, FieldInfo[]>;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<FieldsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken, instanceUrl, objects } = req.body;

  if (!instanceUrl || !objects || objects.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing or invalid parameters' });
  }

  try {
    const store = new AuthStore(req, res, instanceUrl);
    const conn = await store.getConnection();
    const result: Record<string, FieldInfo[]> = {};

    for (const object of objects) {
      const desc = await conn.sobject(object).describe();
      result[object] = desc.fields.map((f) => ({
        label: f.label,
        ApiName: f.name,
        type: f.type,
        length: f.length,
        precision: f.precision,
        scale: f.scale,
        digits: f.digits,
        nameField: f.nameField,
        byteLength: f.byteLength,
        soapType: f.soapType,
        extraTypeInfo: (f as any).extraTypeInfo,
        defaultValue: f.defaultValue,
        defaultValueFormula: f.defaultValueFormula,
        compoundFieldName: (f as any).compoundFieldName,
        controllerName: f.controllerName,
        filteredLookupInfo: f.filteredLookupInfo,
        mask: (f as any).mask,
        maskType: (f as any).maskType,
        referenceTo: f.referenceTo,
        referenceTargetField: (f as any).referenceTargetField,
        relationshipName: f.relationshipName,
        relationshipOrder: f.relationshipOrder,
        aggregatable: f.aggregatable,
        aiPredictionField: (f as any).aiPredictionField,
        autoNumber: f.autoNumber,
        calculated: f.calculated,
        cascadeDelete: f.cascadeDelete,
        caseSensitive: f.caseSensitive,
        custom: f.custom,
        defaultedOnCreate: f.defaultedOnCreate,
        dependentPicklist: f.dependentPicklist,
        deprecatedAndHidden: f.deprecatedAndHidden,
        displayLocationInDecimal: (f as any).displayLocationInDecimal,
        encrypted: (f as any).encrypted,
        externalId: f.externalId,
        filterable: f.filterable,
        formulaTreatNullNumberAsZero: (f as any).formulaTreatNullNumberAsZero,
        groupable: f.groupable,
        highScaleNumber: (f as any).highScaleNumber,
        htmlFormatted: f.htmlFormatted,
        idLookup: f.idLookup,
        namePointing: f.namePointing,
        permissionable: f.permissionable,
        polymorphicForeignKey: f.polymorphicForeignKey,
        queryByDistance: (f as any).queryByDistance,
        restrictedDelete: f.restrictedDelete,
        restrictedPicklist: f.restrictedPicklist,
        searchPrefilterable: (f as any).searchPrefilterable,
        sortable: f.sortable,
        unique: f.unique,
        writeRequiresMasterRead: f.writeRequiresMasterRead,
        SalesforceDataType: f.type,
        Nullable: f.nillable,
        Createable: f.createable,
        Updateable: f.updateable,
        PicklistValues: f.picklistValues?.map((p) => p.value) || [],
        Description: f.inlineHelpText || (f as any).description,
        HelpText: f.inlineHelpText,
        Formula: f.calculatedFormula,
      }));
    }
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

export default jsforceRateLimiter(handler);
