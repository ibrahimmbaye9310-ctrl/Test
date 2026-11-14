import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Limites par action (nombre de tentatives / fenêtre en secondes).
 * Complètent les limites intégrées de Supabase Auth, côté application.
 */
export const LIMITS = {
  signIn: { max: 10, window: 900 }, // 10 tentatives / 15 min sur une même adresse e-mail
  signInIp: { max: 50, window: 900 }, // 50 tentatives / 15 min depuis une même IP (réseaux partagés)
  signUp: { max: 20, window: 3600 }, // 20 inscriptions / heure depuis une même IP
  passwordReset: { max: 3, window: 3600 }, // 3 demandes / heure pour une même adresse
  passwordResetIp: { max: 10, window: 3600 },
  apply: { max: 30, window: 3600 }, // 30 candidatures / heure par compte
  upload: { max: 30, window: 3600 },
  report: { max: 10, window: 86400 }, // 10 signalements / jour par compte
  publishOffer: { max: 30, window: 3600 },
} as const;

export type LimitName = keyof typeof LIMITS;

/** Adresse IP du client (en-têtes posés par Vercel / le proxy). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue";
}

/**
 * Empreinte non réversible : aucune IP ni adresse e-mail n'est stockée en clair (RGPD).
 * Le sel RATE_LIMIT_SECRET empêche de recalculer l'empreinte d'une IP connue.
 */
function fingerprint(parts: string[]) {
  const salt = process.env.RATE_LIMIT_SECRET ?? "jobfinder-sel-par-defaut";
  return createHash("sha256").update(`${salt}|${parts.join("|")}`).digest("hex").slice(0, 40);
}

/**
 * true = action autorisée. En cas d'indisponibilité du service, on laisse passer (la RLS et
 * les limites de Supabase Auth restent actives) plutôt que de bloquer tous les utilisateurs.
 */
export async function allow(name: LimitName, ...identity: string[]) {
  if (!isSupabaseConfigured) return true;
  const { max, window } = LIMITS[name];
  const key = `${name}:${fingerprint(identity.map((s) => s.toLowerCase()))}`;
  const supabase = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("check_rate_limit", { bucket_key: key, max_hits: max, window_seconds: window });
  if (error) {
    console.error("[rate-limit]", error.message);
    return true;
  }
  return data === true;
}

export const TOO_MANY = "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
