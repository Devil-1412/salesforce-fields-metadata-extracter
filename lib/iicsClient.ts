/**
 * IICS Client
 *
 * Low-level helper for authenticated Informatica IICS REST API calls.
 * Handles session login, caching, and generic request execution.
 *
 * Login endpoint: POST https://{podRegion}.informaticacloud.com/saas/public/core/v3/login
 * After login the response contains a `sessionId` and a `baseApiUrl` that must
 * be used as the base for every subsequent API call.
 */

import { decrypt } from './encryption';
import { getServiceRoleClient } from './supabaseClient';

// ── Types ──

export interface IICSSession {
  sessionId: string;
  baseApiUrl: string;
  podBaseUrl: string; // Pod region base URL for V3 Platform APIs
}

// Simple in-memory session cache (connectionId → session + timestamp)
const sessionCache = new Map<string, { session: IICSSession; ts: number }>();
const SESSION_TTL = 1000 * 60 * 20; // 20 minutes

// ── Core helpers ──

/**
 * Performs a login to the IICS REST API and returns the session token + base URL.
 */
async function loginToIICS(
  podRegion: string,
  username: string,
  password: string
): Promise<IICSSession> {
  const loginUrl = `https://${podRegion}.informaticacloud.com/saas/public/core/v3/login`;

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`IICS login failed (${response.status}): ${body}`);
  }

  const data = await response.json();

  if (!data.userInfo?.sessionId) {
    throw new Error('IICS login response missing sessionId');
  }

  return {
    sessionId: data.userInfo.sessionId,
    baseApiUrl: data.products?.[0]?.baseApiUrl || `https://${podRegion}.informaticacloud.com`,
    podBaseUrl: `https://${podRegion}.informaticacloud.com/saas`,
  };
}

/**
 * Returns an authenticated IICS session for the given connection.
 * Uses an in-memory cache to avoid repeated logins.
 */
export async function getIICSSession(connectionId: string, userId: string): Promise<IICSSession> {
  // 1. Check cache
  const cached = sessionCache.get(connectionId);
  if (cached && Date.now() - cached.ts < SESSION_TTL) {
    return cached.session;
  }

  // 2. Fetch credentials from Supabase
  const supabase = getServiceRoleClient();
  const { data: conn, error } = await supabase
    .from('connections')
    .select('id, iics_connection_details(username, encrypted_password, pod_region)')
    .eq('id', connectionId)
    .eq('user_id', userId)
    .eq('connection_type', 'iics')
    .single();

  const details = (conn as any)?.iics_connection_details;
  if (error || !details) {
    throw new Error('IICS connection not found or unauthorized');
  }

  // 3. Decrypt password
  let password: string;
  try {
    password = decrypt(details.encrypted_password);
  } catch (e) {
    console.error('Error decrypting IICS password', e);
    throw new Error('Failed to decrypt IICS credentials');
  }

  // 4. Login
  const session = await loginToIICS(details.pod_region, details.username, password);

  // 5. Cache & return
  sessionCache.set(connectionId, { session, ts: Date.now() });
  return session;
}

/**
 * Executes an authenticated GET request against the IICS REST API.
 */
export async function iicsGet<T = any>(
  connectionId: string,
  userId: string,
  path: string
): Promise<T> {
  const session = await getIICSSession(connectionId, userId);
  // Both V2 and V3 resources in Data Integration / Core use baseApiUrl
  const url = `${session.baseApiUrl}${path}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'INFA-SESSION-ID': session.sessionId,
      icSessionId: session.sessionId,
    },
  });

  if (!response.ok) {
    // If 401/403, invalidate cache so next call re-logins
    if (response.status === 401 || response.status === 403) {
      sessionCache.delete(connectionId);
    }
    const body = await response.text();
    throw new Error(`IICS API error (${response.status}): ${body}`);
  }
  const responseData = await response.json();
  return responseData as Promise<T>;
}

/**
 * Executes an authenticated GET request against the IICS REST API and returns raw binary data.
 * Useful for downloading images or zip files.
 */
export async function iicsGetImage(
  connectionId: string,
  userId: string,
  path: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const session = await getIICSSession(connectionId, userId);
  const url = `${session.baseApiUrl}${path}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      // Don't force application/json
      'INFA-SESSION-ID': session.sessionId,
      icSessionId: session.sessionId,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      sessionCache.delete(connectionId);
    }
    const body = await response.text();
    throw new Error(`IICS API error (${response.status}): ${body}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const buffer = await response.arrayBuffer();
  return { buffer, contentType };
}

/**
 * Executes an authenticated POST request against the IICS REST API.
 */
export async function iicsPost<T = any>(
  connectionId: string,
  userId: string,
  path: string,
  body: unknown
): Promise<T> {
  const session = await getIICSSession(connectionId, userId);
  const url = `${session.baseApiUrl}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'INFA-SESSION-ID': session.sessionId,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      sessionCache.delete(connectionId);
    }
    const errBody = await response.text();
    throw new Error(`IICS API error (${response.status}): ${errBody}`);
  }

  return response.json() as Promise<T>;
}
