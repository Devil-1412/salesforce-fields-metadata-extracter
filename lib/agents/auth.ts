import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { getServiceRoleClient } from '@lib/supabaseClient';

export interface AgentRecord {
  id: string;
  user_id: string;
  name: string;
  status: string;
  last_seen: string | null;
  version: string | null;
  token_hash: string | null;
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createAgentToken(agentId: string): { plainToken: string; tokenHash: string } {
  const secret = generateOpaqueToken();
  return {
    plainToken: `${agentId}:${secret}`,
    tokenHash: hashOpaqueToken(secret),
  };
}

export function parseAgentToken(token: string): { agentId: string; secret: string } | null {
  const separatorIndex = token.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return null;
  }

  return {
    agentId: token.slice(0, separatorIndex),
    secret: token.slice(separatorIndex + 1),
  };
}

function safeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function authenticateAgentRequest(req: Request): Promise<{
  agent: AgentRecord | null;
  error: string | null;
}> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { agent: null, error: 'Missing agent authorization token' };
  }

  const parsed = parseAgentToken(authHeader.slice('Bearer '.length));
  if (!parsed) {
    return { agent: null, error: 'Invalid agent token format' };
  }

  const supabase = getServiceRoleClient();
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, user_id, name, status, last_seen, version, token_hash')
    .eq('id', parsed.agentId)
    .single();

  if (error || !agent?.token_hash) {
    return { agent: null, error: 'Agent not found or token not configured' };
  }

  const providedHash = hashOpaqueToken(parsed.secret);
  if (!safeEqualHex(agent.token_hash, providedHash)) {
    return { agent: null, error: 'Invalid agent token' };
  }

  return { agent: agent as AgentRecord, error: null };
}
