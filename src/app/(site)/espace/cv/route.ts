import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { signedFileUrl } from "@/lib/candidate/queries";

/** Ouvre le CV du candidat connecté via une URL signée valable 60 secondes (le fichier n'est jamais public). */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/connexion?suite=/espace/profil", request.url));
  const url = await signedFileUrl("cvs", user.profile.cv_path, 60);
  if (!url) return NextResponse.redirect(new URL("/espace/profil#cv", request.url));
  return NextResponse.redirect(url);
}
