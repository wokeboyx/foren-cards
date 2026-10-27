import { cva } from "class-variance-authority";

/**
 * Toggle spec lifted from /Toggle Animation reference:
 *  - track: 51×24 (md), pill radius, color-track-off → -on transitions in 320ms ease-in-out
 *  - thumb: 29×22 (md) oblong, 1px white border, inset+outer shadow, travels 20px on spring
 *  - spring easing: cubic-bezier(0.34, 1.45, 0.64, 1) → slight overshoot
 */
// travel = trackW - thumbW - 2*offset (so thumb hugs both ends symmetrically)
export const sizeMap = {
  sm: { trackW: 36, trackH: 20, thumbW: 16, thumbH: 16, offset: 2, travel: 16, radius: 8 },
  md: { trackW: 51, trackH: 24, thumbW: 29, thumbH: 22, offset: 1, travel: 20, radius: 14 },
  lg: { trackW: 60, trackH: 30, thumbW: 36, thumbH: 28, offset: 1, travel: 22, radius: 16 },
} as const;
export const trackVariants = cva(
  "relative shrink-0 rounded-full transition-[background-color] duration-[320ms] ease-[cubic-bezier(0.4,0,0.2,1)] outline-none",
  {
    variants: {
      checked: { true: "", false: "" },
      error: { true: "", false: "" },
      disabled: { true: "", false: "" },
    },
    compoundVariants: [
      {
        checked: false,
        error: false,
        disabled: false,
        className: "bg-[var(--color-foren-border-default)] hover:bg-[var(--color-foren-border-strong)]",
      },
      {
        checked: false,
        error: true,
        disabled: false,
        className: "bg-[var(--color-foren-bg-error-subtle)] hover:bg-[var(--color-foren-bg-error-subtle-hover)]",
      },
      {
        checked: false,
        disabled: true,
        className: "bg-[var(--color-foren-bg-button-disabled)]",
      },
      {
        checked: true,
        error: false,
        disabled: false,
        className: "bg-[var(--color-foren-brand-green)] hover:bg-[var(--color-foren-brand-green-hover)] active:bg-[var(--color-foren-brand-green-pressed)]",
      },
      {
        checked: true,
        error: true,
        disabled: false,
        className: "bg-[var(--color-foren-error,#c62828)] hover:bg-[var(--color-foren-error-hover)]",
      },
      {
        checked: true,
        disabled: true,
        className: "bg-[var(--color-foren-disabled-strong)]",
      },
    ],
    defaultVariants: { checked: false, error: false, disabled: false },
  }
);
export const labelVariants = cva("font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]", {
  variants: {
    size: {
      sm: "text-[13px] leading-[18px]",
      md: "text-[14px] leading-[21px]",
      lg: "text-[16px] leading-[24px]",
    },
    disabled: { true: "!text-[var(--color-foren-text-disabled)]", false: "" },
  },
  defaultVariants: { size: "md", disabled: false },
});
export const descVariants = cva("text-[var(--color-foren-text-tertiary)] tracking-[0.01em]", {
  variants: {
    size: {
      sm: "text-[11px] leading-[16px]",
      md: "text-[12px] leading-[17px]",
      lg: "text-[13px] leading-[18px]",
    },
    disabled: { true: "!text-[var(--color-foren-text-disabled)]", false: "" },
  },
  defaultVariants: { size: "md", disabled: false },
});
