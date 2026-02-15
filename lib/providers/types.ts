/**
 * ConnectionProvider Interface
 *
 * All data source providers must implement this interface.
 * This enables provider-agnostic API routes that delegate to the correct provider
 * based on connection_type.
 */

export interface ConnectionProvider {
  /** The connection type identifier (must match the DB enum) */
  readonly type: string;

  /**
   * Tests that the stored credentials can establish a live connection.
   * Used for health checks and re-validation.
   */
  testConnection(connectionId: string, userId: string): Promise<boolean>;

  /**
   * Lists all tables/objects accessible through this connection.
   */
  listTables(connectionId: string, userId: string): Promise<TableInfo[]>;

  /**
   * Gets column/field details for a specific table/object.
   */
  getColumns(connectionId: string, userId: string, tableName: string): Promise<ColumnInfo[]>;

  /**
   * Executes a query (SOQL for Salesforce, SQL for Snowflake, etc.)
   */
  executeQuery(connectionId: string, userId: string, query: string): Promise<QueryResult>;

  /**
   * Returns a full describe of a specific table/object.
   * Includes fields, metadata, and provider-specific properties.
   */
  describeObject(connectionId: string, userId: string, objectName: string): Promise<ObjectDescribe>;

  /**
   * Returns provider-specific metadata for a table/object.
   *   Salesforce: validationRules, triggers, apexClasses, workflows
   *   Snowflake:  constraints, views, sequences, procedures
   */
  getObjectMetadata(
    connectionId: string,
    userId: string,
    objectName: string,
    metadataType: string
  ): Promise<MetadataItem[]>;

  /**
   * Returns the total number of records/rows in a table/object.
   */
  getRecordCount(connectionId: string, userId: string, objectName: string): Promise<number>;

  /**
   * Returns rich, detailed field/column metadata for one or more tables/objects.
   * Salesforce: full describe with 50+ field properties
   * Snowflake:  information_schema.columns with precision, scale, etc.
   */
  getDetailedFields(
    connectionId: string,
    userId: string,
    objectNames: string[]
  ): Promise<Record<string, Record<string, unknown>[]>>;

  /**
   * Returns field-level analysis for a table/object.
   * Includes populated count, distinct count, and sample value for each field.
   * Each provider optimises queries (e.g. batched COUNTs).
   */
  getFieldAnalysis(
    connectionId: string,
    userId: string,
    objectName: string
  ): Promise<FieldAnalysisResult>;
}
// ── Shared Types ──

export interface TableInfo {
  name: string;
  label: string;
  schema?: string;
  rowCount?: number;
  comment?: string;
  custom?: boolean;
}

export interface ColumnInfo {
  name: string;
  label?: string;
  type: string;
  nullable?: boolean;
  defaultValue?: string;
  comment?: string;
  length?: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  totalSize?: number;
}

export interface ObjectDescribe {
  name: string;
  label: string;
  fields: ColumnInfo[];
  /** Provider-specific extra properties (keyPrefix, labelPlural for SF; schema, rowCount for Snowflake) */
  [key: string]: unknown;
}

export interface MetadataItem {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface FieldAnalysisEntry {
  populated: number;
  distinct: number;
  sample: string | null;
}

export interface FieldAnalysisResult {
  totalRows: number;
  fields: Record<string, FieldAnalysisEntry>;
}
