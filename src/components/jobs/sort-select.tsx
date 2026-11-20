"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { buildSearchHref, SORTS, type SearchCriteria } from "@/lib/jobs/search-params";
import { cn } from "@/lib/utils";

export function SortSelect({ criteria, canSortByDistance }: { criteria: SearchCriteria; canSortByDistance: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className={cn("flex items-center gap-2 text-sm text-ink-muted", pending && "opacity-60")}>
      <span className="hidden sm:inline">Trier par</span>
      <span className="relative">
      <select
        aria-label="Trier les offres"
        value={criteria.tri === "distance" && !canSortByDistance ? "recent" : criteria.tri}
        onChange={(e) =>
          startTransition(() => router.push(buildSearchHref(criteria, { tri: e.target.value as SearchCriteria["tri"], page: 1 }), { scroll: false }))
        }
        className="h-10 cursor-pointer appearance-none rounded-xl bg-surface pl-3 pr-9 text-sm font-medium text-navy-900 ring-1 ring-inset ring-line-strong focus:outline-none focus:ring-2 focus:ring-electric-500"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value} disabled={s.value === "distance" && !canSortByDistance}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
      </span>
    </label>
  );
}
