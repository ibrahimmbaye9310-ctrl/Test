import Link from "next/link";
import { cn } from "@/lib/utils";

/** Monogramme : un « K » dont la branche basse mène au point bleu électrique — le « bon moment » (kairos). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-navy-900" />
      <path d="M11 8.5v15M20.5 8.5l-8 7.6M15.2 14.1l4.9 5.1" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22.6" cy="22.6" r="2.6" className="fill-electric-400" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="Kairo — accueil">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className={cn("text-[17px] font-semibold tracking-tight", inverted ? "text-white" : "text-navy-950")}>
        Kairo
      </span>
    </Link>
  );
}
