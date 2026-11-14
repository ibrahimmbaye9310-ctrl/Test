"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { echo, fieldErrorsOf, type ActionState } from "@/lib/validation/common";
import { companySchema, offerSchema } from "@/lib/validation/offer";
import { FILE_RULES, validateUpload } from "@/lib/validation/profile";
import { APPLICATION_STATUSES } from "@/lib/config/applications";
import { COMMUNES, resolvePlace } from "@/lib/geo/communes";
import { slugify } from "@/lib/utils";
import { getMyCompany } from "./queries";
import { TOO_MANY, allow } from "@/lib/security/rate-limit";

const FAILED: ActionState = { error: "L'enregistrement a échoué. Réessayez." };
/** Limite d'annonces atteinte (contrôlée par la base). */
const QUOTA: ActionState = {
  error: "Limite d'annonces actives atteinte. Fermez une annonce, passez à la formule supérieure ou achetez une annonce à l'unité (page Abonnement).",
};
const isQuota = (e: { message?: string } | null) => Boolean(e?.message?.includes("QUOTA_ATTEINT"));
const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

async function recruiterWithCompany() {
  const user = await requireUser(["recruiter"], "/recruteur");
  const company = await getMyCompany(user.id);
  if (!company) redirect("/recruteur/entreprise");
  return { user, company };
}

function refresh() {
  revalidatePath("/recruteur", "layout");
  revalidatePath("/offres", "layout");
}

// ─── Entreprise ─────────────────────────────────────────────────────────────
export async function saveCompanyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser(["recruiter"], "/recruteur/entreprise");
  const parsed = companySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: echo(fd) };
  const d = parsed.data;
  const supabase = await createClient();
  const existing = await getMyCompany(user.id);
  const fields = { name: d.name, description: d.description, website: d.website, siret: d.siret, city: d.city, postal_code: d.postalCode };

  if (existing) {
    const { error } = await supabase.from("companies").update(fields).eq("id", existing.id);
    if (error) return { ...FAILED, values: echo(fd) };
    refresh();
    return { ok: true, message: "Profil de l'entreprise enregistré." };
  }
  const slug = `${slugify(d.name).slice(0, 60) || "entreprise"}-${crypto.randomUUID().slice(0, 6)}`;
  const { error } = await supabase.from("companies").insert({ ...fields, owner_id: user.id, slug });
  if (error) return { ...FAILED, values: echo(fd) };
  refresh();
  redirect("/recruteur?bienvenue=1");
}

