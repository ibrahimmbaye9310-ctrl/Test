"use client";

import { useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { SearchCriteria } from "@/lib/jobs/search-params";
import { SearchFilters } from "./search-filters";

/** Filtres en panneau plein écran sur mobile et tablette (<dialog> natif : focus piégé, Échap pour fermer). */
export function MobileFilters({ criteria, canUseRadius, activeCount }: { criteria: SearchCriteria; canUseRadius: boolean; activeCount: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-surface px-4 text-sm font-medium text-navy-900 shadow-xs ring-1 ring-inset ring-line-strong lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filtres
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-electric-500 text-xs font-semibold text-white">{activeCount}</span>
        )}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="mobile-filters-title"
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-surface p-0 backdrop:bg-navy-950/40 backdrop:backdrop-blur-sm open:animate-fade-in"
        onClick={(e) => e.target === ref.current && close()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <h2 id="mobile-filters-title" className="text-lg font-semibold">Filtres</h2>
          <button type="button" onClick={close} aria-label="Fermer les filtres" className="-mr-2 flex size-10 items-center justify-center rounded-lg hover:bg-navy-50">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-6">
          <SearchFilters criteria={criteria} canUseRadius={canUseRadius} autoSubmit={false} onSubmitted={close} idPrefix="m" />
        </div>
      </dialog>
    </>
  );
}
