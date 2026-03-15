import { enqueueAgentJob, waitForAgentJob } from '@lib/agents/jobs';
import { getAppRouteUser } from '@lib/appRouteAuth';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { validateReadOnly } from '@lib/validation/queryValidator';
import { NextResponse } from 'next/server';

interface QueryRequest {
  agent_id: string;
  query: string;
}

export async function POST(req: Request) {
  try {
    const body: QueryRequest = await req.json();

    if (!body.agent_id || !body.query) {
      return NextResponse.json({ error: 'agent_id and query are required' }, { status: 400 });
    }

    const validation = validateReadOnly(body.query);
    if (!validation.safe) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { user, error: authError } = await getAppRouteUser();
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    const staleCutoff = new Date(Date.now() - 30_000).toISOString();
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, last_seen')
      .eq('id', body.agent_id)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (!agent.last_seen || agent.last_seen < staleCutoff) {
      return NextResponse.json({ error: 'Agent is offline' }, { status: 409 });
    }

    const jobId = await enqueueAgentJob(agent.id, user.id, body.query);
    const result = await waitForAgentJob(jobId);

    return NextResponse.json({ success: true, ...result, job_id: jobId });
  } catch (error: any) {
    console.error('API Error in /agents/query:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
