"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsOf, type ActionState } from "@/lib/validation/common";

const FAILED: ActionState = { error: "L'opération a échoué. Réessayez." };
const uuid = z.string().uuid();

async function admin() {
  const user = await requireUser(["admin"], "/admin");
  return { user, supabase: await createClient() };
}

type Target = "user" | "company" | "offer" | "report" | "testimonial" | "subscription";

/** Chaque action d'administration est tracée (journal non modifiable). */
async function audit(supabase: Awaited<ReturnType<typeof createClient>>, adminId: string, action: string, targetType: Target, targetId: string, details: Record<string, unknown> = {}) {
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, action, target_type: targetType, target_id: targetId, details });
}

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/offres", "layout");
}

// ─── Modération des offres ──────────────────────────────────────────────────
export async function moderateOfferAction(offerId: string, decision: "approve" | "reject" | "close", note?: string): Promise<ActionState> {
  const { user, supabase } = await admin();
  if (!uuid.safeParse(offerId).success) return FAILED;
  const cleanNote = note?.trim().slice(0, 500) || null;
  if (decision === "reject" && !cleanNote) return { fieldErrors: { note: "Indiquez le motif du refus : il est transmis au recruteur." } };
  const update =
    decision === "approve" ? { status: "published" as const, moderation_note: null }
    : decision === "reject" ? { status: "rejected" as const, moderation_note: cleanNote }
    : { status: "closed" as const };
  const { data, error } = await supabase.from("job_offers").update(update).eq("id", offerId).select("id, title");
  if (error || !data?.length) return FAILED;
  await audit(supabase, user.id, `offer.${decision}`, "offer", offerId, { title: data[0]!.title, note: cleanNote });
  refresh();
  return { ok: true, message: decision === "approve" ? "Offre validée : elle est en ligne pour 30 jours." : decision === "reject" ? "Offre refusée. Le recruteur a été prévenu." : "Offre retirée du site." };
}

export async function deleteOfferAdminAction(offerId: string): Promise<ActionState> {
  const { user, supabase } = await admin();
  if (!uuid.safeParse(offerId).success) return FAILED;
  const { data, error } = await supabase.from("job_offers").delete().eq("id", offerId).select("id, title");
  if (error || !data?.length) return FAILED;
  await audit(supabase, user.id, "offer.delete", "offer", offerId, { title: data[0]!.title });
  refresh();
  return { ok: true, message: "Offre supprimée définitivement." };
}

// ─── Entreprises ────────────────────────────────────────────────────────────
export async function setCompanyVerifiedAction(companyId: string, verified: boolean): Promise<ActionState> {
  const { user, supabase } = await admin();
  if (!uuid.safeParse(companyId).success) return FAILED;
  const { data, error } = await supabase.from("companies").update({ is_verified: verified }).eq("id", companyId).select("id, name");
  if (error || !data?.length) return FAILED;
  await audit(supabase, user.id, verified ? "company.verify" : "company.unverify", "company", companyId, { name: data[0]!.name });
  refresh();
  return { ok: true, message: verified ? "Entreprise vérifiée : ses offres seront publiées sans attente." : "Vérification retirée : ses prochaines offres seront contrôlées." };
}

// ─── Comptes ────────────────────────────────────────────────────────────────
export async function setSuspensionAction(userId: string, suspend: boolean, reason?: string): Promise<ActionState> {
  const { user, supabase } = await admin();
  if (!uuid.safeParse(userId).success) return FAILED;
  const clean = reason?.trim().slice(0, 300) || null;
  if (suspend && !clean) return { fieldErrors: { reason: "Indiquez le motif de la suspension." } };
  const { error } = await supabase.rpc("admin_set_suspension", { target: userId, suspend, reason: clean });
  if (error) return { error: error.message.includes("vous-même") ? "Vous ne pouvez pas vous suspendre vous-même." : error.message.includes("administrateur") ? "Un administrateur ne peut pas être suspendu." : FAILED.error };
  await audit(supabase, user.id, suspend ? "user.suspend" : "user.unsuspend", "user", userId, { reason: clean });
  refresh();
  return { ok: true, message: suspend ? "Compte suspendu. Ses offres en ligne ont été retirées." : "Compte réactivé." };
}

