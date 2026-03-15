import { authenticateAgentRequest } from '@lib/agents/auth';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { NextResponse } from 'next/server';

interface AgentResultRequest {
  job_id: string;
  columns?: string[];
  rows?: Record<string, unknown>[];
  error?: string;
  meta?: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const { agent, error } = await authenticateAgentRequest(req);
    if (!agent) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body: AgentResultRequest = await req.json();
    if (!body.job_id) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    const rows = Array.isArray(body.rows) ? body.rows : [];
    const columns =
      Array.isArray(body.columns) && body.columns.length > 0
        ? body.columns
        : rows.length > 0
          ? Object.keys(rows[0] ?? {})
          : [];

    const supabase = getServiceRoleClient();
    const status = body.error ? 'FAILED' : 'COMPLETED';

    const { error: updateError } = await supabase
      .from('agent_jobs')
      .update({
        status,
        result: body.error
          ? null
          : {
              columns,
              rows,
              totalSize: rows.length,
              meta: body.meta ?? {},
            },
        result_meta: body.meta ?? null,
        error: body.error || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', body.job_id)
      .eq('agent_id', agent.id);

    if (updateError) {
      console.error('Error updating agent job result:', updateError);
      return NextResponse.json({ error: 'Failed to update agent job' }, { status: 500 });
    }

    await supabase
      .from('agents')
      .update({
        status: 'ONLINE',
        last_seen: new Date().toISOString(),
      })
      .eq('id', agent.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error in /agents/result:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
