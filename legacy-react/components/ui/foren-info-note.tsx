"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const noteVariants = cva(
  "inline-flex items-center gap-2 rounded-full font-medium tracking-[0.01em] [&_svg]:shrink-0 [&_svg]:pointer-events-none w-full",
  {
    variants: {
      intent: {
        default: "bg-[var(--color-foren-bg-subtle)] text-[var(--color-foren-text-secondary)]",
        info: "bg-[var(--color-foren-bg-info-subtle)] text-[var(--color-foren-info)]",
        success: "bg-[var(--color-foren-bg-success-subtle)] text-[var(--color-foren-success)]",
        warning: "bg-[var(--color-foren-bg-warning-subtle)] text-[var(--color-foren-warning)]",
        error: "bg-[var(--color-foren-bg-error-subtle)] text-[var(--color-foren-error)]",
      },
      size: {
        sm: "h-9 px-3 text-[13px] leading-[18px] [&_svg]:size-[14px]",
        lg: "h-12 px-4 text-[14px] leading-[21px] [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { intent: "default", size: "sm" },
  }
);
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);
const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);
const defaultIcon: Record<NonNullable<VariantProps<typeof noteVariants>["intent"]>, React.ReactNode> = {
  default: <InfoIcon />,
  info: <InfoIcon />,
  success: <CheckIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
};
export interface ForenInfoNoteProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof noteVariants> {
  /** Body text. */
  children: React.ReactNode;
  /** Override the default leading icon (per intent). Pass `null` to hide. */
  icon?: React.ReactNode | null;
  /** Optional trailing slot — for a dismiss button or link. */
  action?: React.ReactNode;
}
export const ForenInfoNote = React.forwardRef<HTMLDivElement, ForenInfoNoteProps>(
  function ForenInfoNote(
    { className, intent = "default", size = "sm", icon, action, children, ...props },
    ref
  ) {
    const resolvedIcon = icon === null ? null : icon ?? defaultIcon[intent ?? "default"];
    const ariaLive = intent === "error" || intent === "warning" ? "assertive" : "polite";
    const role = intent === "error" ? "alert" : "status";
    return (
      <div
        ref={ref}
        role={role}
        aria-live={ariaLive}
        className={cn(noteVariants({ intent, size }), className)}
        {...props}
      >
        {resolvedIcon}
        <span className="flex-1 min-w-0 truncate">{children}</span>
        {action}
      </div>
    );
  }
);
export { noteVariants };