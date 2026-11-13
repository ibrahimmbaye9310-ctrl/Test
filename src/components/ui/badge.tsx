import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-navy-50 text-navy-700 ring-navy-100",
  electric: "bg-electric-50 text-electric-700 ring-electric-100",
  success: "bg-success-50 text-success-600 ring-success-600/15",
  warning: "bg-warning-50 text-warning-600 ring-warning-600/15",
  danger: "bg-danger-50 text-danger-600 ring-danger-600/15",
  dark: "bg-navy-900 text-white ring-navy-900",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset [&_svg]:size-3",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
