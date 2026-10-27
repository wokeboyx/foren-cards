import type { ComputedRef, InjectionKey } from "vue";
import { cva } from "class-variance-authority";

export type RadioSize = "sm" | "md" | "lg";

/* ─── Group context ──────────────────────────────────────────────────── */
export type RadioCtx = {
  name: ComputedRef<string>;
  value: ComputedRef<string | undefined>;
  setValue: (v: string) => void;
  disabled: ComputedRef<boolean>;
  size: ComputedRef<RadioSize>;
};
export const RADIO_CTX: InjectionKey<RadioCtx> = Symbol("ForenRadioGroup");

export interface ForenRadioGroupProps {
  name?: string;
  modelValue?: string;
  defaultValue?: string;
  size?: RadioSize;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface ForenRadioProps {
  value: string;
  label?: string;
  description?: string;
  /** Trailing slot — e.g. price label. */
  trailing?: string;
  disabled?: boolean;
  id?: string;
}

export interface ForenRadioCardProps extends Omit<ForenRadioProps, "trailing"> {
  /** Optional badge slot — e.g. "Save 33%" pill. */
  badge?: string;
  /** Optional second row under price (e.g. "$240 billed yearly"). */
  caption?: string;
  /** Right-side primary line — typically the price. */
  price?: string;
}

/* ─── Dot primitive ──────────────────────────────────────────────────── */
export const dotVariants = cva(
  "relative shrink-0 grid place-items-center rounded-full border transition-[background-color,border-color,box-shadow] duration-150 ease-out",
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
        lg: "size-6",
      },
      checked: { true: "", false: "" },
      disabled: { true: "", false: "" },
    },
    compoundVariants: [
      {
        checked: false,
        disabled: false,
        className:
          "bg-[var(--color-foren-bg-default)] border-[var(--color-foren-border-strong)] hover:border-[var(--color-foren-brand-green)]",
      },
      // Checked — Foren Sage 600 (var(--color-foren-brand-green)), same as Checkbox.
      {
        checked: true,
        disabled: false,
        className: "bg-[var(--color-foren-brand-green)] border-[var(--color-foren-brand-green)] hover:bg-[var(--color-foren-brand-green-hover)] hover:border-[var(--color-foren-brand-green-hover)]",
      },
      {
        checked: false,
        disabled: true,
        className: "bg-[var(--color-foren-bg-button-disabled)] border-[var(--color-foren-border-disabled)]",
      },
      {
        checked: true,
        disabled: true,
        className: "bg-[var(--color-foren-disabled-strong)] border-[var(--color-foren-disabled-strong)]",
      },
    ],
    defaultVariants: { size: "md", checked: false, disabled: false },
  }
);

/* ─── Plain radio row ─────────────────────────────────────────────────── */
export const labelTextVariants = cva("font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]", {
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
export const descTextVariants = cva("text-[var(--color-foren-text-tertiary)] tracking-[0.01em]", {
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
