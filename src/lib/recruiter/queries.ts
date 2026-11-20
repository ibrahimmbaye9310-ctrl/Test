import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import type { ApplicationStatusValue, Company, JobOfferRecord, Profile } from "@/lib/supabase/database.types";

export type RecruiterContext = SessionUser & { company: Company };

/** Recruteur connecté ET entreprise créée ; sinon redirection vers la création de l'entreprise. */
export async function requireCompany(next = "/recruteur"): Promise<RecruiterContext> {
  const user = await requireUser(["recruiter"], next);
  const company = await getMyCompany(user.id);
  if (!company) redirect("/recruteur/entreprise");
  return { ...user, company };
}

export async function getMyCompany(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("owner_id", userId).maybeSingle();
  return data;
}

export type OfferWithCounts = JobOfferRecord & { applicationsCount: number; newApplications: number; isExpired: boolean };

export async function getMyOffers(companyId: string): Promise<OfferWithCounts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_offers")
    .select("*, applications(status)")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const now = Date.now();
  return data.map(({ applications, ...o }) => ({
    ...o,
    applicationsCount: (applications as { status: string }[]).length,
    newApplications: (applications as { status: string }[]).filter((a) => a.status === "sent").length,
    isExpired: o.status === "published" && !!o.expires_at && new Date(o.expires_at).getTime() <= now,
  }));
}

export async function getMyOffer(companyId: string, offerId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(offerId)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("job_offers").select("*").eq("id", offerId).eq("company_id", companyId).maybeSingle();
  return data;
}

/** Vues des 30 derniers jours (un point par jour, zéros inclus). */
export async function getOfferViews(offerId: string, days = 30) {
  const supabase = await createClient();
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase.from("offer_daily_views").select("day, views").eq("job_offer_id", offerId).gte("day", since);
  const byDay = new Map((data ?? []).map((d) => [d.day, d.views]));
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day, views: byDay.get(day) ?? 0 };
  });
}

export type ReceivedApplication = {
  id: string;
  status: ApplicationStatusValue;
  createdAt: string;
  statusUpdatedAt: string;
  coverMessage: string | null;
  offer: { id: string; title: string; slug: string };
  candidate: Pick<Profile, "id" | "full_name" | "headline" | "city" | "postal_code" | "phone" | "bio" | "skills" | "availability" | "availability_note" | "desired_contracts" | "desired_work_time" | "cv_path" | "cv_filename" | "avatar_path" | "open_to_work">;
};

const CANDIDATE_FIELDS =
  "id, full_name, headline, city, postal_code, phone, bio, skills, availability, availability_note, desired_contracts, desired_work_time, cv_path, cv_filename, avatar_path, open_to_work";

type Row = {
  id: string; status: ApplicationStatusValue; created_at: string; status_updated_at: string; cover_message: string | null;
  job_offers: { id: string; title: string; slug: string; company_id: string } | null;
  profiles: ReceivedApplication["candidate"] | null;
};

function mapApplication(r: Row): ReceivedApplication | null {
  if (!r.job_offers || !r.profiles) return null;
  return {
    id: r.id, status: r.status, createdAt: r.created_at, statusUpdatedAt: r.status_updated_at, coverMessage: r.cover_message,
    offer: { id: r.job_offers.id, title: r.job_offers.title, slug: r.job_offers.slug },
    candidate: r.profiles,
  };
}

/** Candidatures reçues sur les offres de l'entreprise (RLS : uniquement les siennes). */
export async function getReceivedApplications(companyId: string, filter: { offerId?: string; status?: string } = {}) {
  const supabase = await createClient();
  let q = supabase
    .from("applications")
    .select(`id, status, created_at, status_updated_at, cover_message, job_offers!inner(id, title, slug, company_id), profiles!applications_candidate_id_fkey(${CANDIDATE_FIELDS})`)
    .eq("job_offers.company_id", companyId)
    .order("created_at", { ascending: false });
  if (filter.offerId) q = q.eq("job_offer_id", filter.offerId);
  if (filter.status) q = q.eq("status", filter.status as ApplicationStatusValue);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(mapApplication).filter((a): a is ReceivedApplication => a !== null);
}

export async function getReceivedApplication(companyId: string, applicationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(`id, status, created_at, status_updated_at, cover_message, job_offers!inner(id, title, slug, company_id), profiles!applications_candidate_id_fkey(${CANDIDATE_FIELDS})`)
    .eq("id", applicationId)
    .eq("job_offers.company_id", companyId)
    .maybeSingle();
  return data ? mapApplication(data as unknown as Row) : null;
}

/** URL signée (5 min) d'un fichier d'un candidat ayant postulé. La RLS du stockage vérifie le droit d'accès. */
export async function candidateFileUrl(bucket: "cvs" | "avatars", path: string | null, expiresIn = 300) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
