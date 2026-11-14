"use client";

import { useState, useTransition } from "react";
import { APPLICATION_STATUSES } from "@/lib/config/applications";
import { updateApplicationStatusAction } from "@/lib/recruiter/actions";
import { FormMessage } from "@/components/forms/form-feedback";
import type { ActionState } from "@/lib/validation/common";
import { cn } from "@/lib/utils";

/** Change le statut d'une candidature ; le candidat voit la mise à jour dans son espace. */
export function ApplicationStatusSelect({ applicationId, status }: { applicationId: string; status: string }) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>({});
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Statut de la candidature">
        {APPLICATION_STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={value === s.value}
            disabled={pending}
            onClick={() => {
              if (s.value === value) return;
              const previous = value;
              setValue(s.value);
              start(async () => {
                const res = await updateApplicationStatusAction(applicationId, s.value);
                if (res.error) setValue(previous);
                setState(res);
              });
            }}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition disabled:opacity-60",
              value === s.value ? "bg-navy-900 text-white ring-navy-900" : "bg-surface text-navy-700 ring-line-strong hover:ring-navy-300",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <FormMessage state={state} />
    </div>
  );
}
