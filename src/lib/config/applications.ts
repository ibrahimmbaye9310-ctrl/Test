import type { BadgeTone } from "@/components/ui/badge";

/** Statuts de candidature (valeurs = enum SQL application_status), dans l'ordre du parcours. */
export const APPLICATION_STATUSES = [
  { value: "sent", label: "Envoyée", tone: "neutral", description: "Votre candidature a bien été transmise au recruteur." },
  { value: "reviewing", label: "En cours d'examen", tone: "electric", description: "Le recruteur étudie votre profil." },
  { value: "interview", label: "Entretien", tone: "warning", description: "Le recruteur souhaite vous rencontrer." },
  { value: "accepted", label: "Acceptée", tone: "success", description: "Félicitations, votre candidature est retenue !" },
  { value: "rejected", label: "Refusée", tone: "danger", description: "Le recruteur n'a pas retenu votre candidature cette fois." },
] as const satisfies readonly { value: string; label: string; tone: BadgeTone; description: string }[];

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]["value"];

export function applicationStatus(value: string) {
  return APPLICATION_STATUSES.find((s) => s.value === value) ?? APPLICATION_STATUSES[0];
}
