import "server-only";
import { Resend } from "resend";
import type { Email } from "./templates";

/**
 * Envoi via Resend. Un e-mail ne doit jamais faire échouer l'action de l'utilisateur :
 * les erreurs sont journalisées, pas propagées.
 * EMAIL_REDIRECT_TO (préproduction / tests) : tous les e-mails partent vers cette adresse.
 */
export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY);

let client: Resend | null = null;

export async function sendEmail(to: string | null | undefined, email: Email, tag: string): Promise<{ id?: string; skipped?: string; error?: string }> {
  if (!to) return { skipped: "destinataire inconnu" };
  if (!process.env.RESEND_API_KEY) return { skipped: "RESEND_API_KEY absente" };
  client ??= new Resend(process.env.RESEND_API_KEY);
  const redirect = process.env.EMAIL_REDIRECT_TO;
  try {
    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM ?? "Kairo <onboarding@resend.dev>",
      to: redirect || to,
      subject: redirect ? `[test → ${to}] ${email.subject}` : email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: "type", value: tag }],
      headers: { "X-Entity-Ref-ID": `${tag}-${Date.now()}` },
    });
    if (error) {
      console.error(`[email:${tag}]`, error.message);
      return { error: error.message };
    }
    // Journal sans donnée personnelle : type d'e-mail et identifiant Resend (traçable dans le tableau de bord Resend).
    console.info(`[email:${tag}] envoyé ${data?.id}`);
    return { id: data?.id };
  } catch (e) {
    console.error(`[email:${tag}]`, e instanceof Error ? e.message : e);
    return { error: "envoi impossible" };
  }
}
