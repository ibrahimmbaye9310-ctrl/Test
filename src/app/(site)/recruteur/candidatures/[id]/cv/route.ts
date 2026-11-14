import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { candidateFileUrl, getMyCompany, getReceivedApplication } from "@/lib/recruiter/queries";

/** Téléchargement du CV d'un candidat ayant postulé : lien signé valable 60 secondes. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "recruiter") return NextResponse.redirect(new URL(`/connexion?suite=/recruteur/candidatures/${id}`, request.url));
  const company = await getMyCompany(user.id);
  const app = company ? await getReceivedApplication(company.id, id) : null;
  const url = app ? await candidateFileUrl("cvs", app.candidate.cv_path, 60) : null;
  if (!url) return NextResponse.json({ error: "CV introuvable ou accès refusé." }, { status: 404 });
  return NextResponse.redirect(url);
}
