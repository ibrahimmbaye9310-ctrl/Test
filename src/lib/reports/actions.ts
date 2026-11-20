"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { REPORT_REASONS } from "@/lib/config/reports";
import { TOO_MANY, allow } from "@/lib/security/rate-limit";
import { fieldErrorsOf, optionalText, type ActionState } from "@/lib/validation/common";

const schema = z.object({
  offerId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS.map((r) => r.value) as [string, ...string[]], { message: "Choisissez un motif." }),
  details: optionalText(1000, "Précisions"),
});

/** Signalement d'une annonce : traité par la modération (espace administrateur). */
export async function reportOfferAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser(undefined, "/offres");
  const parsed = schema.safeParse({ offerId: fd.get("offerId"), reason: fd.get("reason") ?? "", details: fd.get("details") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  if (!(await allow("report", user.id))) return { error: TOO_MANY };
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    job_offer_id: parsed.data.offerId,
    reporter_id: user.id,
    reason: parsed.data.reason as (typeof REPORT_REASONS)[number]["value"],
    details: parsed.data.details,
  });
  if (error?.code === "23505") return { ok: true, message: "Vous avez déjà signalé cette annonce : notre équipe l'examine." };
  if (error) return { error: "Signalement impossible pour cette annonce." };
  return { ok: true, message: "Merci. Notre équipe de modération va examiner cette annonce." };
}
