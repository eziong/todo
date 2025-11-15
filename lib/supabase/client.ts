// =============================================
// SUPABASE CLIENT CONFIGURATION
// =============================================
// Browser-side Supabase client for client components

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/database/types';

/**
 * Creates a Supabase client for browser-side operations
 * Used in client components and browser-only code
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Export a singleton instance for convenience
export const supabase = createClient();