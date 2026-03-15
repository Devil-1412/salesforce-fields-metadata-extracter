import { randomUUID } from 'crypto';
import { getServiceRoleClient } from '@lib/supabaseClient';

const DEFAULT_JOB_WAIT_MS = 45_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeJobResult(result: any) {
  if (Array.isArray(result)) {
    const columns = result.length > 0 ? Object.keys(result[0] ?? {}) : [];
    return {
      columns,
      rows: result,
      totalSize: result.length,
      meta: {},
    };
  }

  const rows = Array.isArray(result?.rows) ? result.rows : [];
  const columns =
    Array.isArray(result?.columns) && result.columns.length > 0
      ? result.columns
      : rows.length > 0
        ? Object.keys(rows[0] ?? {})
        : [];

  return {
    columns,
    rows,
    totalSize: typeof result?.totalSize === 'number' ? result.totalSize : rows.length,
    meta: result?.meta ?? {},
  };
}

export async function enqueueAgentJob(agentId: string, userId: string, query: string) {
  const supabase = getServiceRoleClient();
  const jobId = randomUUID();

  const { error } = await supabase.from('agent_jobs').insert({
    id: jobId,
    agent_id: agentId,
    requested_by_user_id: userId,
    query,
    status: 'PENDING',
  });

  if (error) {
    throw new Error(`Failed to enqueue Oracle agent job: ${error.message}`);
  }

  return jobId;
}

export async function waitForAgentJob(jobId: string, timeoutMs = DEFAULT_JOB_WAIT_MS) {
  const supabase = getServiceRoleClient();
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { data: job, error } = await supabase
      .from('agent_jobs')
      .select('status, result, result_meta, error')
      .eq('id', jobId)
      .single();

    if (error) {
      throw new Error(`Failed to load Oracle agent job: ${error.message}`);
    }

    if (job.status === 'COMPLETED') {
      const normalized = normalizeJobResult(job.result);
      return {
        ...normalized,
        meta: {
          ...normalized.meta,
          ...(job.result_meta ?? {}),
        },
      };
    }

    if (job.status === 'FAILED') {
      throw new Error(job.error || 'Oracle agent job failed');
    }

    await sleep(DEFAULT_POLL_INTERVAL_MS);
  }

  throw new Error('Oracle agent job timed out while waiting for the desktop agent');
}