export async function deleteUserAction(userId: string): Promise<ActionState> {
  const { user, supabase } = await admin();
  if (!uuid.safeParse(userId).success || userId === user.id) return { error: "Suppression impossible pour ce compte." };
  const { data: target } = await supabase.from("profiles").select("role, full_name").eq("id", userId).maybeSingle();
  if (!target || target.role === "admin") return { error: "Suppression impossible pour ce compte." };
  let service;
  try {
    service = createAdminClient();
  } catch {
    return { error: "Clé SUPABASE_SECRET_KEY manquante : suppression impossible depuis le site." };
  }
  for (const bucket of ["avatars", "cvs", "logos"] as const) {
    const { data: files } = await service.storage.from(bucket).list(userId, { limit: 1000 });
    if (files?.length) await service.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
  }
  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) return FAILED;
  await audit(supabase, user.id, "user.delete", "user", userId, { name: target.full_name });
  refresh();
  return { ok: true, message: "Compte et données supprimés définitivement." };
}

// ─── Signalements ───────────────────────────────────────────────────────────
export async function handleReportAction(reportId: string, status: "reviewing" | "resolved" | "dismissed", note?: string): Promise<ActionState> {
  const { user, supabase } = await admin();
  if (!uuid.safeParse(reportId).success) return FAILED;
  const { data, error } = await supabase
    .from("reports")
    .update({ status, admin_note: note?.trim().slice(0, 1000) || null, resolved_at: status === "resolved" || status === "dismissed" ? new Date().toISOString() : null })
    .eq("id", reportId)
    .select("id, job_offer_id");
  if (error || !data?.length) return FAILED;
  await audit(supabase, user.id, `report.${status}`, "report", reportId, { offer: data[0]!.job_offer_id, note: note ?? null });
  refresh();
  return { ok: true, message: status === "dismissed" ? "Signalement classé sans suite." : status === "resolved" ? "Signalement traité." : "Signalement en cours d'examen." };
}

// ─── Avis ───────────────────────────────────────────────────────────────────
const testimonialSchema = z.object({
  authorName: z.string().trim().min(2, "Prénom (ou prénom + initiale) requis.").max(80),
  authorRole: z.string().trim().min(2, "Précisez le profil (ex. « Étudiante, Créteil »).").max(120),
  quote: z.string().trim().min(20, "20 caractères minimum.").max(600, "600 caractères maximum."),
  consentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date du consentement requise.").refine((d) => new Date(d) <= new Date(), "Date dans le futur."),
  confirm: z.literal("on", { message: "Confirmez que l'avis est authentique et que son auteur a consenti à sa publication." }),
});

export async function createTestimonialAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { user, supabase } = await admin();
  const parsed = testimonialSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const { data, error } = await supabase
    .from("testimonials")
    .insert({ author_name: d.authorName, author_role: d.authorRole, quote: d.quote, consent_at: d.consentAt, is_published: false, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) return FAILED;
  await audit(supabase, user.id, "testimonial.create", "testimonial", data.id, { author: d.authorName });
  refresh();
  return { ok: true, message: "Avis enregistré (non publié). Publiez-le depuis la liste." };
}

export async function setTestimonialPublishedAction(id: string, published: boolean): Promise<ActionState> {
  const { user, supabase } = await admin();
  if (!uuid.safeParse(id).success) return FAILED;
  const { data, error } = await supabase.from("testimonials").update({ is_published: published }).eq("id", id).select("id");
  if (error || !data?.length) return FAILED;
  await audit(supabase, user.id, published ? "testimonial.publish" : "testimonial.unpublish", "testimonial", id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTestimonialAction(id: string): Promise<ActionState> {
  const { user, supabase } = await admin();
  if (!uuid.safeParse(id).success) return FAILED;
  const { data, error } = await supabase.from("testimonials").delete().eq("id", id).select("id");
  if (error || !data?.length) return FAILED;
  await audit(supabase, user.id, "testimonial.delete", "testimonial", id);
  revalidatePath("/", "layout");
  return { ok: true };
}
