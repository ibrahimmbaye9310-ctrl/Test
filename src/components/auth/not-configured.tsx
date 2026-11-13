import { Callout } from "@/components/ui/misc";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Prévient (au lieu d'échouer silencieusement) quand les variables Supabase ne sont pas renseignées. */
export function SupabaseNotConfigured() {
  if (isSupabaseConfigured) return null;
  return (
    <Callout tone="warning" className="mb-6">
      Comptes indisponibles : renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
      (voir <code>docs/SUPABASE.md</code>).
    </Callout>
  );
}
