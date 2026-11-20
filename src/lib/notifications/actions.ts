"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

/** Marque une notification (ou toutes) comme lue. La RLS limite aux notifications de l'utilisateur. */
export async function markNotificationsReadAction(id?: string) {
  const user = await requireUser();
  const supabase = await createClient();
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  if (id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return;
    q = q.eq("id", id);
  }
  await q;
  revalidatePath("/espace", "layout");
  revalidatePath("/recruteur", "layout");
}
