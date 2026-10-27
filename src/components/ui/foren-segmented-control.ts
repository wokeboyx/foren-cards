import type { Component, VNode } from "vue";
import { cva, type VariantProps } from "class-variance-authority";

export const trackVariants = cva("relative inline-flex items-stretch bg-[var(--color-foren-bg-subtle)] rounded-full", {
  variants: {
    size: {
      sm: "p-[3px] h-9",
      md: "p-1 h-11",
      lg: "p-1 h-12",
    },
  },
  defaultVariants: { size: "md" },
});

export const segmentVariants = cva(
  "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-subtle)] focus-visible:ring-[var(--color-foren-border-focus)] disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      size: {
        sm: "h-full px-4 text-[13px] leading-[18px]",
        md: "h-full px-5 text-[14px] leading-[21px]",
        lg: "h-full px-5 text-[14px] leading-[21px]",
      },
      stretch: {
        true: "flex-1 min-w-0",
        false: "flex-none",
      },
      active: {
        // Figma (Segmented Control 3404:194063): both states medium; inactive uses text/secondary.
        true: "font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]",
        false: "font-medium tracking-[0.01em] text-[var(--color-foren-text-secondary)] hover:text-[var(--color-foren-text-primary)]",
      },
    },
    defaultVariants: { size: "md", active: false, stretch: false },
  }
);

export type ForenSegmentOption<V extends string = string> = {
  value: V;
  label: string;
  /** A component or a vnode made with `h()`. */
  icon?: Component | VNode;
  disabled?: boolean;
};

export interface ForenSegmentedControlProps<V extends string = string> {
  options: ForenSegmentOption<V>[];
  modelValue?: V;
  defaultValue?: V;
  size?: NonNullable<VariantProps<typeof trackVariants>["size"]>;
  /** Full-width track. Defaults to false (intrinsic width). */
  fullWidth?: boolean;
  /** aria-label when no surrounding label. */
  ariaLabel?: string;
}
