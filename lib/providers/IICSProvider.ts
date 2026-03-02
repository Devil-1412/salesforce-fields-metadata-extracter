/**
 * IICSProvider
 *
 * Implements ConnectionProvider for Informatica IICS connections.
 * Wraps the iicsClient behind the unified interface so all
 * /api/connections/[id]/... routes automatically support IICS.
 *
 * Verified Endpoints (from official Informatica docs):
 * ────────────────────────────────────────────────────
 * V3 (prefix: /public/core/v3):
 *   Objects list:     GET /public/core/v3/objects
 *                     Response: { count, objects: [{id, path, type, description, updatedBy, updateTime}] }
 *   Object by query:  GET /public/core/v3/objects?q=type=='MTT'
 *   Object detail:    GET /public/core/v3/objects/<id>
 *   Object deps:      GET /public/core/v3/objects/<id>/references
 *   Schedule list:    GET /public/core/v3/schedule
 *                     Response: [{id, name, status, startTime, interval, frequency, ...}]
 *   Schedule detail:  GET /public/core/v3/schedule/<id>
 *
 * V2 (prefix: /api/v2) — kept where V3 has no equivalent:
 *   Runtime envs:      GET /api/v2/runtimeEnvironment
 *   Runtime detail:    GET /api/v2/runtimeEnvironment/<id>
 *   Mapping detail:    GET /api/v2/mapping/<id>  (V3 objects lacks sources/targets/transforms)
 *   Audit logs:        GET /api/v2/auditlog
 */

import { getIICSSession, iicsGet, iicsGetImage } from '../iicsClient';
import type {
  ColumnInfo,
  ConnectionProvider,
  FieldAnalysisResult,
  MetadataItem,
  ObjectDescribe,
  QueryResult,
  TableInfo,
} from './types';

export class IICSProvider implements ConnectionProvider {
  readonly type = 'iics';

  // ── Connection test ──

  async testConnection(connectionId: string, userId: string): Promise<boolean> {
    try {
      await getIICSSession(connectionId, userId);
      return true;
    } catch {
      return false;
    }
  }

  // ── List objects / assets ──
  // V3: GET /public/core/v3/objects → { count, objects: [...] }

  async listTables(connectionId: string, userId: string): Promise<TableInfo[]> {
    const data: any = await iicsGet(connectionId, userId, '/public/core/v3/objects');

    const items = Array.isArray(data?.objects) ? data.objects : [];

    return items.map((item: any) => ({
      ...item,
      name: item.path || item.name || item.id,
      label: item.path || item.name || item.id,
      schema: item.type || undefined,
      comment: item.description || undefined,
      custom: false,
    }));
  }

  // ── Get columns / fields for a specific object ──
  // V3: GET /public/core/v3/objects/<id>/references → { id, count, references: [...] }
  // IICS objects don't have "columns" in the traditional sense,
  // so we return the object's dependency references as field-like entries.

  async getColumns(connectionId: string, userId: string, tableName: string): Promise<ColumnInfo[]> {
    try {
      const data: any = await iicsGet(
        connectionId,
        userId,
        `/public/core/v3/objects/${encodeURIComponent(tableName)}/references?refType=uses`
      );

      const refs = Array.isArray(data?.references) ? data.references : [];

      return refs.map((ref: any) => ({
        name: ref.path || ref.id || 'unknown',
        label: ref.path || ref.id || 'unknown',
        type: ref.type || 'Reference',
        nullable: true,
      }));
    } catch {
      // If references endpoint fails, return empty — the object may not have deps
      return [];
    }
  }

  // ── Execute query (not directly applicable — stub) ──

  async executeQuery(_connectionId: string, _userId: string, _query: string): Promise<QueryResult> {
    // IICS doesn't support free-form SQL queries.
    return {
      columns: [],
      rows: [],
      totalSize: 0,
    };
  }

  // ── Describe object ──
  // Calls three V3 endpoints:
  //   1. GET /public/core/v3/objects/{id}                       → full asset + mapping metadata
  //   2. GET /public/core/v3/objects/{id}/references?refType=uses    → what this object depends on
  //   3. GET /public/core/v3/objects/{id}/references?refType=usedBy  → what depends on this object

