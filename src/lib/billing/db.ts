import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Client utilisé par le webhook Stripe pour écrire la facturation (fonctions billing_*).
 * Production : clé secrète Supabase (rôle service_role). À défaut : clé de facturation dédiée
 * envoyée dans l'en-tête x-billing-key (environnements de test), comparée par la base.
 */
export function billingClient() {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const billingKey = process.env.BILLING_KEY;
  if (!secret && !billingKey) throw new Error("Ni SUPABASE_SECRET_KEY ni BILLING_KEY : impossible d'enregistrer la facturation.");
  return createClient<Database>(supabaseUrl, secret ?? supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: secret ? undefined : { headers: { "x-billing-key": billingKey! } },
  });
}
