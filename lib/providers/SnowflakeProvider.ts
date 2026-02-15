/**
 * SnowflakeProvider
 *
 * Implements ConnectionProvider for Snowflake connections.
 * Wraps existing SnowflakeConnectionManager + snowflake-sdk behind the unified interface.
 */

import { executeSnowflakeQuery } from '../snowflakeClient';
import type {
  ColumnInfo,
  ConnectionProvider,
  FieldAnalysisResult,
  MetadataItem,
  ObjectDescribe,
  QueryResult,
  TableInfo,
} from './types';

export class SnowflakeProvider implements ConnectionProvider {
  readonly type = 'snowflake';

  async testConnection(connectionId: string, userId: string): Promise<boolean> {
    try {
      await executeSnowflakeQuery(connectionId, userId, 'SELECT 1 AS test');
      return true;
    } catch {
      return false;
    }
  }

  async listTables(connectionId: string, userId: string): Promise<TableInfo[]> {
    const query = `
      SELECT table_name, table_schema, row_count, comment
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      AND table_schema != 'INFORMATION_SCHEMA'
      ORDER BY table_name;
    `;

    const rows = await executeSnowflakeQuery(connectionId, userId, query);

    return rows.map((t: any) => ({
      name: t.TABLE_NAME,
      label: t.TABLE_NAME,
      schema: t.TABLE_SCHEMA,
      rowCount: t.ROW_COUNT,
      comment: t.COMMENT,
      custom: true,
    }));
  }

  async getColumns(connectionId: string, userId: string, tableName: string): Promise<ColumnInfo[]> {
    const query = `
      SELECT column_name, data_type, is_nullable, column_default, comment, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = ?
      ORDER BY ordinal_position;
    `;

    const rows = await executeSnowflakeQuery(connectionId, userId, query, [tableName]);

    return rows.map((c: any) => ({
      name: c.COLUMN_NAME,
      type: c.DATA_TYPE,
      nullable: c.IS_NULLABLE === 'YES',
      defaultValue: c.COLUMN_DEFAULT,
      comment: c.COMMENT,
      length: c.CHARACTER_MAXIMUM_LENGTH,
    }));
  }

