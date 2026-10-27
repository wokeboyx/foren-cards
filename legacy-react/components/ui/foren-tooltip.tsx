"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const tooltipVariants = cva(
  "absolute z-50 pointer-events-none rounded-lg shadow-[var(--shadow-foren-xs)] data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-[opacity,transform] duration-150 ease-out",
  {
    variants: {
      variant: {
        dark: "bg-[var(--color-foren-bg-button-primary,#1e1711)] text-[var(--color-foren-text-inverse)]",
        light:
          "bg-[var(--color-foren-bg-default)] text-[var(--color-foren-text-primary)] border border-[var(--color-foren-border-muted)] shadow-[var(--shadow-foren-md)]",
      },
      size: {
        sm: "w-[200px] px-3 py-2.5 gap-1.5 text-[12px] leading-[17px] tracking-[0.01em]",
        md: "w-[260px] px-3.5 py-3 gap-1.5 text-[12px] leading-[17px] tracking-[0.01em]",
        lg: "w-[320px] px-4 py-3.5 gap-2 text-[13px] leading-[18px] tracking-[0.01em]",
      },
    },
    defaultVariants: { variant: "dark", size: "sm" },
  }
);
const arrowVariants = cva("absolute size-2 rotate-45", {
  variants: {
    variant: {
      dark: "bg-[var(--color-foren-bg-button-primary,#1e1711)]",
      light: "bg-[var(--color-foren-bg-default)] border-[var(--color-foren-border-muted)]",
    },
  },
  defaultVariants: { variant: "dark" },
});
type Side = "top" | "bottom" | "left" | "right";
export interface ForenTooltipProps extends VariantProps<typeof tooltipVariants> {
  /** Content shown on hover/focus. */
  children: React.ReactNode;
  /** Optional heading shown in semibold above the body. */
  title?: string;
  /** Body copy. Required. */
  description: string;
  /** Optional action label rendered as an inline link. */
  action?: string;
  /** Href for the action. Renders a real anchor when provided. */
  actionHref?: string;
  /** Click handler for the action — alternative to actionHref. */
  onAction?: () => void;
  /** Which side of the trigger the tooltip appears on. */
  side?: Side;
  /** Open delay in ms. Defaults to 200. */
  delay?: number;
}
const sidePosition: Record<Side, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 -translate-x-2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 translate-x-2 ml-2",
};
const sideMotion: Record<Side, { open: string; closed: string }> = {
  top: {
    open: "data-[state=open]:translate-y-0 data-[state=open]:-translate-x-1/2",
    closed: "data-[state=closed]:translate-y-1 data-[state=closed]:-translate-x-1/2",
  },
  bottom: {
    open: "data-[state=open]:translate-y-0 data-[state=open]:-translate-x-1/2",
    closed: "data-[state=closed]:-translate-y-1 data-[state=closed]:-translate-x-1/2",
  },
  left: {
    open: "data-[state=open]:translate-x-0 data-[state=open]:-translate-y-1/2",
    closed: "data-[state=closed]:translate-x-1 data-[state=closed]:-translate-y-1/2",
  },
  right: {
    open: "data-[state=open]:translate-x-0 data-[state=open]:-translate-y-1/2",
    closed: "data-[state=closed]:-translate-x-1 data-[state=closed]:-translate-y-1/2",
  },
};
const arrowPosition: Record<Side, string> = {
  top: "left-1/2 -translate-x-1/2 -bottom-1 border-b border-r",
  bottom: "left-1/2 -translate-x-1/2 -top-1 border-t border-l",
  left: "top-1/2 -translate-y-1/2 -right-1 border-t border-r",
  right: "top-1/2 -translate-y-1/2 -left-1 border-b border-l",
};
export function ForenTooltip({
  children,
  title,
  description,
  action,
  actionHref,
  onAction,
  variant = "dark",
  size = "sm",
  side = "top",
  delay = 200,
}: ForenTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (mounted) {
      setOpen(true);
      return;
    }
    openTimer.current = setTimeout(() => {
      setMounted(true);
      // Next frame, flip open to trigger transition
      requestAnimationFrame(() => setOpen(true));
    }, delay);
  }
  function hide() {
    if (openTimer.current) clearTimeout(openTimer.current);
    setOpen(false);
    closeTimer.current = setTimeout(() => setMounted(false), 180);
  }
  // Esc closes
  React.useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") hide();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);
  const state = open ? "open" : "closed";
  const motion = sideMotion[side];
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {mounted && (
        <div
          role="tooltip"
          data-state={state}
          style={{ cornerShape: "squircle" } as React.CSSProperties}
          className={cn(
            tooltipVariants({ variant, size }),
            sidePosition[side],
            motion.open,
            motion.closed
          )}
        >
          {title && (
            <div className="font-semibold tracking-[0.0125em]">{title}</div>
          )}
          <div className="opacity-90">{description}</div>
          {action &&
            (actionHref ? (
              <a
                href={actionHref}
                className="pointer-events-auto inline-block mt-0.5 font-semibold underline underline-offset-[3px] decoration-current/40 hover:decoration-current focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30 rounded-sm"
              >
                {action}
              </a>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="pointer-events-auto inline-block mt-0.5 text-left font-semibold underline underline-offset-[3px] decoration-current/40 hover:decoration-current cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30 rounded-sm"
              >
                {action}
              </button>
            ))}
          <span
            aria-hidden
            className={cn(arrowVariants({ variant }), arrowPosition[side])}
          />
        </div>
      )}
    </span>
  );
}