  async describeObject(
    connectionId: string,
    userId: string,
    objectName: string
  ): Promise<ObjectDescribe> {
    const encodedId = encodeURIComponent(objectName);

    // 1. Fetch full asset details by path query via V3
    let assetData: any = {};
    try {
      const query = encodeURIComponent(`path=='${objectName}'`);
      const result: any = await iicsGet(connectionId, userId, `/public/core/v3/objects?q=${query}`);
      const objects = Array.isArray(result?.objects) ? result.objects : [];
      assetData = objects[0] || {};
    } catch (err: any) {
      console.error('[IICS describeObject] Failed:', err?.message || err);
    }

    // 2. Fetch "uses" references (dependencies)
    let usesRefs: any[] = [];
    if (assetData?.id) {
      try {
        const depData: any = await iicsGet(
          connectionId,
          userId,
          `/public/core/v3/objects/${assetData.id}/references?refType=uses`
        );
        usesRefs = Array.isArray(depData?.references) ? depData.references : [];
      } catch {
        // OK — object might not have references
      }
    }

    // 3. Fetch "usedBy" references (reverse dependencies)
    let usedByRefs: any[] = [];
    if (assetData?.id) {
      try {
        const usedByData: any = await iicsGet(
          connectionId,
          userId,
          `/public/core/v3/objects/${assetData.id}/references?refType=usedBy`
        );
        usedByRefs = Array.isArray(usedByData?.references) ? usedByData.references : [];
      } catch {
        // OK — object might not be used by anything
      }
    }

    // Extract mapping content from metadata.content (for DTEMPLATE / MTT types)
    const content = assetData?.metadata?.content || {};
    const sources = Array.isArray(content.sources) ? content.sources : [];
    const targets = Array.isArray(content.targets) ? content.targets : [];
    const transformations = Array.isArray(content.transformations) ? content.transformations : [];
    const parameters = Array.isArray(content.parameters) ? content.parameters : [];

    return {
      name: assetData?.path || objectName,
      label: assetData?.path || objectName,
      fields: usesRefs.map((ref: any) => ({
        name: ref.path || ref.id || 'unknown',
        label: ref.path || ref.id,
        type: ref.type || 'Reference',
        nullable: true,
      })),
      description: assetData?.description || undefined,
      connectionType: 'iics',

      // ── Asset details ──
      objectId: assetData?.id,
      path: assetData?.path,
      type: assetData?.type,
      updatedBy: assetData?.updatedBy,
      updateTime: assetData?.updateTime,
      createdBy: assetData?.createdBy,
      createTime: assetData?.createTime,
      tags: assetData?.tags,
      sourceControl: assetData?.sourceControl,
      appContextId: assetData?.appContextId,

      // ── Mapping-specific content ──
      sources,
      targets,
      transformations,
      parameters,

      // ── Reverse dependencies (usedBy) ──
      usedBy: usedByRefs.map((ref: any) => ({
        id: ref.id,
        path: ref.path || ref.id,
        type: ref.type || 'Unknown',
      })),
    };
  }

  // ── Object metadata (schedules, runtime environments) ──

  async getObjectMetadata(
    connectionId: string,
    userId: string,
    _objectName: string,
    metadataType: string
  ): Promise<MetadataItem[]> {
    switch (metadataType) {
      case 'schedules': {
        // V3: GET /public/core/v3/schedule
        const data: any = await iicsGet(connectionId, userId, '/public/core/v3/schedule');
        return Array.isArray(data) ? data : [];
      }
      case 'runtimeEnvironments': {
        // V2: GET /api/v2/runtimeEnvironment
        const data: any = await iicsGet(connectionId, userId, '/api/v2/runtimeEnvironment');
        return Array.isArray(data) ? data : [];
      }
      case 'mappings': {
        // V3: GET /public/core/v3/objects?q=type=='TASKFLOW'
        const data: any = await iicsGet(
          connectionId,
          userId,
          "/public/core/v3/objects?q=type=='TASKFLOW'"
        );
        return Array.isArray(data?.objects) ? data.objects : [];
      }
      case 'auditLogs': {
        // V2: GET /api/v2/auditlog
        const data: any = await iicsGet(connectionId, userId, '/api/v2/auditlog?eventType=LOGIN');
        return Array.isArray(data) ? data : [];
      }
      case 'tasks': {
        // V3: GET /public/core/v3/objects?q=type=='<type>'
        // Task types: DMASK, DRS, DSS, MTT, PCS
        const types = ['DMASK', 'DRS', 'DSS', 'MTT', 'PCS'];
        const results = await Promise.all(
          types.map(async (t) => {
            try {
              const data: any = await iicsGet(
                connectionId,
                userId,
                `/public/core/v3/objects?q=type=='${t}'`
              );
              const items = Array.isArray(data?.objects) ? data.objects : [];
              return items.map((item: any) => ({ ...item, taskType: t }));
            } catch (err) {
              return [];
            }
          })
        );
        return results.flat();
      }
      default:
        throw new Error(
          `Unsupported IICS metadata type: ${metadataType}. Supported: schedules, runtimeEnvironments, mappings, auditLogs, tasks`
        );
    }
  }

