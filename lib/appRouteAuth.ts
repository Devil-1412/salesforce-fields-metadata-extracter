import AUTH_CONFIG from '@lib/auth.config';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { headers, cookies } from 'next/headers';

export async function getAppRouteAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(AUTH_CONFIG.ACCESS_TOKEN_COOKIE)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  const headerStore = await headers();
  const authHeader = headerStore.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  return null;
}

export async function getAppRouteUser() {
  const token = await getAppRouteAuthToken();
  if (!token) {
    return { user: null, token: null, error: 'Not authenticated' };
  }

  const supabase = getServiceRoleClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, token: null, error: 'Invalid token' };
  }

  return { user, token, error: null };
}
