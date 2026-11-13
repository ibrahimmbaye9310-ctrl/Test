import { Callout } from "@/components/ui/misc";

/** Affiché tant que Supabase Auth n'est pas branché (phase 3). Les formulaires restent désactivés : aucune inscription simulée. */
export function AuthPendingNotice() {
  return (
    <Callout className="mb-6">
      Les comptes seront activés à la <strong>phase 3</strong> (Supabase Auth). Le formulaire est présenté mais désactivé :
      aucune inscription n&apos;est simulée.
    </Callout>
  );
}
