import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./config";

/**
 * Client anonyme sans cookies, pour les lectures publiques (offres publiées). N'ayant pas de session,
 * il ne voit que ce que la RLS autorise aux visiteurs, et les pages publiques restent mises en cache.
 */
export function createPublicClient() {
  if (!isSupabaseConfigured) return null;
  return createClient<Database>(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
