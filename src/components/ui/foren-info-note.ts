import { cva, type VariantProps } from "class-variance-authority";

export const noteVariants = cva(
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

export type NoteIntent = NonNullable<VariantProps<typeof noteVariants>["intent"]>;

export interface ForenInfoNoteProps {
  intent?: NoteIntent;
  size?: NonNullable<VariantProps<typeof noteVariants>["size"]>;
  /** Hide the leading icon. To replace it, use the `icon` slot. */
  hideIcon?: boolean;
}
