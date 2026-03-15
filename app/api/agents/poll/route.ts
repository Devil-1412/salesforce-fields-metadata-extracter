import { authenticateAgentRequest } from '@lib/agents/auth';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { agent, error } = await authenticateAgentRequest(req);
    if (!agent) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    const version = req.headers.get('x-agent-version');

    await supabase
      .from('agents')
      .update({
        status: 'ONLINE',
        last_seen: new Date().toISOString(),
        ...(version ? { version } : {}),
      })
      .eq('id', agent.id);

    const { data, error: rpcError } = await supabase.rpc('claim_next_agent_job', {
      p_agent_id: agent.id,
    });

    if (rpcError) {
      console.error('Error claiming agent job:', rpcError);
      return NextResponse.json({ error: 'Failed to claim next job' }, { status: 500 });
    }

    const job = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
      },
      job: job
        ? {
            id: job.id,
            query: job.query,
            created_at: job.created_at,
          }
        : null,
    });
  } catch (error) {
    console.error('API Error in /agents/poll:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
