import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap select-none [&_svg]:shrink-0 [&_svg]:pointer-events-none transition-colors",
  {
    variants: {
      color: {
        gray: "bg-[var(--color-foren-bg-button-secondary)] text-[var(--color-foren-text-secondary)]",
        primary:
          "bg-[var(--color-foren-bg-primary-subtle)] text-[var(--color-foren-text-primary)]",
        error:
          "bg-[var(--color-foren-bg-error-subtle)] text-[var(--color-foren-error)]",
        success:
          "bg-[var(--color-foren-bg-success-subtle)] text-[var(--color-foren-success)]",
        indigo:
          "bg-[var(--color-foren-bg-info-subtle)] text-[var(--color-foren-info)]",
        orange:
          "bg-[var(--color-foren-bg-warning-subtle)] text-[var(--color-foren-warning)]",
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
  },
);
export const dotColors: Record<
  NonNullable<VariantProps<typeof badgeVariants>["color"]>,
  string
> = {
  gray: "bg-[var(--color-foren-text-tertiary)]",
  primary: "bg-[var(--color-foren-primary-dot)]",
  error: "bg-[var(--color-foren-error)]",
  success: "bg-[var(--color-foren-success)]",
  indigo: "bg-[var(--color-foren-info)]",
  orange: "bg-[var(--color-foren-warning)]",
};
export type BadgeColor = NonNullable<
  VariantProps<typeof badgeVariants>["color"]
>;