export async function uploadLogoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { user, company } = await recruiterWithCompany();
  if (!(await allow("upload", user.id))) return { error: TOO_MANY };
  const file = fd.get("file");
  if (!(file instanceof File)) return { error: "Aucun fichier reçu." };
  const invalid = validateUpload("logo", file, new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (invalid) return { error: invalid };
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${user.id}/logo-${crypto.randomUUID()}.${ext}`;
  const supabase = await createClient();
  const { error: up } = await supabase.storage.from(FILE_RULES.logo.bucket).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (up) return { error: "Le téléversement a échoué. Réessayez." };
  const { error } = await supabase.from("companies").update({ logo_path: path }).eq("id", company.id);
  if (error) {
    await supabase.storage.from("logos").remove([path]);
    return FAILED;
  }
  if (company.logo_path) await supabase.storage.from("logos").remove([company.logo_path]);
  refresh();
  return { ok: true, message: "Logo enregistré." };
}

export async function deleteLogoAction(): Promise<ActionState> {
  const { company } = await recruiterWithCompany();
  if (!company.logo_path) return {};
  const supabase = await createClient();
  const { error } = await supabase.from("companies").update({ logo_path: null }).eq("id", company.id);
  if (error) return FAILED;
  await supabase.storage.from("logos").remove([company.logo_path]);
  refresh();
  return { ok: true, message: "Logo supprimé." };
}

// ─── Offres ─────────────────────────────────────────────────────────────────
function readOffer(fd: FormData) {
  return {
    title: fd.get("title") ?? "",
    shortDescription: fd.get("shortDescription") ?? "",
    missions: fd.get("missions") ?? "",
    profile: fd.get("profile") ?? "",
    benefits: fd.get("benefits") ?? "",
    contractType: fd.get("contractType") ?? "",
    workTime: fd.get("workTime") ?? "",
    schedules: fd.getAll("schedules"),
    sector: fd.get("sector") ?? "",
    isStudentFriendly: fd.get("isStudentFriendly") === "on",
    salaryMin: fd.get("salaryMin") ?? "",
    salaryMax: fd.get("salaryMax") ?? "",
    salaryPeriod: fd.get("salaryPeriod") || null,
    hoursPerWeek: fd.get("hoursPerWeek") ?? "",
    durationMonths: fd.get("durationMonths") ?? "",
    remote: fd.get("remote") ?? "none",
    location: fd.get("location") ?? "",
    intent: fd.get("intent") ?? "draft",
  };
}

/** Lieu de l'offre : une commune d'Île-de-France précise (pour la recherche par rayon). */
function locateOffer(input: string) {
  const place = resolvePlace(input);
  if (place.kind !== "point") return null;
  const commune =
    COMMUNES.find((c) => c.name === place.label) ??
    COMMUNES.find((c) => place.postalCodes.length === 1 && c.postalCodes.includes(place.postalCodes[0]!));
  if (!commune) return null;
  const postal = /^\d{5}$/.test(input.trim()) && commune.postalCodes.includes(input.trim()) ? input.trim() : commune.postalCodes[0]!;
  return { city: commune.name, postal_code: postal, commune_code: commune.code, lat: commune.lat, lng: commune.lng };
}

export async function saveOfferAction(offerId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const { user, company } = await recruiterWithCompany();
  const values = echo(fd);
  if (!(await allow("publishOffer", user.id))) return { error: TOO_MANY, values };
  const parsed = offerSchema.safeParse(readOffer(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values, error: "Certains champs sont à corriger." };
  const d = parsed.data;
  const where = locateOffer(d.location);
  if (!where) return { fieldErrors: { location: "Commune introuvable en Île-de-France. Choisissez une suggestion de la liste." }, values };

  const row = {
    title: d.title,
    short_description: d.shortDescription,
    missions: d.missions,
    profile: d.profile,
    benefits: d.benefits,
    contract_type: d.contractType,
    work_time: d.workTime,
    schedules: d.schedules,
    sector: d.sector,
    is_student_friendly: d.isStudentFriendly,
    salary_min: d.salaryMin,
    salary_max: d.salaryMax,
    salary_period: d.salaryMin != null ? d.salaryPeriod : null,
    hours_per_week: d.hoursPerWeek,
    duration_months: d.contractType === "cdi" ? null : d.durationMonths,
    remote: d.remote,
    ...where,
  };
  const supabase = await createClient();

  if (offerId) {
    if (!isUuid(offerId)) return FAILED;
    const update = d.intent === "publish" ? { ...row, status: "published" as const } : row;
    const { data, error } = await supabase.from("job_offers").update(update).eq("id", offerId).eq("company_id", company.id).select("id, status");
    if (isQuota(error)) return { ...QUOTA, values };
    if (error || !data?.length) return { ...FAILED, values };
    refresh();
    redirect(`/recruteur/offres/${offerId}?${data[0]!.status === "pending" ? "verification" : "enregistree"}=1`);
  }

  const slug = `${slugify(`${d.title} ${where.city}`).slice(0, 80)}-${crypto.randomUUID().slice(0, 6)}`;
  const { data, error } = await supabase
    .from("job_offers")
    .insert({ ...row, company_id: company.id, slug, status: d.intent === "publish" ? "published" : "draft" })
    .select("id, status")
    .single();
  if (isQuota(error)) return { ...QUOTA, values };
  if (error || !data) {
    console.error("[saveOffer]", error?.message);
    return { ...FAILED, values };
  }
  refresh();
  // Entreprise non vérifiée : la base place l'offre « en vérification » au lieu de la publier.
  redirect(`/recruteur/offres/${data.id}?${data.status === "pending" ? "verification" : data.status === "published" ? "publiee" : "brouillon"}=1`);
}

export async function setOfferStatusAction(offerId: string, status: "published" | "closed" | "draft"): Promise<ActionState> {
  const { company } = await recruiterWithCompany();
  if (!isUuid(offerId) || !["published", "closed", "draft"].includes(status)) return FAILED;
  const supabase = await createClient();
  const { data, error } = await supabase.from("job_offers").update({ status }).eq("id", offerId).eq("company_id", company.id).select("id, status");
  if (isQuota(error)) return QUOTA;
  if (error || !data?.length) return { error: error?.message.includes("modération") ? "Cette offre a été refusée par la modération." : FAILED.error };
  refresh();
  const final = data[0]!.status;
  if (final === "pending") return { ok: true, message: "Offre envoyée en vérification : elle sera en ligne dès sa validation par notre équipe." };
  return { ok: true, message: final === "published" ? "Offre publiée pour 30 jours." : final === "closed" ? "Offre fermée : elle n'apparaît plus dans les résultats." : "Offre repassée en brouillon." };
}

export async function deleteOfferAction(offerId: string): Promise<ActionState> {
  const { company } = await recruiterWithCompany();
  if (!isUuid(offerId)) return FAILED;
  const supabase = await createClient();
  const { data, error } = await supabase.from("job_offers").delete().eq("id", offerId).eq("company_id", company.id).select("id");
  if (error || !data?.length) return FAILED;
  refresh();
  redirect("/recruteur/offres?supprimee=1");
}

// ─── Candidatures ───────────────────────────────────────────────────────────
export async function updateApplicationStatusAction(applicationId: string, status: string): Promise<ActionState> {
  await recruiterWithCompany();
  if (!isUuid(applicationId) || !APPLICATION_STATUSES.some((s) => s.value === status)) return FAILED;
  const supabase = await createClient();
  // La RLS garantit que la candidature concerne une offre de l'entreprise ; seul le statut est modifiable.
  const { data, error } = await supabase
    .from("applications")
    .update({ status: status as (typeof APPLICATION_STATUSES)[number]["value"] })
    .eq("id", applicationId)
    .select("id");
  if (error || !data?.length) return FAILED;
  revalidatePath("/recruteur", "layout");
  return { ok: true, message: "Statut mis à jour. Le candidat le voit dans son espace." };
}
