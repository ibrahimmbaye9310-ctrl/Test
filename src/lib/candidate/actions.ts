"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { echo, fieldErrorsOf, type ActionState } from "@/lib/validation/common";
import {
  FILE_RULES, applicationSchema, availabilitySchema, preferencesSchema, profileInfoSchema, skillsSchema, validateUpload, type CandidateFileKind,
} from "@/lib/validation/profile";

const SAVED: ActionState = { ok: true, message: "Modifications enregistrées." };
const FAILED: ActionState = { error: "L'enregistrement a échoué. Réessayez." };

async function candidate() {
  return requireUser(["candidate"]);
}

function done() {
  revalidatePath("/espace", "layout");
  return SAVED;
}

export async function updateProfileInfoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await candidate();
  const parsed = profileInfoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: echo(fd) };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: d.fullName, phone: d.phone, city: d.city, postal_code: d.postalCode, headline: d.headline, bio: d.bio })
    .eq("id", user.id);
  return error ? { ...FAILED, values: echo(fd) } : done();
}

export async function updateSkillsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await candidate();
  const parsed = skillsSchema.safeParse({ skills: fd.getAll("skills") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ skills: parsed.data.skills }).eq("id", user.id);
  return error ? FAILED : done();
}

export async function updateAvailabilityAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await candidate();
  const parsed = availabilitySchema.safeParse({ availability: fd.getAll("availability"), availabilityNote: fd.get("availabilityNote") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ availability: parsed.data.availability, availability_note: parsed.data.availabilityNote })
    .eq("id", user.id);
  return error ? FAILED : done();
}

export async function updatePreferencesAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await candidate();
  const parsed = preferencesSchema.safeParse({
    desiredContracts: fd.getAll("desiredContracts"),
    desiredWorkTime: fd.get("desiredWorkTime") || null,
    desiredSectors: fd.getAll("desiredSectors"),
    searchRadiusKm: fd.get("searchRadiusKm") || null,
    openToWork: fd.get("openToWork") === "on",
  });
  if (!parsed.success) return { error: "Préférences invalides." };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      desired_contracts: d.desiredContracts,
      desired_work_time: d.desiredWorkTime,
      desired_sectors: d.desiredSectors,
      search_radius_km: d.searchRadiusKm,
      open_to_work: d.openToWork,
    })
    .eq("id", user.id);
  return error ? FAILED : done();
}

/** Téléversement du CV ou de la photo : taille, type déclaré et signature binaire vérifiés avant stockage. */
export async function uploadFileAction(kind: CandidateFileKind, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await candidate();
  if (kind !== "cv" && kind !== "avatar") return { error: "Type de fichier inconnu." };
  const file = fd.get("file");
  if (!(file instanceof File)) return { error: "Aucun fichier reçu." };
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const invalid = validateUpload(kind, file, head);
  if (invalid) return { error: invalid };

  const rules = FILE_RULES[kind];
  const ext = kind === "cv" ? "pdf" : file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  // Nom aléatoire : une ancienne URL signée ne donne jamais accès au nouveau fichier.
  const path = `${user.id}/${kind}-${crypto.randomUUID()}.${ext}`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage.from(rules.bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "Le téléversement a échoué. Réessayez." };

  const previous = kind === "cv" ? user.profile.cv_path : user.profile.avatar_path;
  const update =
    kind === "cv"
      ? { cv_path: path, cv_filename: file.name.slice(0, 200), cv_updated_at: new Date().toISOString() }
      : { avatar_path: path };
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) {
    await supabase.storage.from(rules.bucket).remove([path]);
    return FAILED;
  }
  if (previous) await supabase.storage.from(rules.bucket).remove([previous]);
  revalidatePath("/espace", "layout");
  return { ok: true, message: kind === "cv" ? "CV enregistré." : "Photo enregistrée." };
}

export async function deleteFileAction(kind: CandidateFileKind): Promise<ActionState> {
  const user = await candidate();
  const path = kind === "cv" ? user.profile.cv_path : user.profile.avatar_path;
  if (!path) return {};
  const supabase = await createClient();
  const update = kind === "cv" ? { cv_path: null, cv_filename: null, cv_updated_at: null } : { avatar_path: null };
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return FAILED;
  await supabase.storage.from(FILE_RULES[kind].bucket).remove([path]);
  revalidatePath("/espace", "layout");
  return { ok: true, message: kind === "cv" ? "CV supprimé." : "Photo supprimée." };
}

export async function toggleSavedJobAction(offerId: string, save: boolean): Promise<ActionState> {
  const user = await requireUser(["candidate"], "/offres");
  if (!/^[0-9a-f-]{36}$/i.test(offerId)) return { error: "Offre invalide." };
  const supabase = await createClient();
  const { error } = save
    ? await supabase.from("saved_jobs").upsert({ candidate_id: user.id, job_offer_id: offerId }, { ignoreDuplicates: true })
    : await supabase.from("saved_jobs").delete().eq("candidate_id", user.id).eq("job_offer_id", offerId);
  if (error) return FAILED;
  revalidatePath("/espace/favoris");
  return { ok: true };
}

export async function applyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser(["candidate"], "/offres");
  const parsed = applicationSchema.safeParse({ offerId: fd.get("offerId"), coverMessage: fd.get("coverMessage") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .insert({ job_offer_id: parsed.data.offerId, candidate_id: user.id, cover_message: parsed.data.coverMessage });
  if (error) {
    if (error.code === "23505") return { error: "Vous avez déjà postulé à cette offre." };
    // RLS : offre non publiée, expirée ou compte non candidat.
    return { error: "Cette offre n'accepte plus de candidatures." };
  }
  revalidatePath("/espace", "layout");
  return { ok: true, message: "Candidature envoyée ! Suivez son avancement depuis votre espace." };
}

export async function withdrawApplicationAction(applicationId: string): Promise<ActionState> {
  const user = await candidate();
  const supabase = await createClient();
  const { data, error } = await supabase.from("applications").delete().eq("id", applicationId).eq("candidate_id", user.id).select("id");
  if (error || !data?.length) return { error: "Cette candidature ne peut plus être retirée." };
  revalidatePath("/espace", "layout");
  return { ok: true, message: "Candidature retirée." };
}

/**
 * Suppression définitive du compte (droit à l'effacement, RGPD art. 17) : fichiers puis compte Auth.
 * La suppression du compte Auth efface en cascade profil, candidatures et favoris.
 */
export async function deleteAccountAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser(["candidate", "recruiter"]);
  if (fd.get("confirm") !== "SUPPRIMER") return { fieldErrors: { confirm: "Tapez SUPPRIMER en majuscules pour confirmer." } };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Suppression momentanément indisponible. Écrivez-nous pour la demander." };
  }
  for (const bucket of ["avatars", "cvs", "logos"] as const) {
    const { data: files } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
    if (files?.length) await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[deleteAccount]", error.message);
    return { error: "La suppression a échoué. Réessayez ou contactez-nous." };
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/compte-supprime");
}
