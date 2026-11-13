/**
 * Configuration Supabase lue depuis l'environnement. Les nouvelles clés (sb_publishable_… / sb_secret_…)
 * et les anciennes (anon / service_role) sont acceptées.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** false tant que les variables ne sont pas renseignées : l'interface l'indique au lieu de planter. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
