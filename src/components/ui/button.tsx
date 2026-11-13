import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-electric-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-electric-600 hover:shadow-glow active:bg-electric-700",
  dark: "bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950",
  secondary: "bg-surface text-navy-900 ring-1 ring-inset ring-line-strong shadow-xs hover:bg-navy-50 hover:ring-navy-200",
  ghost: "text-navy-700 hover:bg-navy-50 hover:text-navy-950",
  danger: "bg-danger-600 text-white hover:bg-danger-600/90",
  link: "text-electric-600 underline-offset-4 hover:underline px-0! h-auto!",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
  icon: "size-10 rounded-xl",
} as const;

type BaseProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

export function buttonClasses({ variant = "primary", size = "md", className }: Omit<BaseProps, "children" | "loading">) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-200",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = BaseProps & ComponentProps<"button">;

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

type ButtonLinkProps = BaseProps & ComponentProps<typeof Link>;

/** Lien stylé comme un bouton (navigation, pas d'action). */
export function ButtonLink({ variant, size, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
