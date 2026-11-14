import Link from "next/link";
import { FileText } from "lucide-react";
import type { ReceivedApplication } from "@/lib/recruiter/queries";
import { ApplicationStatusBadge } from "@/components/candidate/application-status-badge";
import { SCHEDULES, labelOf } from "@/lib/config/taxonomy";
import { formatRelativeDate } from "@/lib/utils";

export function ApplicationList({ items, showOffer = true }: { items: ReceivedApplication[]; showOffer?: boolean }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line">
      {items.map((a) => (
        <li key={a.id}>
          <Link href={`/recruteur/candidatures/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition hover:bg-navy-50/50 sm:px-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-electric-100 text-sm font-semibold text-electric-700" aria-hidden>
              {a.candidate.full_name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-navy-950">
                {a.candidate.full_name}
                {a.status === "sent" && <span className="ml-2 rounded-full bg-electric-500 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase text-white">Nouveau</span>}
              </p>
              <p className="truncate text-sm text-ink-muted">
                {[showOffer ? a.offer.title : null, a.candidate.headline, a.candidate.city].filter(Boolean).join(" · ")}
              </p>
              {a.candidate.availability.length > 0 && (
                <p className="mt-0.5 text-xs text-ink-subtle">Disponible : {a.candidate.availability.map((s) => labelOf(SCHEDULES, s).toLowerCase()).join(", ")}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {a.candidate.cv_path && <FileText className="size-4 text-ink-subtle" aria-label="CV joint" />}
              <span className="text-xs text-ink-subtle">{formatRelativeDate(a.createdAt)}</span>
              <ApplicationStatusBadge status={a.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
