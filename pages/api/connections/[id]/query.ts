/**
 * POST /api/connections/[id]/query
 *
 * Executes a read-only query on any connection type.
 * Body: { query: "SELECT ...", limit?: number, offset?: number }
 *
 * - Validates query is read-only (no DML/DDL)
 * - Injects LIMIT/OFFSET for pagination if not present
 * - Delegates to the correct provider (Salesforce → SOQL, Snowflake → SQL)
 */

import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { getProvider } from '@lib/providers/registry';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { validateReadOnly } from '@lib/validation/queryValidator';
import type { NextApiRequest, NextApiResponse } from 'next';

const DEFAULT_LIMIT = 250;
const MAX_LIMIT = 2000;

function applyPagination(query: string, connectionType: string, limit: number, offset: number) {
  let paginatedQuery = query.trimEnd().replace(/;+$/, '');
  const upperQuery = paginatedQuery.toUpperCase();

  if (connectionType === 'oracle') {
    if (!upperQuery.includes(' FETCH ') && !upperQuery.includes(' OFFSET ')) {
      paginatedQuery += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    } else if (!upperQuery.includes(' FETCH ')) {
      paginatedQuery += ` FETCH NEXT ${limit} ROWS ONLY`;
    }

    return paginatedQuery;
  }

  if (!upperQuery.includes('LIMIT')) {
    paginatedQuery += ` LIMIT ${limit}`;
  }
  if (!upperQuery.includes('OFFSET') && offset > 0) {
    paginatedQuery += ` OFFSET ${offset}`;
  }

  return paginatedQuery;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing connection ID' });
  }

  const { query, limit, offset } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing query field in request body' });
  }

  // ── Read-only validation ──
  const validation = validateReadOnly(query);
  if (!validation.safe) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  try {
    const supabase = getServiceRoleClient();

    const authToken = getAuthToken(req);
    if (!authToken) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authToken);
    if (authError || !user) return res.status(401).json({ success: false, error: 'Invalid token' });

    // Get connection type
    const { data: connection, error: connError } = await supabase
      .from('connections')
      .select('connection_type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    const pageLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);
    const pageOffset = Math.max(0, Number(offset) || 0);
    const paginatedQuery = applyPagination(query, connection.connection_type, pageLimit, pageOffset);

    const provider = getProvider(connection.connection_type, req, res);
    const result = await provider.executeQuery(id, user.id, paginatedQuery);

    return res.status(200).json({
      success: true,
      ...result,
      pagination: {
        limit: pageLimit,
        offset: pageOffset,
        hasMore: (result.rows?.length ?? 0) >= pageLimit,
      },
    });
  } catch (err) {
    return handleApiError(err, req, res, 'connection-query');
  }
}
