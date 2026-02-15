/**
 * SalesforceProvider
 *
 * Implements ConnectionProvider for Salesforce orgs.
 * Wraps existing AuthStore + jsforce logic behind the unified interface.
 */

import jsforce from 'jsforce';
import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthStore } from '../AuthStore';
import { getServiceRoleClient } from '../supabaseClient';
import type {
  ColumnInfo,
  ConnectionProvider,
  FieldAnalysisResult,
  MetadataItem,
  ObjectDescribe,
  QueryResult,
  TableInfo,
} from './types';

export class SalesforceProvider implements ConnectionProvider {
  readonly type = 'salesforce';

  constructor(
    private req: NextApiRequest,
    private res: NextApiResponse
  ) {}

  private async getOrgDetails(connectionId: string, userId: string) {
    const supabase = getServiceRoleClient();
    const { data: conn, error } = await supabase
      .from('connections')
      .select(
        'id, salesforce_connection_details(instance_url, org_email, org_name, is_sandbox, encrypted_org_password, encrypted_security_token, refresh_token)'
      )
      .eq('id', connectionId)
      .eq('user_id', userId)
      .eq('connection_type', 'salesforce')
      .single();

    if (error || !conn) throw new Error('Salesforce connection not found');
    const details = (conn as any)?.salesforce_connection_details;
    if (!details) throw new Error('Salesforce connection details not found');
    return { id: conn.id, ...details };
  }

  private async getJsforceConnection(
    connectionId: string,
    userId: string
  ): Promise<jsforce.Connection> {
    const org = await this.getOrgDetails(connectionId, userId);
    const store = new AuthStore(this.req, this.res, org.instance_url);
    return store.getConnection();
  }

  async testConnection(connectionId: string, userId: string): Promise<boolean> {
    try {
      const conn = await this.getJsforceConnection(connectionId, userId);
      await conn.identity();
      return true;
    } catch {
      return false;
    }
  }

  async listTables(connectionId: string, userId: string): Promise<TableInfo[]> {
    const conn = await this.getJsforceConnection(connectionId, userId);
    const result = await conn.describeGlobal();

    return result.sobjects.map((obj) => ({
      name: obj.name,
      label: obj.label,
      custom: obj.custom,
    }));
  }

