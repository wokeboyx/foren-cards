import { cva, type VariantProps } from "class-variance-authority";

export const spinnerSizeMap = {
  sm: { box: 16, stroke: 2 },
  md: { box: 24, stroke: 2.5 },
  lg: { box: 32, stroke: 3 },
  xl: { box: 48, stroke: 4 },
} as const;

export const spinnerWrapperVariants = cva("inline-flex items-center gap-2", {
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

export interface ForenSpinnerProps {
  size?: NonNullable<VariantProps<typeof spinnerWrapperVariants>["size"]>;
  /** Track ring color. Defaults to Neutral/Mist/400. */
  trackColor?: string;
  /** Spinning arc color. Defaults to Foren Sage 700. */
  color?: string;
  /** Optional inline label rendered next to the spinner. */
  label?: string;
  /** Accessible label when no visible label is rendered. */
  ariaLabel?: string;
}
