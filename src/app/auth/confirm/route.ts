import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/session";

/**
 * Point d'arrivée des liens envoyés par e-mail (confirmation d'inscription, réinitialisation du mot de passe).
 * Gère les deux formats Supabase : ?code=… (PKCE) et ?token_hash=…&type=… (modèles d'e-mail personnalisés).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("suite"), "/espace");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  if (!ok) return NextResponse.redirect(`${origin}/connexion?erreur=lien`);
  const target = type === "recovery" ? "/mot-de-passe/nouveau" : next;
  return NextResponse.redirect(`${origin}${target}`);
}
