import type { ReactNode } from "react";
import { Callout } from "@/components/ui/misc";

/** Mise en forme typographique des pages de contenu (légal, aide). */
export function Prose({ children, updatedAt, draft }: { children: ReactNode; updatedAt: string; draft?: boolean }) {
  return (
    <div className="container-page max-w-3xl! py-12 sm:py-16">
      {draft && (
        <Callout tone="warning" className="mb-8">
          <strong>Document en cours de finalisation.</strong> Certaines informations sur l&apos;éditeur du site restent à
          compléter.
        </Callout>
      )}
      <p className="text-sm text-ink-subtle">Dernière mise à jour : {updatedAt}</p>
      <div
        className="mt-6 text-[15px] leading-relaxed text-navy-800 [&_a]:font-medium [&_a]:text-electric-600 [&_a:hover]:underline
          [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-navy-950 [&_li]:mt-1.5 [&_p]:mt-3
          [&_strong]:text-navy-950 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm
          [&_td]:border-t [&_td]:border-line [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_th]:pb-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold"
      >
        {children}
      </div>
    </div>
  );
}
