/**
 * POST /api/connections/[id]/columns-batch
 *
 * Returns columns/fields for multiple tables in a single API call.
 * Body: { tables: ["Account", "Contact", ...] }
 *
 * Used by the query editor to batch-fetch schema for autocomplete.
 */

import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { getProvider } from '@lib/providers/registry';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

const MAX_TABLES_PER_BATCH = 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing connection ID' });
  }

  const { tables } = req.body || {};
  if (!Array.isArray(tables) || tables.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing or empty tables array' });
  }

  if (tables.length > MAX_TABLES_PER_BATCH) {
    return res.status(400).json({
      success: false,
      error: `Too many tables in one batch (max ${MAX_TABLES_PER_BATCH})`,
    });
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

    const provider = getProvider(connection.connection_type, req, res);

    // Fetch columns for each table in parallel
    const results: Record<string, unknown[]> = {};
    const errors: Record<string, string> = {};

    await Promise.allSettled(
      tables.map(async (tableName: string) => {
        try {
          const columns = await provider.getColumns(id, user.id, tableName);
          results[tableName] = columns;
        } catch (err) {
          errors[tableName] = (err as Error).message;
        }
      })
    );

    return res.status(200).json({
      success: true,
      columns: results,
      ...(Object.keys(errors).length > 0 && { errors }),
    });
  } catch (err) {
    return handleApiError(err, req, res, 'connection-columns-batch');
  }
}
