"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { siteConfig } from "@/lib/config/site";
import { echo, fieldErrorsOf, type ActionState } from "@/lib/validation/common";
import { newPasswordSchema, resetRequestSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";
import { homeForRole, safeNextPath } from "./session";

const NOT_CONFIGURED = (fd: FormData): ActionState => ({ error: "Les comptes ne sont pas encore activés sur ce site (Supabase non configuré).", values: echo(fd) });
const data = (fd: FormData) => Object.fromEntries(fd.entries());

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED(formData);
  const parsed = signUpSchema.safeParse(data(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: echo(formData) };
  const { email, password, fullName, role, companyName } = parsed.data;

  const supabase = await createClient();
  const { data: signUp, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteConfig.url}/auth/confirm?suite=${role === "recruiter" ? "/recruteur" : "/espace"}`,
      // Le rôle est relu par un trigger SQL qui refuse toute valeur autre que candidate/recruiter.
      data: { full_name: fullName, role, ...(role === "recruiter" && { company_name: companyName }) },
    },
  });
  if (error) {
    if (error.code === "weak_password") return { fieldErrors: { password: "Mot de passe trop faible ou trop courant." }, values: echo(formData) };
    if (error.status === 429) return { error: "Trop de tentatives. Réessayez dans quelques minutes.", values: echo(formData) };
    console.error("[signUp]", error.code, error.message);
    return { error: "L'inscription a échoué. Réessayez dans un instant.", values: echo(formData) };
  }
  // Confirmation par e-mail désactivée dans Supabase : l'utilisateur est déjà connecté.
  if (signUp.session) redirect(homeForRole(role));
  // Message identique que l'adresse existe déjà ou non (pas d'énumération des comptes).
  redirect(`/inscription/confirmation?email=${encodeURIComponent(email)}`);
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED(formData);
  const parsed = signInSchema.safeParse(data(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: echo(formData) };

  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !auth.user) {
    const values = echo(formData);
    if (error?.code === "email_not_confirmed") return { error: "Confirmez d'abord votre adresse e-mail grâce au lien reçu.", values };
    if (error?.status === 429) return { error: "Trop de tentatives. Réessayez dans quelques minutes.", values };
    return { error: "Adresse e-mail ou mot de passe incorrect.", values };
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).single();
  const home = homeForRole(profile?.role ?? "candidate");
  redirect(safeNextPath(formData.get("suite"), home));
}

export async function signOutAction() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordResetAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED(formData);
  const parsed = resetRequestSchema.safeParse(data(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: echo(formData) };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteConfig.url}/auth/confirm?suite=/mot-de-passe/nouveau`,
  });
  if (error?.status === 429) return { error: "Trop de demandes. Réessayez dans quelques minutes." };
  // Toujours le même message, que le compte existe ou non.
  return { ok: true, message: "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé." };
}

export async function updatePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED(formData);
  const parsed = newPasswordSchema.safeParse(data(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: echo(formData) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Lien expiré. Refaites une demande de réinitialisation." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { fieldErrors: { password: "Choisissez un mot de passe différent de l'actuel." } };
    if (error.code === "weak_password") return { fieldErrors: { password: "Mot de passe trop faible ou trop courant." } };
    return { error: "La modification a échoué. Réessayez." };
  }
  return { ok: true, message: "Votre mot de passe a été modifié." };
}
