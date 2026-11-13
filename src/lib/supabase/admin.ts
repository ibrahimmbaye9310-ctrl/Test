import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./config";

/**
 * Client « service » : contourne la RLS. À n'utiliser que côté serveur, pour des opérations précises
 * (suppression de compte, webhooks Stripe, tâches admin), après avoir vérifié l'identité de l'appelant.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) throw new Error("SUPABASE_SECRET_KEY manquante : opération serveur impossible.");
  return createSupabaseClient<Database>(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
