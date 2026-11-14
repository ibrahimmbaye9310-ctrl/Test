import type { BadgeTone } from "@/components/ui/badge";

export const OFFER_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  pending: { label: "En vérification", tone: "warning" },
  published: { label: "En ligne", tone: "success" },
  rejected: { label: "Refusée", tone: "danger" },
  closed: { label: "Fermée", tone: "neutral" },
  expired: { label: "Expirée", tone: "warning" },
};

/** Statut affiché : une offre publiée dont la date est dépassée est présentée comme expirée. */
export function displayOfferStatus(status: string, expiresAt: string | null) {
  if (status === "published" && expiresAt && new Date(expiresAt).getTime() <= Date.now()) return OFFER_STATUS.expired!;
  return OFFER_STATUS[status] ?? OFFER_STATUS.draft!;
}