  async executeQuery(connectionId: string, userId: string, query: string): Promise<QueryResult> {
    const rows = await executeSnowflakeQuery(connectionId, userId, query);

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      columns,
      rows,
      totalSize: rows.length,
    };
  }

  async describeObject(
    connectionId: string,
    userId: string,
    objectName: string
  ): Promise<ObjectDescribe> {
    const query = `
      SELECT column_name, data_type, is_nullable, column_default, comment,
             character_maximum_length, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = ?
      ORDER BY ordinal_position;
    `;

    const rows = await executeSnowflakeQuery(connectionId, userId, query, [objectName]);

    return {
      name: objectName,
      label: objectName,
      fields: rows.map((c: any) => ({
        name: c.COLUMN_NAME,
        label: c.COLUMN_NAME,
        type: c.DATA_TYPE,
        nullable: c.IS_NULLABLE === 'YES',
        defaultValue: c.COLUMN_DEFAULT,
        comment: c.COMMENT,
        length: c.CHARACTER_MAXIMUM_LENGTH,
        precision: c.NUMERIC_PRECISION,
        scale: c.NUMERIC_SCALE,
      })),
    };
  }

  async getObjectMetadata(
    connectionId: string,
    userId: string,
    objectName: string,
    metadataType: string
  ): Promise<MetadataItem[]> {
    switch (metadataType) {
      case 'constraints': {
        const q = `
          SELECT constraint_name, constraint_type, table_schema
          FROM information_schema.table_constraints
          WHERE table_name = ?
          ORDER BY constraint_name;
        `;
        const rows = await executeSnowflakeQuery(connectionId, userId, q, [objectName]);
        return rows.map((r: any) => ({
          name: r.CONSTRAINT_NAME,
          type: r.CONSTRAINT_TYPE,
          schema: r.TABLE_SCHEMA,
        }));
      }
      case 'views': {
        const q = `
          SELECT table_name, view_definition, is_updatable
          FROM information_schema.views
          WHERE table_name LIKE ?
          ORDER BY table_name;
        `;
        const rows = await executeSnowflakeQuery(connectionId, userId, q, [`%${objectName}%`]);
        return rows.map((r: any) => ({
          name: r.TABLE_NAME,
          definition: r.VIEW_DEFINITION ? r.VIEW_DEFINITION.substring(0, 200) : null,
          updatable: r.IS_UPDATABLE === 'YES',
        }));
      }
      case 'sequences': {
        const q = `
          SELECT sequence_name, data_type, start_value, increment
          FROM information_schema.sequences
          ORDER BY sequence_name;
        `;
        const rows = await executeSnowflakeQuery(connectionId, userId, q);
        return rows.map((r: any) => ({
          name: r.SEQUENCE_NAME,
          dataType: r.DATA_TYPE,
          startValue: r.START_VALUE,
          increment: r.INCREMENT,
        }));
      }
      case 'procedures': {
        const q = `
          SELECT procedure_name, procedure_schema, argument_signature
          FROM information_schema.procedures
          ORDER BY procedure_name;
        `;
        const rows = await executeSnowflakeQuery(connectionId, userId, q);
        return rows.map((r: any) => ({
          name: r.PROCEDURE_NAME,
          schema: r.PROCEDURE_SCHEMA,
          signature: r.ARGUMENT_SIGNATURE,
        }));
      }
      default:
        throw new Error(
          `Unsupported Snowflake metadata type: ${metadataType}. Supported: constraints, views, sequences, procedures`
        );
    }
  }

  async getRecordCount(connectionId: string, userId: string, objectName: string): Promise<number> {
    const rows = await executeSnowflakeQuery(
      connectionId,
      userId,
      `SELECT COUNT(*) AS CNT FROM ${objectName}`
    );
    return rows[0]?.CNT ?? 0;
  }

  async getDetailedFields(
    connectionId: string,
    userId: string,
    objectNames: string[]
  ): Promise<Record<string, Record<string, unknown>[]>> {
    const result: Record<string, Record<string, unknown>[]> = {};

    for (const tableName of objectNames) {
      const query = `
        SELECT column_name, data_type, is_nullable, column_default, comment,
               character_maximum_length, numeric_precision, numeric_scale,
               ordinal_position, is_identity
        FROM information_schema.columns
        WHERE table_name = ?
        ORDER BY ordinal_position;
      `;
      const rows = await executeSnowflakeQuery(connectionId, userId, query, [tableName]);

      result[tableName] = rows.map((c: any) => ({
        label: c.COLUMN_NAME,
        ApiName: c.COLUMN_NAME,
        type: c.DATA_TYPE,
        length: c.CHARACTER_MAXIMUM_LENGTH,
        precision: c.NUMERIC_PRECISION,
        scale: c.NUMERIC_SCALE,
        Nullable: c.IS_NULLABLE === 'YES',
        defaultValue: c.COLUMN_DEFAULT,
        Description: c.COMMENT,
        ordinalPosition: c.ORDINAL_POSITION,
        isIdentity: c.IS_IDENTITY === 'YES',
      }));
    }

    return result;
  }

  async getFieldAnalysis(
    connectionId: string,
    userId: string,
    objectName: string
  ): Promise<FieldAnalysisResult> {
    // 1. Get column names
    const colRows = await executeSnowflakeQuery(
      connectionId,
      userId,
      `SELECT column_name FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position`,
      [objectName]
    );
    const columnNames = colRows.map((r: any) => r.COLUMN_NAME as string);

    if (columnNames.length === 0) {
      return { totalRows: 0, fields: {} };
    }

    // 2. Initialize results
    const fields: Record<string, { populated: number; distinct: number; sample: string | null }> =
      {};
    for (const col of columnNames) {
      fields[col] = { populated: 0, distinct: 0, sample: null };
    }

    // 3. Combined COUNT(col) + COUNT(DISTINCT col) — batch by 40 columns
    //    Each column uses 2 expressions, so 40 cols = 80 expressions per query
    const BATCH_SIZE = 40;
    let totalRows = 0;

    for (let i = 0; i < columnNames.length; i += BATCH_SIZE) {
      const batch = columnNames.slice(i, i + BATCH_SIZE);
      const expressions: string[] = [];

      for (const col of batch) {
        const safeCol = `"${col}"`;
        expressions.push(`COUNT(${safeCol}) AS "${col}_pop"`);
        expressions.push(`COUNT(DISTINCT ${safeCol}) AS "${col}_dist"`);
      }

      // Include COUNT(*) in the first batch for total rows
      if (i === 0) {
        expressions.push('COUNT(*) AS "_total_rows"');
      }

      try {
        const rows = await executeSnowflakeQuery(
          connectionId,
          userId,
          `SELECT ${expressions.join(', ')} FROM ${objectName}`
        );
        const row = rows[0] as Record<string, number> | undefined;
        if (row) {
          if (i === 0) totalRows = row['_total_rows'] ?? 0;
          for (const col of batch) {
            if (fields[col]) {
              fields[col].populated = row[`${col}_pop`] ?? 0;
              fields[col].distinct = row[`${col}_dist`] ?? 0;
            }
          }
        }
      } catch {
        // If batch fails, try columns individually
        for (const col of batch) {
          try {
            const rows = await executeSnowflakeQuery(
              connectionId,
              userId,
              `SELECT COUNT("${col}") AS pop, COUNT(DISTINCT "${col}") AS dist FROM ${objectName}`
            );
            if (rows[0] && fields[col]) {
              fields[col].populated = (rows[0] as any).POP ?? 0;
              fields[col].distinct = (rows[0] as any).DIST ?? 0;
            }
          } catch {
            // Column can't be aggregated — leave as 0
          }
        }
      }
    }

    // 4. Sample values
    try {
      const sampleRows = await executeSnowflakeQuery(
        connectionId,
        userId,
        `SELECT * FROM ${objectName} LIMIT 1`
      );
      const sampleRecord = sampleRows[0] as Record<string, unknown> | undefined;
      if (sampleRecord) {
        for (const col of columnNames) {
          const val = sampleRecord[col];
          if (val === null || val === undefined) {
            if (fields[col]) fields[col].sample = null;
          } else if (typeof val === 'object') {
            if (fields[col]) fields[col].sample = JSON.stringify(val);
          } else {
            if (fields[col]) fields[col].sample = String(val);
          }
        }
      }
    } catch {
      // Sample query failed — leave samples as null
    }

    return { totalRows, fields };
  }
}
