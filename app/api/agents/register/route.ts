import { createAgentToken, hashOpaqueToken } from '@lib/agents/auth';
import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

/**
 * Request body for Agent Registration
 */
interface RegisterAgentRequest {
  pairing_token: string;
  agent_name?: string;
  version?: string;
}

export async function POST(req: Request) {
  try {
    const body: RegisterAgentRequest = await req.json();

    if (!body.pairing_token) {
      return NextResponse.json({ error: 'Pairing token is required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const pairingTokenHash = hashOpaqueToken(body.pairing_token);
    const now = new Date().toISOString();
    const { data: pairingToken, error: tokenError } = await supabase
      .from('pairing_tokens')
      .select('id, user_id')
      .eq('token_hash', pairingTokenHash)
      .is('used_at', null)
      .gt('expires_at', now)
      .single();

    if (tokenError || !pairingToken) {
      return NextResponse.json({ error: 'Pairing token is invalid or expired' }, { status: 401 });
    }

    // Create new agent in Database
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        user_id: pairingToken.user_id,
        name: body.agent_name?.trim() || 'Oracle Desktop Agent',
        status: 'OFFLINE',
        version: body.version?.trim() || '1.0.0',
      })
      .select('id, name')
      .single();

    if (error || !agent) {
      console.error('Error creating agent:', error);
      return NextResponse.json({ error: 'Failed to register agent' }, { status: 500 });
    }

    const { plainToken, tokenHash } = createAgentToken(agent.id);

    const [{ error: agentUpdateError }, { error: pairingUpdateError }] = await Promise.all([
      supabase.from('agents').update({ token_hash: tokenHash }).eq('id', agent.id),
      supabase
        .from('pairing_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', pairingToken.id),
    ]);

    if (agentUpdateError || pairingUpdateError) {
      console.error('Error finalizing agent registration:', agentUpdateError || pairingUpdateError);
      return NextResponse.json({ error: 'Failed to finalize agent registration' }, { status: 500 });
    }

    return NextResponse.json({
      agent_id: agent.id,
      agent_name: agent.name,
      agent_token: plainToken,
    });
  } catch (error) {
    console.error('API Error in /agents/register:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
