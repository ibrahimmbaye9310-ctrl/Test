import { NextResponse, type NextRequest } from "next/server";
import { suggestPlaces } from "@/lib/geo/communes";

/** Autocomplétion du champ « Ville ou code postal ». Données publiques, réponse mise en cache. */
export function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 60);
  return NextResponse.json(
    { items: suggestPlaces(q) },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
