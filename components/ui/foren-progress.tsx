"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const trackVariants = cva(
  "relative w-full overflow-hidden bg-[var(--color-foren-bg-track,var(--color-foren-bg-button-secondary-active))] rounded-full",
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: { size: "md" },
  }
);
const labelVariants = cva(
  "flex items-baseline justify-between gap-3 font-medium tracking-[0.01em]",
  {
    variants: {
      size: {
        sm: "text-[12px] leading-[18px] mb-1.5",
        md: "text-[12px] leading-[18px] mb-1.5",
        lg: "text-[14px] leading-[21px] mb-2",
      },
    },
    defaultVariants: { size: "md" },
  }
);
export interface ForenProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof trackVariants> {
  /** 0–100. Ignored when `indeterminate` is true. */
  value?: number;
  /** Maximum value (defaults to 100). */
  max?: number;
  /** Show looping animation; value ignored. */
  indeterminate?: boolean;
  /** Label above the bar. */
  label?: React.ReactNode;
  /** Hide the percentage display. Defaults to false (visible). */
  hideValue?: boolean;
  /** Override the formatted value text. */
  valueText?: React.ReactNode;
  /** Custom fill color (defaults to Foren Sage 700). */
  fillColor?: string;
}
export const ForenProgress = React.forwardRef<HTMLDivElement, ForenProgressProps>(
  function ForenProgress(
    {
      className,
      size = "md",
      value = 0,
      max = 100,
      indeterminate = false,
      label,
      hideValue = false,
      valueText,
      fillColor = "var(--color-foren-brand-green)",
      ...props
    },
    ref
  ) {
    const targetPct = Math.max(0, Math.min(100, (value / max) * 100));
    const showHeader = label || (!hideValue && !indeterminate);
    // Smoothly tween the displayed value so the text rolls instead of snapping.
    // Bar width animates from the same source for perfect sync.
    const [displayPct, setDisplayPct] = React.useState(targetPct);
    React.useEffect(() => {
      if (indeterminate) return;
      const start = displayPct;
      const end = targetPct;
      if (start === end) return;
      const duration = 600;
      const t0 = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic
      let raf = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        setDisplayPct(start + (end - start) * ease(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetPct, indeterminate]);
    const rounded = Math.round(displayPct);
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {showHeader && (
          <div className={labelVariants({ size })}>
            <span className="text-[var(--color-foren-text-primary)] truncate">{label}</span>
            {!hideValue && !indeterminate && (
              <span className="text-[var(--color-foren-text-tertiary)] tabular-nums shrink-0">
                {valueText ?? `${rounded}%`}
              </span>
            )}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : Math.round(targetPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={indeterminate ? "Loading" : `${Math.round(targetPct)}%`}
          aria-label={
            typeof label === "string" ? label : props["aria-label"] ?? "Progress"
          }
          className={trackVariants({ size })}
        >
          {indeterminate ? (
            <span
              aria-hidden
              className="absolute inset-y-0 rounded-full"
              style={{
                backgroundColor: fillColor,
                width: "40%",
                animation: "forenProgressIndeterminate 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          ) : (
            <span
              aria-hidden
              className="block h-full rounded-full"
              style={{ width: `${displayPct}%`, backgroundColor: fillColor }}
            />
          )}
        </div>
      </div>
    );
  }
);