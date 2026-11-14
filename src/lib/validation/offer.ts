import { z } from "zod";
import { CONTRACT_TYPES, SCHEDULES, SECTORS, WORK_TIMES } from "@/lib/config/taxonomy";
import { optionalText } from "./common";

const enumValues = <T extends readonly { value: string }[]>(list: T) => list.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];

/** Une ligne = un élément (missions, profil, avantages). */
const lines = (label: string) =>
  z
    .string()
    .max(3000)
    .transform((v) => v.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean))
    .pipe(z.array(z.string().max(200, `${label} : 200 caractères maximum par ligne.`)).max(15, `${label} : 15 lignes maximum.`));

const optionalNumber = (min: number, max: number, msg: string) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v.replace(",", ".").replace(/\s/g, "")) : v),
    z.number({ message: msg }).min(min, msg).max(max, msg).nullable(),
  );

export const offerSchema = z
  .object({
    title: z.string().trim().min(3, "Intitulé : 3 caractères minimum.").max(120),
    shortDescription: z.string().trim().min(20, "Description : 20 caractères minimum.").max(400, "Description : 400 caractères maximum."),
    missions: lines("Missions").refine((l) => l.length > 0, "Indiquez au moins une mission."),
    profile: lines("Profil"),
    benefits: lines("Avantages"),
    contractType: z.enum(enumValues(CONTRACT_TYPES), { message: "Choisissez un type de contrat." }),
    workTime: z.enum(enumValues(WORK_TIMES), { message: "Choisissez le temps de travail." }),
    schedules: z.array(z.enum(enumValues(SCHEDULES))).min(1, "Indiquez au moins un horaire."),
    sector: z.enum(enumValues(SECTORS), { message: "Choisissez un secteur." }),
    isStudentFriendly: z.boolean(),
    salaryMin: optionalNumber(1, 500000, "Salaire invalide."),
    salaryMax: optionalNumber(1, 500000, "Salaire invalide."),
    salaryPeriod: z.enum(["hour", "month", "year"]).nullable(),
    hoursPerWeek: optionalNumber(1, 48, "Entre 1 et 48 heures."),
    durationMonths: optionalNumber(1, 36, "Entre 1 et 36 mois."),
    remote: z.enum(["none", "partial", "full"]),
    location: z.string().trim().min(2, "Indiquez la ville ou le code postal.").max(80),
    intent: z.enum(["draft", "publish"]),
  })
  .superRefine((d, ctx) => {
    if (d.salaryMin != null && !d.salaryPeriod) ctx.addIssue({ code: "custom", path: ["salaryPeriod"], message: "Précisez la période (heure, mois, an)." });
    if (d.salaryMax != null && d.salaryMin == null) ctx.addIssue({ code: "custom", path: ["salaryMin"], message: "Indiquez le salaire minimum." });
    if (d.salaryMin != null && d.salaryMax != null && d.salaryMax < d.salaryMin)
      ctx.addIssue({ code: "custom", path: ["salaryMax"], message: "Le maximum doit être supérieur au minimum." });
    if (d.contractType === "cdi" && d.durationMonths != null) ctx.addIssue({ code: "custom", path: ["durationMonths"], message: "Pas de durée pour un CDI." });
    if (d.contractType !== "cdi" && d.durationMonths == null)
      ctx.addIssue({ code: "custom", path: ["durationMonths"], message: "Indiquez la durée du contrat." });
  });

export type OfferInput = z.output<typeof offerSchema>;

export const companySchema = z.object({
  name: z.string().trim().min(2, "Indiquez le nom de l'entreprise.").max(120),
  description: optionalText(3000, "Présentation"),
  website: optionalText(200)
    .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
    .refine((v) => v === null || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v), "Adresse web invalide."),
  siret: optionalText(17)
    .transform((v) => (v ? v.replace(/\s/g, "") : v))
    .refine((v) => v === null || (/^\d{14}$/.test(v) && luhn(v)), "SIRET invalide (14 chiffres)."),
  city: optionalText(80, "Ville"),
  postalCode: optionalText(5).refine((v) => v === null || /^\d{5}$/.test(v), "Code postal à 5 chiffres."),
});

/** Contrôle de clé du SIRET (algorithme de Luhn), sauf exception La Poste (SIREN 356000000). */
export function luhn(digits: string) {
  if (digits.startsWith("356000000")) return [...digits].reduce((s, c) => s + Number(c), 0) % 5 === 0;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let n = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}
