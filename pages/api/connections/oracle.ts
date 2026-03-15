import { getAuthToken } from '@lib/cookieAuth';
import { getServiceRoleClient } from '@lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceRoleClient();
    const authToken = getAuthToken(req);

    if (!authToken) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    if (req.method === 'GET') {
      const { data: connections, error } = await supabase
        .from('connections')
        .select(
          'id, connection_type, display_name, created_at, oracle_connection_details(agent_id)'
        )
        .eq('user_id', user.id)
        .eq('connection_type', 'oracle')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        connections: (connections || []).map((connection: any) => {
          const details = Array.isArray(connection.oracle_connection_details)
            ? connection.oracle_connection_details[0]
            : connection.oracle_connection_details;

          return {
          id: connection.id,
          connection_type: connection.connection_type,
          display_name: connection.display_name,
          created_at: connection.created_at,
          agent_id: details?.agent_id || null,
          };
        }),
      });
    }

    const { display_name, agent_id } = req.body;

    if (!display_name || !agent_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Verify agent exists and belongs to user (or is accessible)
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    // Create the unified connection object.
    const { data: newConnection, error } = await supabase
      .from('connections')
      .insert({
        user_id: user.id,
        connection_type: 'oracle',
        display_name: display_name,
      })
      .select('id, connection_type, display_name, created_at')
      .single();

    if (error) throw error;

    const { error: detailsError } = await supabase.from('oracle_connection_details').insert({
      connection_id: newConnection.id,
      agent_id,
    });

    if (detailsError) {
      await supabase.from('connections').delete().eq('id', newConnection.id);
      throw detailsError;
    }

    return res.status(200).json({ success: true, connection: newConnection });
  } catch (err: any) {
    console.error('Error creating unified oracle connection:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