  async getColumns(connectionId: string, userId: string, tableName: string): Promise<ColumnInfo[]> {
    const conn = await this.getJsforceConnection(connectionId, userId);
    const desc = await conn.describe(tableName);

    return desc.fields.map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      nullable: f.nillable,
      length: f.length,
    }));
  }

  async executeQuery(connectionId: string, userId: string, query: string): Promise<QueryResult> {
    const conn = await this.getJsforceConnection(connectionId, userId);
    const result = await conn.query(query);

    const rows = result.records || [];
    const columns =
      rows.length > 0
        ? Object.keys(rows[0] as Record<string, unknown>).filter((k) => k !== 'attributes')
        : [];

    return {
      columns,
      rows: rows.map((r: any) => {
        const row: Record<string, any> = {};
        columns.forEach((col) => (row[col] = r[col]));
        return row;
      }),
      totalSize: result.totalSize,
    };
  }

  async describeObject(
    connectionId: string,
    userId: string,
    objectName: string
  ): Promise<ObjectDescribe> {
    const conn = await this.getJsforceConnection(connectionId, userId);
    const desc = await conn.describe(objectName);

    return {
      name: desc.name,
      label: desc.label,
      labelPlural: desc.labelPlural,
      keyPrefix: desc.keyPrefix,
      custom: desc.custom,
      queryable: desc.queryable,
      createable: desc.createable,
      updateable: desc.updateable,
      deletable: desc.deletable,
      fields: desc.fields.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        nullable: f.nillable,
        length: f.length,
        defaultValue: f.defaultValue != null ? String(f.defaultValue) : undefined,
      })),
      recordTypeInfos: desc.recordTypeInfos,
      childRelationships: desc.childRelationships?.map((cr) => ({
        childSObject: cr.childSObject,
        field: cr.field,
        relationshipName: cr.relationshipName,
      })),
    };
  }

  async getObjectMetadata(
    connectionId: string,
    userId: string,
    objectName: string,
    metadataType: string
  ): Promise<MetadataItem[]> {
    const conn = await this.getJsforceConnection(connectionId, userId);

    switch (metadataType) {
      case 'validationRules': {
        const q = `SELECT Id, ValidationName, Active, Description, ErrorDisplayField, ErrorMessage
          FROM ValidationRule WHERE EntityDefinition.DeveloperName = '${objectName}'`;
        const res = await conn.tooling.query<any>(q);
        return (res.records || []).map((r: any) => ({
          id: r.Id,
          name: r.ValidationName,
          active: r.Active,
          description: r.Description || '—',
          errorField: r.ErrorDisplayField || '—',
          errorMessage: r.ErrorMessage || '—',
        }));
      }
      case 'triggers': {
        const q = `SELECT Id, Name, Status, ApiVersion, UsageBeforeInsert, UsageAfterInsert,
          UsageBeforeUpdate, UsageAfterUpdate, UsageBeforeDelete, UsageAfterDelete
          FROM ApexTrigger WHERE TableEnumOrId = '${objectName}'`;
        const res = await conn.tooling.query<any>(q);
        return (res.records || []).map((r: any) => ({
          id: r.Id,
          name: r.Name,
          status: r.Status,
          apiVersion: r.ApiVersion,
          beforeInsert: r.UsageBeforeInsert,
          afterInsert: r.UsageAfterInsert,
          beforeUpdate: r.UsageBeforeUpdate,
          afterUpdate: r.UsageAfterUpdate,
          beforeDelete: r.UsageBeforeDelete,
          afterDelete: r.UsageAfterDelete,
        }));
      }
      case 'apexClasses': {
        const q = `SELECT Id, Name, ApiVersion, Status, LengthWithoutComments
          FROM ApexClass WHERE Name LIKE '%${objectName}%'`;
        const res = await conn.tooling.query<any>(q);
        return (res.records || []).map((r: any) => ({
          id: r.Id,
          name: r.Name,
          apiVersion: r.ApiVersion,
          status: r.Status,
          length: r.LengthWithoutComments,
        }));
      }
      case 'workflows': {
        try {
          const metadata = (await conn.metadata.read('Workflow', [objectName])) as any;
          if (metadata?.rules) {
            return metadata.rules.map((r: any) => ({
              name: r.fullName,
              active: r.active,
              description: r.description || '—',
              formula: r.formula || '—',
              actions: r.actions ? r.actions.length : 0,
            }));
          }
          return [];
        } catch {
          return [];
        }
      }
      default:
        throw new Error(`Unsupported Salesforce metadata type: ${metadataType}`);
    }
  }

  async getRecordCount(connectionId: string, userId: string, objectName: string): Promise<number> {
    const conn = await this.getJsforceConnection(connectionId, userId);
    const result = await conn.query(`SELECT COUNT() FROM ${objectName}`);
    return result.totalSize;
  }

  async getDetailedFields(
    connectionId: string,
    userId: string,
    objectNames: string[]
  ): Promise<Record<string, Record<string, unknown>[]>> {
    const conn = await this.getJsforceConnection(connectionId, userId);
    const result: Record<string, Record<string, unknown>[]> = {};

    for (const objectName of objectNames) {
      const desc = await conn.sobject(objectName).describe();
      result[objectName] = desc.fields.map((f) => ({
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

    return result;
  }

  async getFieldAnalysis(
    connectionId: string,
    userId: string,
    objectName: string
  ): Promise<FieldAnalysisResult> {
    const conn = await this.getJsforceConnection(connectionId, userId);

    // 1. Describe once to get field list
    const describe = await conn.sobject(objectName).describe();

    // Filter out field types that can't be used with COUNT/COUNT_DISTINCT
    const NON_AGGREGATABLE_TYPES = new Set([
      'base64',
      'encryptedstring',
      'datacategorygroupreference',
    ]);
    const aggregatableFields = describe.fields.filter(
      (f) =>
        f.name !== 'Id' &&
        f.aggregatable !== false &&
        !NON_AGGREGATABLE_TYPES.has(f.type.toLowerCase())
    );
    const allFieldNames = describe.fields.filter((f) => f.name !== 'Id').map((f) => f.name);

    // 2. Get total row count
    const totalRes = await conn.query<{ total: number }>(
      `SELECT COUNT(Id) total FROM ${objectName}`
    );
    const totalRows = totalRes?.records?.[0]?.total || 0;

    // 3. Initialize results
    const fields: Record<string, { populated: number; distinct: number; sample: string | null }> =
      {};
    for (const name of allFieldNames) {
      fields[name] = { populated: 0, distinct: 0, sample: null };
    }

    // 4. Batch COUNT(Field) queries — 20 fields per query
    const BATCH_SIZE = 20;
    const aggregatableNames = aggregatableFields.map((f) => f.name);
    for (let i = 0; i < aggregatableNames.length; i += BATCH_SIZE) {
      const batch = aggregatableNames.slice(i, i + BATCH_SIZE);
      const selectClause = batch.map((f) => `COUNT(${f}) ${f}`).join(', ');
      try {
        const result = await conn.query<Record<string, number>>(
          `SELECT ${selectClause} FROM ${objectName}`
        );
        const row = result.records?.[0];
        if (row) {
          for (const f of batch) {
            if (fields[f]) fields[f].populated = row[f] ?? 0;
          }
        }
      } catch {
        // If batch fails, try fields individually
        for (const f of batch) {
          try {
            const r = await conn.query<{ c: number }>(`SELECT COUNT(${f}) c FROM ${objectName}`);
            if (fields[f]) fields[f].populated = r.records?.[0]?.c ?? 0;
          } catch {
            // Field can't be aggregated — leave as 0
          }
        }
      }
    }

    // 5. Batch COUNT_DISTINCT queries — 20 fields per query
    for (let i = 0; i < aggregatableNames.length; i += BATCH_SIZE) {
      const batch = aggregatableNames.slice(i, i + BATCH_SIZE);
      // SOQL requires aliased COUNT_DISTINCT — use one per query for safety
      // COUNT_DISTINCT can't be batched with other aggregates in all cases
      for (const f of batch) {
        try {
          const r = await conn.query<{ d: number }>(
            `SELECT COUNT_DISTINCT(${f}) d FROM ${objectName}`
          );
          if (fields[f]) fields[f].distinct = r.records?.[0]?.d ?? 0;
        } catch {
          // Field can't be used with COUNT_DISTINCT — leave as 0
        }
      }
    }

    // 6. Sample values — batch by 200 fields
    const SAMPLE_BATCH = 200;
    for (let i = 0; i < allFieldNames.length; i += SAMPLE_BATCH) {
      const batch = allFieldNames.slice(i, i + SAMPLE_BATCH);
      try {
        const result = await conn.query<Record<string, unknown>>(
          `SELECT ${batch.join(', ')} FROM ${objectName} LIMIT 1`
        );
        const record = result.records?.[0];
        if (record) {
          for (const f of batch) {
            let val = record[f];
            if (val === null || val === undefined) {
              if (fields[f]) fields[f].sample = null;
            } else if (typeof val === 'object') {
              if (fields[f]) fields[f].sample = JSON.stringify(val);
            } else {
              if (fields[f]) fields[f].sample = String(val);
            }
          }
        }
      } catch {
        // Some fields can't be queried together — leave samples as null
      }
    }

    return { totalRows, fields };
  }
}
