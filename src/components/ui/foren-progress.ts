import { cva } from "class-variance-authority";

export const progressTrackVariants = cva(
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
  },
);
export const progressLabelVariants = cva(
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
  },
);
