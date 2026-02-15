/**
 * Hardened read-only query validator.
 *
 * Strips comments and string literals before scanning so that payloads
 * hidden inside `/* … *​/` or `'...'` cannot bypass the checks.
 */

// ── Dangerous keywords (word-boundary matched) ─────────────────────
const DANGEROUS_KEYWORDS = [
  // Standard SQL DML / DDL
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'REPLACE',
  'MERGE',
  'UPSERT',

  // Privilege management
  'GRANT',
  'REVOKE',

  // Execution / procedures
  'EXEC',
  'EXECUTE',
  'CALL',

  // Snowflake-specific data movement
  'COPY',
  'PUT',
  'GET',
  'UNLOAD',
  'REMOVE',
  'LIST',

  // Transaction control
  'COMMIT',
  'ROLLBACK',
  'BEGIN',
  'SAVEPOINT',
];

const ALLOWED_STARTERS = ['SELECT', 'WITH', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'DESC'];

// ── Helpers ─────────────────────────────────────────────────────────

/** Remove all block comments (handles nested) */
function stripBlockComments(sql: string): string {
  let result = '';
  let i = 0;
  let depth = 0;

  while (i < sql.length) {
    if (sql[i] === '/' && sql[i + 1] === '*') {
      depth++;
      i += 2;
    } else if (sql[i] === '*' && sql[i + 1] === '/') {
      depth = Math.max(0, depth - 1);
      i += 2;
    } else if (depth === 0) {
      result += sql[i];
      i++;
    } else {
      i++;
    }
  }

  return result;
}

/** Remove all single-line comments (-- …) */
function stripLineComments(sql: string): string {
  return sql.replace(/--.*$/gm, '');
}

/** Replace string literals with empty strings to avoid false positives */
function stripStringLiterals(sql: string): string {
  // Handles both 'single' and "double" quoted strings, including escaped quotes
  return sql.replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/"(?:[^"\\]|\\.)*"/g, '""');
}

// ── Main validator ──────────────────────────────────────────────────

export interface ValidationResult {
  safe: boolean;
  error?: string;
}

/**
 * Validates that a query is read-only.
 *
 * 1. Strips block comments (including nested)
 * 2. Strips line comments (--)
 * 3. Strips string literals (to avoid false positives)
 * 4. Rejects multiple statements (semicolon-separated)
 * 5. Checks first token is an allowed read-only keyword
 * 6. Scans for dangerous DML/DDL keywords using word boundaries
 */
export function validateReadOnly(query: string): ValidationResult {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { safe: false, error: 'Query is empty' };
  }

  // Step 1–3: Clean the query for safe analysis
  let cleaned = stripBlockComments(query);
  cleaned = stripLineComments(cleaned);
  const noStrings = stripStringLiterals(cleaned);

  // Step 4: Reject multiple statements
  const statements = noStrings
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (statements.length > 1) {
    return {
      safe: false,
      error: 'Multiple statements are not allowed. Submit one query at a time.',
    };
  }

  // Step 5: First meaningful token must be a read-only keyword
  const firstToken = noStrings.trim().split(/\s+/)[0]?.toUpperCase();

  if (!firstToken || !ALLOWED_STARTERS.includes(firstToken)) {
    return {
      safe: false,
      error: `Only read-only queries are allowed. Query must start with: ${ALLOWED_STARTERS.join(', ')}`,
    };
  }

  // Step 6: Scan for dangerous keywords (word-boundary check)
  for (const keyword of DANGEROUS_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(noStrings)) {
      return {
        safe: false,
        error: `"${keyword}" operations are not allowed. Only read-only queries are permitted.`,
      };
    }
  }

  return { safe: true };
}
