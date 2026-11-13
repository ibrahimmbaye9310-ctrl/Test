import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatusValue, Profile } from "@/lib/supabase/database.types";

export type MyApplication = {
  id: string;
  status: ApplicationStatusValue;
  statusUpdatedAt: string;
  createdAt: string;
  coverMessage: string | null;
  offer: { id: string; slug: string; title: string; city: string; contractType: string; status: string; companyName: string } | null;
};

const OFFER_FIELDS = "id, slug, title, city, contract_type, status, companies(name)" as const;

type OfferJoin = { id: string; slug: string; title: string; city: string; contract_type: string; status: string; companies: { name: string } | null } | null;

const mapOffer = (o: OfferJoin) =>
  o ? { id: o.id, slug: o.slug, title: o.title, city: o.city, contractType: o.contract_type, status: o.status, companyName: o.companies?.name ?? "" } : null;

export async function getMyApplications(userId: string): Promise<MyApplication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(`id, status, status_updated_at, created_at, cover_message, job_offers(${OFFER_FIELDS})`)
    .eq("candidate_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((a) => ({
    id: a.id,
    status: a.status,
    statusUpdatedAt: a.status_updated_at,
    createdAt: a.created_at,
    coverMessage: a.cover_message,
    offer: mapOffer(a.job_offers as OfferJoin),
  }));
}

export async function getMySavedJobs(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_jobs")
    .select(`created_at, job_offers(${OFFER_FIELDS})`)
    .eq("candidate_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((s) => ({ savedAt: s.created_at, offer: mapOffer(s.job_offers as OfferJoin) })).filter((s) => s.offer !== null);
}

/** État de la relation candidat ↔ offre (pour la page offre). */
export async function getOfferInteraction(userId: string, offerId: string) {
  const supabase = await createClient();
  const [saved, applied] = await Promise.all([
    supabase.from("saved_jobs").select("job_offer_id").eq("candidate_id", userId).eq("job_offer_id", offerId).maybeSingle(),
    supabase.from("applications").select("id, status, created_at").eq("candidate_id", userId).eq("job_offer_id", offerId).maybeSingle(),
  ]);
  return { saved: Boolean(saved.data), application: applied.data };
}

/** URL signée de courte durée pour un fichier privé du candidat. */
export async function signedFileUrl(bucket: "avatars" | "cvs", path: string | null, expiresIn = 3600) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

/** Taux de complétion du profil et éléments manquants (affichés sur le tableau de bord). */
export function profileCompletion(p: Profile) {
  const checks = [
    { done: Boolean(p.cv_path), label: "Ajouter votre CV", href: "/espace/profil#cv" },
    { done: p.availability.length > 0, label: "Indiquer vos disponibilités", href: "/espace/profil#disponibilites" },
    { done: p.skills.length >= 3, label: "Renseigner au moins 3 compétences", href: "/espace/profil#competences" },
    { done: Boolean(p.city && p.phone), label: "Compléter vos coordonnées", href: "/espace/profil#informations" },
    { done: p.desired_contracts.length > 0, label: "Préciser le contrat recherché", href: "/espace/profil#preferences" },
    { done: Boolean(p.headline), label: "Ajouter un titre de profil", href: "/espace/profil#informations" },
  ];
  const done = checks.filter((c) => c.done).length;
  return { percent: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c.done) };
}
