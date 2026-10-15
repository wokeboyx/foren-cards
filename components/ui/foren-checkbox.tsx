"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const boxVariants = cva(
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
const labelTextVariants = cva("font-medium tracking-[0.01em] text-[var(--color-foren-text-secondary)]", {
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
const descTextVariants = cva("text-[var(--color-foren-text-tertiary)] tracking-[0.01em]", {
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
type Checked = boolean | "indeterminate";
export interface ForenCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked" | "defaultChecked" | "size" | "onChange"> {
  checked?: Checked;
  defaultChecked?: Checked;
  onCheckedChange?: (next: Checked) => void;
  size?: "sm" | "md" | "lg";
  error?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
}
const CheckIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const MinusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M5 12h14" />
  </svg>
);
export const ForenCheckbox = React.forwardRef<HTMLInputElement, ForenCheckboxProps>(function ForenCheckbox(
  {
    className,
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    size = "md",
    error = false,
    disabled = false,
    label,
    description,
    id: idProp,
    ...props
  },
  ref
) {
  const reactId = React.useId();
  const id = idProp ?? reactId;
  const isControlled = checkedProp !== undefined;
  const [internal, setInternal] = React.useState<Checked>(defaultChecked ?? false);
  const checked: Checked = isControlled ? checkedProp! : internal;
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  React.useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = checked === "indeterminate";
  }, [checked]);
  const iconPx = size === "sm" ? 11 : size === "md" ? 14 : 16;
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex gap-3 items-start select-none",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <span className="relative">
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          checked={checked === true}
          disabled={disabled}
          onChange={(e) => {
            const next: Checked = e.target.checked;
            if (!isControlled) setInternal(next);
            onCheckedChange?.(next);
          }}
          aria-checked={checked === "indeterminate" ? "mixed" : checked}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            boxVariants({ size, checked, error, disabled }),
            "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-foren-bg-default)] peer-focus-visible:ring-[var(--color-foren-border-focus)]"
          )}
        >
          <span className={cn("text-white", checked === true ? "opacity-100" : "opacity-0")}>
            <CheckIcon size={iconPx} />
          </span>
          <span
            className={cn(
              "absolute text-white",
              checked === "indeterminate" ? "opacity-100" : "opacity-0"
            )}
          >
            <MinusIcon size={iconPx} />
          </span>
        </span>
      </span>
      {(label || description) && (
        <span
          className={cn(
            "flex flex-col gap-1",
            // Optical centering — line-height is taller than box. Pull text up
            // so the label's first-line midline lands on the box midline.
            size === "sm" && "-mt-px", // box 16, line 18 → -1px
            size === "md" && "-mt-[0.5px]", // box 20, line 21 → -0.5px
            // lg matches exactly (box 24, line 24) — no offset
          )}
        >
          {label && <span className={labelTextVariants({ size, disabled })}>{label}</span>}
          {description && <span className={descTextVariants({ size, disabled })}>{description}</span>}
        </span>
      )}
    </label>
  );
});
export { boxVariants as checkboxBoxVariants };