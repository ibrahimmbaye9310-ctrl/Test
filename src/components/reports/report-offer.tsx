"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage, SubmitButton } from "@/components/forms/form-feedback";
import { reportOfferAction } from "@/lib/reports/actions";
import { REPORT_REASONS } from "@/lib/config/reports";
import { initialActionState } from "@/lib/validation/common";

export function ReportOffer({ offerId, loginHref }: { offerId: string; loginHref: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(reportOfferAction, initialActionState);
  const trigger = "inline-flex items-center gap-1.5 text-xs text-ink-subtle hover:text-danger-600";

  if (loginHref)
    return (
      <Link href={loginHref} className={trigger}>
        <Flag className="size-3.5" aria-hidden /> Signaler cette annonce
      </Link>
    );
  if (state.ok) return <FormMessage state={state} />;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className={trigger}>
        <Flag className="size-3.5" aria-hidden /> Signaler cette annonce
      </button>
    );
  return (
    <ActionForm action={action} pending={isPending} className="space-y-3 rounded-xl bg-navy-50/60 p-4">
      <input type="hidden" name="offerId" value={offerId} />
      <FormMessage state={state} />
      <label htmlFor="report-reason" className="block text-sm font-medium text-navy-900">Motif du signalement</label>
      <Select id="report-reason" name="reason" defaultValue="" aria-invalid={state.fieldErrors?.reason ? true : undefined}>
        <option value="" disabled>Choisir…</option>
        {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      {state.fieldErrors?.reason && <p role="alert" className="text-xs text-danger-600">{state.fieldErrors.reason}</p>}
      <label htmlFor="report-details" className="block text-sm font-medium text-navy-900">Précisions <span className="font-normal text-ink-subtle">(facultatif)</span></label>
      <Textarea id="report-details" name="details" rows={3} maxLength={1000} />
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
        <SubmitButton variant="danger" className="flex-1">Envoyer le signalement</SubmitButton>
      </div>
    </ActionForm>
  );
}
