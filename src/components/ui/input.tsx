import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl bg-surface text-sm text-ink ring-1 ring-inset ring-line-strong shadow-xs transition " +
  "placeholder:text-ink-subtle hover:ring-navy-300 focus:outline-none focus:ring-2 focus:ring-electric-500 " +
  "disabled:cursor-not-allowed disabled:bg-navy-50 aria-[invalid=true]:ring-danger-600";

type InputProps = ComponentProps<"input"> & { icon?: ReactNode };

export function Input({ className, icon, ...props }: InputProps) {
  if (!icon) return <input className={cn(fieldBase, "h-10 px-3.5", className)} {...props} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-subtle [&_svg]:size-4">
        {icon}
      </span>
      <input className={cn(fieldBase, "h-10 pl-9 pr-3.5", className)} {...props} />
    </div>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 px-3.5 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(fieldBase, "h-10 appearance-none pl-3.5 pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-navy-900", className)} {...props} />;
}

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

/** Label + champ + aide / erreur, avec les attributs d'accessibilité. */
export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-danger-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ className, label, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 text-sm text-navy-800", className)}>
      <input
        type="checkbox"
        className="size-4 rounded border-line-strong accent-electric-500 focus-visible:outline-electric-500"
        {...props}
      />
      {label}
    </label>
  );
}
