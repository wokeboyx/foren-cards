"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap select-none [&_svg]:shrink-0 [&_svg]:pointer-events-none transition-colors",
  {
    variants: {
      color: {
        gray: "bg-[var(--color-foren-bg-button-secondary)] text-[var(--color-foren-text-secondary)]",
        primary: "bg-[var(--color-foren-bg-primary-subtle)] text-[var(--color-foren-text-primary)]",
        error: "bg-[var(--color-foren-bg-error-subtle)] text-[var(--color-foren-error)]",
        success: "bg-[var(--color-foren-bg-success-subtle)] text-[var(--color-foren-success)]",
        indigo: "bg-[var(--color-foren-bg-info-subtle)] text-[var(--color-foren-info)]",
        orange: "bg-[var(--color-foren-bg-warning-subtle)] text-[var(--color-foren-warning)]",
      },
      size: {
        sm: "h-[22px] px-2 text-[12px] leading-[16px] tracking-[0.04em] [&_svg]:size-[12px]",
        md: "h-6 px-2.5 text-[13px] leading-[18px] tracking-[0.01em] [&_svg]:size-[12px]",
        lg: "h-7 px-3 text-[14px] leading-[21px] tracking-[0.01em] [&_svg]:size-[14px]",
      },
      iconOnly: {
        true: "aspect-square !px-0",
        false: "",
      },
    },
    defaultVariants: { color: "gray", size: "md", iconOnly: false },
  }
);
const dotColors: Record<NonNullable<VariantProps<typeof badgeVariants>["color"]>, string> = {
  gray: "bg-[var(--color-foren-text-tertiary)]",
  primary: "bg-[var(--color-foren-primary-dot)]",
  error: "bg-[var(--color-foren-error)]",
  success: "bg-[var(--color-foren-success)]",
  indigo: "bg-[var(--color-foren-info)]",
  orange: "bg-[var(--color-foren-warning)]",
};
export type BadgeColor = NonNullable<VariantProps<typeof badgeVariants>["color"]>;
export interface ForenBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    Omit<VariantProps<typeof badgeVariants>, "iconOnly"> {
  /** Show a leading status dot tinted to the badge color. */
  dot?: boolean;
  /** Leading slot — flag, avatar img, icon. Wins over `dot` when both are set. */
  leadingIcon?: React.ReactNode;
  /** When provided, renders a dismiss "×" that calls this on click. */
  onDismiss?: () => void;
  /** Aria label for the dismiss button. */
  dismissLabel?: string;
  children?: React.ReactNode;
}
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
export const ForenBadge = React.forwardRef<HTMLSpanElement, ForenBadgeProps>(function ForenBadge(
  { className, color, size, dot, leadingIcon, onDismiss, dismissLabel = "Dismiss", children, ...props },
  ref
) {
  const iconOnly = children == null && (leadingIcon != null || dot);
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ color, size, iconOnly }), className)}
      {...props}
    >
      {!leadingIcon && dot && (
        <span aria-hidden className={cn("size-1.5 rounded-full", dotColors[color ?? "gray"])} />
      )}
      {leadingIcon}
      {children != null && <span>{children}</span>}
      {onDismiss && (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="-mr-1 inline-flex items-center justify-center size-4 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <span className="size-3">
            <XIcon />
          </span>
        </button>
      )}
    </span>
  );
});
export { badgeVariants };