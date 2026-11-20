"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/form-feedback";
import { openBillingPortalAction, startCheckoutAction } from "@/lib/billing/actions";
import type { ActionState } from "@/lib/validation/common";

export function CheckoutButton({ purchase, label, variant = "primary" }: { purchase: "starter" | "pro" | "single"; label: string; variant?: "primary" | "secondary" | "dark" }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>({});
  return (
    <div className="space-y-2">
      <Button className="w-full" variant={variant} loading={pending} onClick={() => start(async () => setState((await startCheckoutAction(purchase)) ?? {}))}>
        {label}
      </Button>
      <FormMessage state={state} />
    </div>
  );
}

export function PortalButton() {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>({});
  return (
    <div className="space-y-2">
      <Button variant="secondary" loading={pending} onClick={() => start(async () => setState((await openBillingPortalAction()) ?? {}))}>
        Gérer mon abonnement
      </Button>
      <FormMessage state={state} />
    </div>
  );
}
