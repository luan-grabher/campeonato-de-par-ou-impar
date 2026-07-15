import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return createClient(url, publishableKey);
}

/**
 * Cria um client Supabase no servidor com a Secret Key (bypass RLS).
 * Use apenas em Server Actions / API routes que precisam burlar RLS.
 */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    return null;
  }

  return createClient(url, secretKey);
}
