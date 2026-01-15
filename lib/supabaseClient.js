/**
 * Supabase Client Singleton
 * Provides reusable Supabase clients to prevent connection exhaustion
 * 
 * Instead of creating new clients per request, we reuse singleton instances
 * This improves performance and prevents connection pool exhaustion under load
 */

import { createClient } from '@supabase/supabase-js';

// Singleton instances
let supabaseServiceClient = null;
let supabaseAnonClient = null;

/**
 * Get or create service role client (for admin/server operations)
 * Reuses the same client instance across all requests
 * 
 * Use this for:
 * - Admin operations (user management, etc.)
 * - Server-side queries that need service role permissions
 * - Most backend API endpoints
 * 
 * @returns {SupabaseClient} - Singleton Supabase service role client
 */
export function getServiceRoleClient() {
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
                schema: 'public'
            }
        });

        console.log('🔵 Created new Supabase service role client (singleton)');
    }

    return supabaseServiceClient;
}

/**
 * Get or create anon client (for public/client operations)
 * Reuses the same client instance across all requests
 * 
 * Use this for:
 * - Public signup operations
 * - Operations that use anon key instead of service role
 * 
 * @returns {SupabaseClient} - Singleton Supabase anon client
 */
export function getAnonClient() {
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
            }
        });

        console.log('🟢 Created new Supabase anon client (singleton)');
    }

    return supabaseAnonClient;
}

/**
 * Reset singleton instances (mainly for testing)
 * Not typically needed in production
 */
export function resetClients() {
    supabaseServiceClient = null;
    supabaseAnonClient = null;
    console.log('🔄 Reset Supabase client singletons');
}
