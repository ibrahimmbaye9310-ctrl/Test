import { supabaseUrl } from "@/lib/supabase/config";

/** URL publique d'un logo (bucket public « logos »). */
export function logoUrl(path: string | null | undefined) {
  return path && supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/logos/${path.split("/").map(encodeURIComponent).join("/")}` : null;
}
