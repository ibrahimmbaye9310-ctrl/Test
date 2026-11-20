import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Export des données personnelles (RGPD art. 15 et 20) au format JSON lisible par machine.
 * Les fichiers (CV, photo) sont fournis via des liens signés valables 24 h.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const supabase = await createClient();

  const [applications, saved] = await Promise.all([
    supabase.from("applications").select("id, status, cover_message, created_at, status_updated_at, job_offers(title, city, slug)").eq("candidate_id", user.id),
    supabase.from("saved_jobs").select("created_at, job_offers(title, city, slug)").eq("candidate_id", user.id),
  ]);
  const sign = async (bucket: "avatars" | "cvs", path: string | null) =>
    path ? (await supabase.storage.from(bucket).createSignedUrl(path, 86_400)).data?.signedUrl ?? null : null;

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: user.profile,
    files: { cv: await sign("cvs", user.profile.cv_path), photo: await sign("avatars", user.profile.avatar_path) },
    applications: applications.data ?? [],
    saved_jobs: saved.data ?? [],
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kairo-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
