"use client";

import { createContext, startTransition, useContext, type ComponentProps } from "react";

const PendingContext = createContext(false);
export const useActionFormPending = () => useContext(PendingContext);

type Props = Omit<ComponentProps<"form">, "action"> & {
  action: (formData: FormData) => void;
  /** Valeur « isPending » renvoyée par useActionState. */
  pending?: boolean;
};

/**
 * Formulaire relié à une Server Action, SANS la réinitialisation automatique de React 19 :
 * après une erreur (ou un enregistrement), chaque champ — listes déroulantes comprises — garde sa saisie.
 * Sans JavaScript, l'attribut action prend le relais (amélioration progressive).
 */
export function ActionForm({ action, pending = false, onSubmit, children, ...props }: Props) {
  return (
    <PendingContext.Provider value={pending}>
      <form
        {...props}
        action={action}
        onSubmit={(e) => {
          onSubmit?.(e);
          if (e.defaultPrevented) return;
          e.preventDefault();
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
          const fd = new FormData(e.currentTarget, submitter);
          startTransition(() => action(fd));
        }}
      >
        {children}
      </form>
    </PendingContext.Provider>
  );
}
