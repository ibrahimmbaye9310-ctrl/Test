import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, interactive, ...props }: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface ring-1 ring-line shadow-card",
        interactive && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:ring-line-strong",
        className,
      )}
      {...props}
    />
  );
}
