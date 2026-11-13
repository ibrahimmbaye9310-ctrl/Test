import Link from "next/link";
import { ArrowUpRight, Clock, GraduationCap, MapPin, Sparkles } from "lucide-react";
import type { JobOfferSummary } from "@/types/job";
import { CONTRACT_TYPES, WORK_TIMES, labelOf } from "@/lib/config/taxonomy";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CompanyAvatar, DemoBadge } from "@/components/ui/misc";
import { cn, formatRelativeDate } from "@/lib/utils";
import { formatSalary } from "./format";

export function JobCard({ offer, className, distanceKm }: { offer: JobOfferSummary; className?: string; distanceKm?: number | null }) {
  const salary = formatSalary(offer);
  return (
    <Card interactive className={cn("group relative flex flex-col p-5", className)}>
      <div className="flex items-start gap-3.5">
        <CompanyAvatar name={offer.companyName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm text-ink-muted">{offer.companyName}</p>
            {offer.isDemo && <DemoBadge />}
          </div>
          <h3 className="mt-0.5 text-base font-semibold leading-snug">
            {/* Le lien couvre toute la carte (pseudo-élément) tout en restant un seul élément focusable. */}
            <Link href={`/offres/${offer.slug}`} className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none">
              {offer.title}
            </Link>
          </h3>
        </div>
        {offer.isFeatured && (
          <Badge tone="electric" className="shrink-0">
            <Sparkles aria-hidden /> À la une
          </Badge>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge tone="dark">{labelOf(CONTRACT_TYPES, offer.contractType)}</Badge>
        <Badge>{labelOf(WORK_TIMES, offer.workTime)}</Badge>
        {offer.isStudentFriendly && (
          <Badge tone="success">
            <GraduationCap aria-hidden /> Étudiant
          </Badge>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">{offer.shortDescription}</p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div className="space-y-1 text-[13px] text-ink-muted">
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-ink-subtle" aria-hidden />
            {offer.city} ({offer.postalCode.slice(0, 2)})
            {distanceKm != null && <span className="text-ink-subtle">· {distanceKm < 1 ? "< 1" : Math.round(distanceKm)} km</span>}
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-ink-subtle" aria-hidden />
            <time dateTime={offer.publishedAt}>{formatRelativeDate(offer.publishedAt)}</time>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {salary && <p className="text-sm font-semibold text-navy-950">{salary}</p>}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-electric-600">
            Voir l&apos;offre
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Card>
  );
}
