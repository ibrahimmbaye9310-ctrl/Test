import Image from "next/image";
import { cn } from "@/lib/utils";

/** Photo du candidat (URL signée) ou initiales. */
export function UserAvatar({ name, url, className }: { name: string; url: string | null; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <div className={cn("relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-electric-100 text-sm font-semibold text-electric-700", className)}>
      {url ? <Image src={url} alt="" fill sizes="96px" className="object-cover" unoptimized /> : <span aria-hidden>{initials}</span>}
    </div>
  );
}
