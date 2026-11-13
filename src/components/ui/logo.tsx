import Link from "next/link";
import { cn } from "@/lib/utils";

/** Monogramme : un "J" stylisé dans une pastille bleu nuit avec un point bleu électrique (le « bon moment »). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-navy-900" />
      <path d="M18.5 8.5v10a4.5 4.5 0 0 1-9 0" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23" cy="9" r="2.6" className="fill-electric-400" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="JobFinder — accueil">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className={cn("text-[17px] font-semibold tracking-tight", inverted ? "text-white" : "text-navy-950")}>
        JobFinder
      </span>
    </Link>
  );
}
