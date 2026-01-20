/**
 * Supabase Client Singleton
 * Provides reusable Supabase clients to prevent connection exhaustion
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instances
let supabaseServiceClient: SupabaseClient | null = null;
let supabaseAnonClient: SupabaseClient | null = null;

/**
 * Get or create service role client (for admin/server operations)
 */
export function getServiceRoleClient(): SupabaseClient {
  if (!supabaseServiceClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    });

    console.log('🔵 Created new Supabase service role client (singleton)');
  }

  return supabaseServiceClient;
}

/**
 * Get or create anon client (for public/client operations)
 */
export function getAnonClient(): SupabaseClient {
  if (!supabaseAnonClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    supabaseAnonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log('🟢 Created new Supabase anon client (singleton)');
  }

  return supabaseAnonClient;
}

/**
 * Reset singleton instances (mainly for testing)
 */
export function resetClients(): void {
  supabaseServiceClient = null;
  supabaseAnonClient = null;
  console.log('🔄 Reset Supabase client singletons');
}
