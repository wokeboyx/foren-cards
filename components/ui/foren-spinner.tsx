"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const sizeMap = {
  sm: { box: 16, stroke: 2 },
  md: { box: 24, stroke: 2.5 },
  lg: { box: 32, stroke: 3 },
  xl: { box: 48, stroke: 4 },
} as const;
const wrapperVariants = cva("inline-flex items-center gap-2", {
  variants: {
    size: {
      sm: "text-[12px] leading-[16px]",
      md: "text-[13px] leading-[18px]",
      lg: "text-[14px] leading-[21px]",
      xl: "text-[16px] leading-[24px]",
    },
  },
  defaultVariants: { size: "md" },
});
export interface ForenSpinnerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof wrapperVariants> {
  /** Track ring color. Defaults to Neutral/Mist/400. */
  trackColor?: string;
  /** Spinning arc color. Defaults to Foren Sage 700. */
  color?: string;
  /** Optional inline label rendered next to the spinner. */
  label?: React.ReactNode;
  /** Accessible label when no visible label is rendered. */
  ariaLabel?: string;
}
export const ForenSpinner = React.forwardRef<HTMLSpanElement, ForenSpinnerProps>(function ForenSpinner(
  {
    className,
    size = "md",
    trackColor = "var(--color-foren-bg-button-secondary-active)",
    color = "var(--color-foren-brand-green)",
    label,
    ariaLabel = "Loading",
    ...props
  },
  ref
) {
  const { box, stroke } = sizeMap[size ?? "md"];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // 25% arc visible.
  const arcLength = circumference * 0.25;
  const gapLength = circumference - arcLength;
  return (
    <span
      ref={ref}
      role="status"
      aria-label={typeof label === "string" ? label : ariaLabel}
      aria-live="polite"
      className={cn(wrapperVariants({ size }), className)}
      {...props}
    >
      <svg
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        fill="none"
        aria-hidden
        style={{ animation: "forenSpinnerRotate 0.8s linear infinite" }}
      >
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${gapLength}`}
          // Start arc at top
          transform={`rotate(-90 ${box / 2} ${box / 2})`}
        />
      </svg>
      {label && (
        <span className="font-medium tracking-[0.01em] text-[var(--color-foren-text-secondary)]">
          {label}
        </span>
      )}
    </span>
  );
});