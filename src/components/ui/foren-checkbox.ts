import { cva } from "class-variance-authority";

export const checkboxBoxVariants = cva(
  "relative shrink-0 grid place-items-center rounded-[6px] transition-[background-color,border-color,box-shadow] duration-150 ease-out border [&_svg]:transition-opacity [&_svg]:duration-150",
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
        lg: "size-6",
      },
      checked: {
        true: "",
        false: "",
        indeterminate: "",
      },
      error: { true: "", false: "" },
      disabled: { true: "", false: "" },
    },
    compoundVariants: [
      // Default unchecked
      {
        checked: false,
        error: false,
        disabled: false,
        className:
          "bg-[var(--color-foren-bg-default)] border-[var(--color-foren-border-default)] hover:border-[var(--color-foren-border-strong)] hover:bg-[var(--color-foren-bg-sunken)] active:bg-[var(--color-foren-bg-subtle)]",
      },
      // Unchecked + error
      {
        checked: false,
        error: true,
        disabled: false,
        className:
          "bg-[var(--color-foren-bg-default)] border-[var(--color-foren-error,#c62828)] hover:bg-[var(--color-foren-bg-error-subtle)]",
      },
      // Unchecked + disabled
      {
        checked: false,
        disabled: true,
        className: "bg-[var(--color-foren-bg-button-disabled)] border-[var(--color-foren-border-disabled)]",
      },
      // Checked + default
      {
        checked: true,
        error: false,
        disabled: false,
        className:
          "bg-[var(--color-foren-brand-green)] border-[var(--color-foren-brand-green)] hover:bg-[var(--color-foren-brand-green-hover)] hover:border-[var(--color-foren-brand-green-hover)] active:bg-[var(--color-foren-brand-green-pressed)]",
      },
      // Indeterminate + default
      {
        checked: "indeterminate",
        error: false,
        disabled: false,
        className:
          "bg-[var(--color-foren-brand-green)] border-[var(--color-foren-brand-green)] hover:bg-[var(--color-foren-brand-green-hover)] hover:border-[var(--color-foren-brand-green-hover)] active:bg-[var(--color-foren-brand-green-pressed)]",
      },
      // Checked / indeterminate + error
      {
        checked: true,
        error: true,
        className: "bg-[var(--color-foren-error)] border-[var(--color-foren-error)] hover:bg-[var(--color-foren-error-hover)]",
      },
      {
        checked: "indeterminate",
        error: true,
        className: "bg-[var(--color-foren-error)] border-[var(--color-foren-error)] hover:bg-[var(--color-foren-error-hover)]",
      },
      // Checked / indeterminate + disabled
      {
        checked: true,
        disabled: true,
        className: "bg-[var(--color-foren-disabled-strong)] border-[var(--color-foren-disabled-strong)]",
      },
      {
        checked: "indeterminate",
        disabled: true,
        className: "bg-[var(--color-foren-disabled-strong)] border-[var(--color-foren-disabled-strong)]",
      },
    ],
    defaultVariants: { size: "md", checked: false, error: false, disabled: false },
  }
);
export const labelTextVariants = cva("font-medium tracking-[0.01em] text-[var(--color-foren-text-secondary)]", {
  variants: {
    size: {
      sm: "text-[13px] leading-[18px]",
      md: "text-[14px] leading-[21px]",
      lg: "text-[16px] leading-[24px]",
    },
    // Use Text/Disabled semantic token. `!` forces override of base color.
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

export type Checked = boolean | "indeterminate";