  // ── Get mapping detail ──
  // V2: GET /api/v2/mapping/<id>
  // Kept as V2 because V3 /objects/{id} does not include sources/targets/transformations/parameters

  async getMappingDetail(
    connectionId: string,
    userId: string,
    mappingId: string
  ): Promise<Record<string, unknown>> {
    const data: any = await iicsGet(
      connectionId,
      userId,
      `/api/v2/mapping/${encodeURIComponent(mappingId)}`
    );
    return data || {};
  }

  // ── Get mapping image ──
  // V2: GET /api/v2/mapping/<id>/image?deployed=false

  async getMappingImage(
    connectionId: string,
    userId: string,
    mappingId: string,
    deployed: boolean = false
  ): Promise<{ buffer: ArrayBuffer; contentType: string }> {
    return await iicsGetImage(
      connectionId,
      userId,
      `/api/v2/mapping/${encodeURIComponent(mappingId)}/image?deployed=${deployed}`
    );
  }

  // ── Taskflow references (L1 only — lazy strategy) ──

  async getTaskflowMappings(
    connectionId: string,
    userId: string,
    taskflowId: string
  ): Promise<any> {
    const data: any = await iicsGet(
      connectionId,
      userId,
      `/public/core/v3/objects/${encodeURIComponent(taskflowId)}/references?refType=uses`
    );
    const refs = Array.isArray(data?.references) ? data.references : [];

    return {
      mappingTasks: refs.filter((r: any) => r.documentType === 'MCT'),
      references: refs.filter((r: any) => r.documentType !== 'MCT'),
    };
  }

  // ── MCT child references (L2 — fetched on accordion open) ──

  async getMctReferences(connectionId: string, userId: string, mctId: string): Promise<any> {
    const data: any = await iicsGet(
      connectionId,
      userId,
      `/public/core/v3/objects/${encodeURIComponent(mctId)}/references?refType=uses`
    );
    const refs = Array.isArray(data?.references) ? data.references : [];

    return {
      connections: refs.filter((r: any) => r.documentType === 'SAAS_CONNECTION'),
      mappings: refs.filter((r: any) => r.documentType === 'MAPPING'),
      otherRefs: refs.filter(
        (r: any) => r.documentType !== 'SAAS_CONNECTION' && r.documentType !== 'MAPPING'
      ),
    };
  }

  // ── Get runtime environment detail ──
  // V2: GET /api/v2/runtimeEnvironment/<id>

  async getRuntimeEnvDetail(
    connectionId: string,
    userId: string,
    envId: string
  ): Promise<Record<string, unknown>> {
    const data: any = await iicsGet(
      connectionId,
      userId,
      `/api/v2/runtimeEnvironment/${encodeURIComponent(envId)}`
    );
    return data || {};
  }

  // ── Record count (not directly applicable — stub) ──

  async getRecordCount(
    _connectionId: string,
    _userId: string,
    _objectName: string
  ): Promise<number> {
    return 0;
  }

  // ── Detailed fields ──
  // Returns object dependencies as field-like data

  async getDetailedFields(
    connectionId: string,
    userId: string,
    objectNames: string[]
  ): Promise<Record<string, Record<string, unknown>[]>> {
    const result: Record<string, Record<string, unknown>[]> = {};

    for (const objName of objectNames) {
      try {
        const data: any = await iicsGet(
          connectionId,
          userId,
          `/public/core/v3/objects/${encodeURIComponent(objName)}/references?refType=uses`
        );
        const refs = Array.isArray(data?.references) ? data.references : [];

        result[objName] = refs.map((ref: any) => ({
          label: ref.path || ref.id,
          ApiName: ref.id,
          type: ref.type || 'Reference',
          Description: ref.description || null,
        }));
      } catch {
        result[objName] = [];
      }
    }

    return result;
  }

  // ── Field analysis (not directly applicable — stub) ──

  async getFieldAnalysis(
    _connectionId: string,
    _userId: string,
    _objectName: string
  ): Promise<FieldAnalysisResult> {
    return { totalRows: 0, fields: {} };
  }
}
