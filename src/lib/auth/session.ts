import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "@/lib/supabase/database.types";

import { homeForRole, type Role } from "./redirects";

export { homeForRole, safeNextPath } from "./redirects";
export type SessionUser = { id: string; email: string; profile: Profile };

/**
 * Utilisateur courant, vérifié auprès de Supabase (getUser contrôle le jeton côté serveur Auth).
 * Mis en cache pour la durée d'une requête.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  // Toujours rendu à la demande : une page qui dépend de l'utilisateur ne doit jamais être mise en cache.
  await connection();
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;
  return { id: user.id, email: user.email ?? "", profile };
});

/** Page ou action réservée : redirige vers la connexion, ou vers l'espace adapté si le rôle ne convient pas. */
export async function requireUser(roles?: Role[], next = "/espace"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(user.profile.role)) redirect(homeForRole(user.profile.role));
  return user;
}
