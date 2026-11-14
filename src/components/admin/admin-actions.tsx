"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { FormMessage } from "@/components/forms/form-feedback";
import type { ActionState } from "@/lib/validation/common";
import {
  deleteOfferAdminAction, deleteTestimonialAction, deleteUserAction, handleReportAction, moderateOfferAction,
  setCompanyVerifiedAction, setSuspensionAction, setTestimonialPublishedAction,
} from "@/lib/admin/actions";

function useRun() {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>({});
  return { pending, state, run: (fn: () => Promise<ActionState>) => start(async () => setState(await fn())) };
}

/** Bouton qui demande une confirmation intégrée (les boîtes confirm() du navigateur sont évitées). */
function Confirm({ label, confirmLabel, danger, pending, onConfirm, children }: { label: string; confirmLabel: string; danger?: boolean; pending: boolean; onConfirm: () => void; children?: ReactNode }) {
  const [ask, setAsk] = useState(false);
  if (!ask) return <Button size="sm" variant={danger ? "ghost" : "secondary"} className={danger ? "text-danger-600 hover:bg-danger-50 hover:text-danger-600" : undefined} onClick={() => setAsk(true)}>{label}</Button>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-navy-50 px-2 py-1 text-xs">
      {children}
      <Button size="sm" variant={danger ? "danger" : "primary"} loading={pending} onClick={onConfirm}>{confirmLabel}</Button>
      <Button size="sm" variant="ghost" onClick={() => setAsk(false)}>Annuler</Button>
    </span>
  );
}

export function ModerateOfferButtons({ offerId, status }: { offerId: string; status: string }) {
  const { pending, state, run } = useRun();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== "published" && status !== "rejected" && <Button size="sm" loading={pending} onClick={() => run(() => moderateOfferAction(offerId, "approve"))}>Valider</Button>}
        {status !== "rejected" && !rejecting && <Button size="sm" variant="secondary" onClick={() => setRejecting(true)}>Refuser</Button>}
        {status === "published" && <Confirm label="Retirer du site" confirmLabel="Retirer" pending={pending} onConfirm={() => run(() => moderateOfferAction(offerId, "close"))} />}
        <Confirm label="Supprimer" confirmLabel="Supprimer définitivement" danger pending={pending} onConfirm={() => run(() => deleteOfferAdminAction(offerId))} />
      </div>
      {rejecting && (
        <div className="space-y-2 rounded-xl bg-navy-50/60 p-3">
          <label htmlFor={`note-${offerId}`} className="text-xs font-medium text-navy-900">Motif du refus (transmis au recruteur)</label>
          <Textarea id={`note-${offerId}`} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          {state.fieldErrors?.note && <p role="alert" className="text-xs text-danger-600">{state.fieldErrors.note}</p>}
          <div className="flex gap-2">
            <Button size="sm" variant="danger" loading={pending} onClick={() => run(() => moderateOfferAction(offerId, "reject", note))}>Confirmer le refus</Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>Annuler</Button>
          </div>
        </div>
      )}
      <FormMessage state={state.fieldErrors ? {} : state} />
    </div>
  );
}

export function CompanyVerifyButton({ companyId, verified }: { companyId: string; verified: boolean }) {
  const { pending, state, run } = useRun();
  return (
    <div className="space-y-1">
      <Button size="sm" variant={verified ? "ghost" : "secondary"} loading={pending} onClick={() => run(() => setCompanyVerifiedAction(companyId, !verified))}>
        {verified ? "Retirer la vérification" : "Vérifier"}
      </Button>
      {state.error && <p role="alert" className="text-xs text-danger-600">{state.error}</p>}
    </div>
  );
}

export function UserAdminButtons({ userId, suspended, isAdmin }: { userId: string; suspended: boolean; isAdmin: boolean }) {
  const { pending, state, run } = useRun();
  const [reason, setReason] = useState("");
  if (isAdmin) return <span className="text-xs text-ink-subtle">Administrateur</span>;
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap justify-end gap-2">
        {suspended ? (
          <Button size="sm" variant="secondary" loading={pending} onClick={() => run(() => setSuspensionAction(userId, false))}>Réactiver</Button>
        ) : (
          <Confirm label="Suspendre" confirmLabel="Suspendre" danger pending={pending} onConfirm={() => run(() => setSuspensionAction(userId, true, reason))}>
            <label className="sr-only" htmlFor={`reason-${userId}`}>Motif</label>
            <input id={`reason-${userId}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif" maxLength={300} className="h-8 w-40 rounded-md bg-surface px-2 text-xs ring-1 ring-line-strong" />
          </Confirm>
        )}
        <Confirm label="Supprimer" confirmLabel="Supprimer le compte" danger pending={pending} onConfirm={() => run(() => deleteUserAction(userId))} />
      </div>
      {(state.error || state.fieldErrors?.reason) && <p role="alert" className="text-right text-xs text-danger-600">{state.error ?? state.fieldErrors?.reason}</p>}
      {state.message && <p role="status" className="text-right text-xs text-success-600">{state.message}</p>}
    </div>
  );
}

export function ReportButtons({ reportId, status }: { reportId: string; status: string }) {
  const { pending, state, run } = useRun();
  const [note, setNote] = useState("");
  return (
    <div className="space-y-2">
      <label htmlFor={`rnote-${reportId}`} className="sr-only">Note interne</label>
      <input id={`rnote-${reportId}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note interne (facultatif)" maxLength={1000} className="h-9 w-full rounded-lg bg-surface px-3 text-sm ring-1 ring-line-strong" />
      <div className="flex flex-wrap gap-2">
        {status === "open" && <Button size="sm" variant="secondary" loading={pending} onClick={() => run(() => handleReportAction(reportId, "reviewing", note))}>Prendre en charge</Button>}
        <Button size="sm" loading={pending} onClick={() => run(() => handleReportAction(reportId, "resolved", note))}>Marquer traité</Button>
        <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => handleReportAction(reportId, "dismissed", note))}>Classer sans suite</Button>
      </div>
      <FormMessage state={state} />
    </div>
  );
}

export function TestimonialButtons({ id, published }: { id: string; published: boolean }) {
  const { pending, state, run } = useRun();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant={published ? "secondary" : "primary"} loading={pending} onClick={() => run(() => setTestimonialPublishedAction(id, !published))}>
        {published ? "Dépublier" : "Publier"}
      </Button>
      <Confirm label="Supprimer" confirmLabel="Supprimer" danger pending={pending} onConfirm={() => run(() => deleteTestimonialAction(id))} />
      {state.error && <p role="alert" className="text-xs text-danger-600">{state.error}</p>}
    </div>
  );
}
