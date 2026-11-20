"use client";

import { useState, useTransition } from "react";
import { Archive, Eye, Pencil, Rocket, Trash2, Undo2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/form-feedback";
import { deleteOfferAction, setOfferStatusAction } from "@/lib/recruiter/actions";
import type { ActionState } from "@/lib/validation/common";

/** Actions sur une offre : publier, fermer, repasser en brouillon, supprimer (avec confirmation intégrée). */
export function OfferActions({ offerId, slug, status, expired }: { offerId: string; slug: string; status: string; expired: boolean }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const run = (fn: () => Promise<ActionState>) => start(async () => setState(await fn()));
  const online = status === "published" && !expired;
  if (status === "pending" || status === "rejected")
    return (
      <div className="flex flex-wrap items-center gap-2">
        {status === "pending" && <p className="text-sm text-ink-muted">En attente de validation par notre équipe.</p>}
        <ButtonLink href={`/recruteur/offres/${offerId}/modifier`} variant="secondary"><Pencil aria-hidden /> Modifier</ButtonLink>
        {!confirmDelete ? (
          <Button variant="ghost" className="text-danger-600 hover:bg-danger-50 hover:text-danger-600" onClick={() => setConfirmDelete(true)}><Trash2 aria-hidden /> Supprimer</Button>
        ) : (
          <span className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-danger-50 px-3 py-1.5 text-sm text-danger-600" role="alertdialog" aria-label="Confirmer la suppression">
            Supprimer définitivement ?
            <Button size="sm" variant="danger" loading={pending} onClick={() => run(() => deleteOfferAction(offerId))}>Oui, supprimer</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Annuler</Button>
          </span>
        )}
        <FormMessage state={state} />
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {online && <ButtonLink href={`/offres/${slug}`} variant="secondary" target="_blank"><Eye aria-hidden /> Voir en ligne</ButtonLink>}
        <ButtonLink href={`/recruteur/offres/${offerId}/modifier`} variant="secondary"><Pencil aria-hidden /> Modifier</ButtonLink>
        {(status === "draft" || status === "closed" || expired) && (
          <Button loading={pending} onClick={() => run(() => setOfferStatusAction(offerId, "published"))}>
            {!pending && <Rocket aria-hidden />} {expired ? "Republier 30 jours" : "Publier"}
          </Button>
        )}
        {online && (
          <Button variant="secondary" loading={pending} onClick={() => run(() => setOfferStatusAction(offerId, "closed"))}>
            {!pending && <Archive aria-hidden />} Fermer l&apos;offre
          </Button>
        )}
        {status === "closed" && (
          <Button variant="ghost" disabled={pending} onClick={() => run(() => setOfferStatusAction(offerId, "draft"))}>
            <Undo2 aria-hidden /> Repasser en brouillon
          </Button>
        )}
        {!confirmDelete ? (
          <Button variant="ghost" className="text-danger-600 hover:bg-danger-50 hover:text-danger-600" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden /> Supprimer
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-danger-50 px-3 py-1.5 text-sm text-danger-600" role="alertdialog" aria-label="Confirmer la suppression">
            Supprimer définitivement l&apos;offre et ses candidatures ?
            <Button size="sm" variant="danger" loading={pending} onClick={() => run(() => deleteOfferAction(offerId))}>Oui, supprimer</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Annuler</Button>
          </div>
        )}
      </div>
      <FormMessage state={state} />
    </div>
  );
}
