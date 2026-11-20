import { z } from "zod";
import { CONTRACT_TYPES, RADIUS_OPTIONS, SCHEDULES, SECTORS, WORK_TIMES } from "@/lib/config/taxonomy";
import { optionalText } from "./common";

const enumValues = <T extends readonly { value: string }[]>(list: T) => list.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];

export const profileInfoSchema = z.object({
  fullName: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  phone: optionalText(20).refine((v) => v === null || /^\+?[0-9 .-]{6,20}$/.test(v), "Numéro de téléphone invalide."),
  city: optionalText(80, "Ville"),
  postalCode: optionalText(5).refine((v) => v === null || /^\d{5}$/.test(v), "Code postal à 5 chiffres."),
  headline: optionalText(140, "Titre"),
  bio: optionalText(2000, "Présentation"),
});

export const skillsSchema = z.object({
  skills: z
    .array(z.string().trim().min(1).max(40, "Compétence : 40 caractères maximum."))
    .max(30, "30 compétences maximum.")
    // Doublons (sans tenir compte de la casse) : on garde la première saisie.
    .transform((list) => list.filter((s, i) => list.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i)),
});

export const availabilitySchema = z.object({
  availability: z.array(z.enum(enumValues(SCHEDULES))),
  availabilityNote: optionalText(300, "Précision"),
});

export const preferencesSchema = z.object({
  desiredContracts: z.array(z.enum(enumValues(CONTRACT_TYPES))),
  desiredWorkTime: z.enum(enumValues(WORK_TIMES)).nullable(),
  desiredSectors: z.array(z.enum(enumValues(SECTORS))),
  searchRadiusKm: z.coerce
    .number()
    .refine((n) => (RADIUS_OPTIONS as readonly number[]).includes(n))
    .nullable(),
  openToWork: z.boolean(),
});

export const applicationSchema = z.object({
  offerId: z.string().uuid("Offre invalide."),
  coverMessage: optionalText(3000, "Message"),
});

/** Fichiers : contrôle de taille, de type déclaré ET de signature binaire (on ne fait pas confiance à l'extension). */
export const FILE_RULES = {
  cv: { bucket: "cvs", maxBytes: 4 * 1024 * 1024, mime: ["application/pdf"], label: "PDF, 4 Mo maximum" },
  avatar: { bucket: "avatars", maxBytes: 2 * 1024 * 1024, mime: ["image/jpeg", "image/png", "image/webp"], label: "JPG, PNG ou WebP, 2 Mo maximum" },
  logo: { bucket: "logos", maxBytes: 1024 * 1024, mime: ["image/jpeg", "image/png", "image/webp"], label: "JPG, PNG ou WebP, 1 Mo maximum" },
} as const;

export type FileKind = keyof typeof FILE_RULES;
export type CandidateFileKind = Exclude<FileKind, "logo">;

/** Détecte le vrai format à partir des premiers octets. */
export function sniffMime(bytes: Uint8Array): string | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp"; // RIFF....WEBP
  return null;
}

export function validateUpload(kind: FileKind, file: { size: number; type: string }, head: Uint8Array): string | null {
  const rules = FILE_RULES[kind];
  if (file.size === 0) return "Le fichier est vide.";
  if (file.size > rules.maxBytes) return `Fichier trop lourd (${rules.label}).`;
  const real = sniffMime(head);
  if (!real || !(rules.mime as readonly string[]).includes(real)) return `Format non accepté (${rules.label}).`;
  return null;
}
