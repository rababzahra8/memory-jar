import { createClient } from "@supabase/supabase-js";

let _admin = null;

export function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  if (!_admin) {
    _admin = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

export function supabaseAdminConfigured() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SECRET_KEY,
  );
}
