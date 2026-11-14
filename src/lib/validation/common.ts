import { z } from "zod";

/** Résultat standard d'une Server Action consommée par useActionState. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Valeurs saisies, renvoyées pour réafficher le formulaire après une erreur (jamais de mot de passe). */
  values?: Record<string, string>;
};

/** Recopie les champs texte d'un formulaire (sauf mots de passe) pour les réafficher. */
export function echo(fd: FormData, exclude: string[] = ["password", "confirm"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string" || exclude.includes(k) || k.startsWith("$ACTION")) continue;
    // Champs à choix multiples (cases à cocher de même nom) : valeurs jointes par des virgules.
    out[k] = k in out ? `${out[k]},${v.slice(0, 3000)}` : v.slice(0, 3000);
  }
  return out;
}

export const initialActionState: ActionState = {};

/** Transforme les erreurs Zod en { champ: premier message }. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Champ texte facultatif : "" devient null. */
export const optionalText = (max: number, label = "Ce champ") =>
  z
    .string()
    .trim()
    .max(max, `${label} : ${max} caractères maximum.`)
    .transform((v) => (v === "" ? null : v));

export const email = z.string().trim().toLowerCase().email("Adresse e-mail invalide.").max(254);

export const password = z
  .string()
  .min(10, "10 caractères minimum.")
  .max(72, "72 caractères maximum.")
  .regex(/[a-zA-Z]/, "Au moins une lettre.")
  .regex(/[0-9]/, "Au moins un chiffre.");
