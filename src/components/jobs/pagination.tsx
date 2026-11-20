import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildSearchHref, type SearchCriteria } from "@/lib/jobs/search-params";
import { cn } from "@/lib/utils";

/** Numéros affichés : 1 … 4 5 6 … 12 */
export function pageWindow(page: number, pageCount: number): (number | "…")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1]! > 1 ? (["…", p] as const) : [p]));
}

export function Pagination({ criteria, page, pageCount }: { criteria: SearchCriteria; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => buildSearchHref(criteria, { page: p });
  const item = "flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "gap-1 text-navy-800 hover:bg-navy-50")} rel="prev">
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Précédent</span>
          <span className="sr-only sm:hidden">Page précédente</span>
        </Link>
      ) : (
        <span className={cn(item, "gap-1 text-ink-subtle")} aria-disabled>
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Précédent</span>
        </span>
      )}
      {pageWindow(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-ink-subtle" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={cn(item, p === page ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50")}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(item, "gap-1 text-navy-800 hover:bg-navy-50")} rel="next">
          <span className="hidden sm:inline">Suivant</span>
          <span className="sr-only sm:hidden">Page suivante</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(item, "gap-1 text-ink-subtle")} aria-disabled>
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
