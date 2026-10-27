"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
/* ─── Group context ──────────────────────────────────────────────────── */
type RadioCtx = {
  name: string;
  value: string | undefined;
  setValue: (v: string) => void;
  disabled: boolean;
  size: "sm" | "md" | "lg";
};
const Ctx = React.createContext<RadioCtx | null>(null);
/* ─── Group ──────────────────────────────────────────────────────────── */
export interface ForenRadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (next: string) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  ariaLabel?: string;
}
export function ForenRadioGroup({
  name,
  value: controlled,
  defaultValue,
  onChange,
  size = "md",
  disabled = false,
  ariaLabel,
  className,
  children,
  ...rest
}: ForenRadioGroupProps) {
  const reactId = React.useId();
  const fieldName = name ?? `radio-${reactId}`;
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue);
  const value = isControlled ? controlled : internal;
  const ctx = React.useMemo<RadioCtx>(
    () => ({
      name: fieldName,
      value,
      setValue: (next) => {
        if (!isControlled) setInternal(next);
        onChange?.(next);
      },
      disabled,
      size,
    }),
    [fieldName, value, isControlled, onChange, disabled, size]
  );
  return (
    <Ctx.Provider value={ctx}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className={cn("flex flex-col gap-3", className)}
        {...rest}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}
/* ─── Dot primitive ──────────────────────────────────────────────────── */
const dotVariants = cva(
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
function Dot({
  checked,
  size,
  disabled,
}: {
  checked: boolean;
  size: "sm" | "md" | "lg";
  disabled: boolean;
}) {
  const innerSize = size === "sm" ? 6 : size === "md" ? 8 : 10;
  return (
    <span className={dotVariants({ size, checked, disabled })}>
      <span
        aria-hidden
        className="rounded-full bg-white transition-[transform,opacity] duration-150 ease-out"
        style={{
          width: innerSize,
          height: innerSize,
          transform: checked ? "scale(1)" : "scale(0)",
          opacity: checked ? 1 : 0,
        }}
      />
    </span>
  );
}
/* ─── Plain radio row ─────────────────────────────────────────────────── */
const labelTextVariants = cva("font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]", {
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
export interface ForenRadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "value" | "type" | "onChange"> {
  value: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  /** Trailing slot — e.g. price label. */
  trailing?: React.ReactNode;
}
export const ForenRadio = React.forwardRef<HTMLInputElement, ForenRadioProps>(function ForenRadio(
  { value, label, description, trailing, disabled: disabledProp, id: idProp, className, ...rest },
  ref
) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("ForenRadio must be used inside ForenRadioGroup");
  const reactId = React.useId();
  const id = idProp ?? reactId;
  const disabled = disabledProp ?? ctx.disabled;
  const checked = ctx.value === value;
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-start gap-3 select-none",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <input
        ref={ref}
        id={id}
        type="radio"
        name={ctx.name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.checked) ctx.setValue(value);
        }}
        className="peer sr-only"
        {...rest}
      />
      <span className="relative">
        <Dot checked={checked} size={ctx.size} disabled={disabled} />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-foren-bg-default)] peer-focus-visible:ring-[var(--color-foren-border-focus)]"
        />
      </span>
      {(label || description) && (
        <span
          className={cn(
            "flex flex-col gap-1 flex-1 min-w-0",
            // Optical centering — pull text so label first-line midline lands on dot midline.
            ctx.size === "sm" && "-mt-px",
            ctx.size === "md" && "-mt-[0.5px]"
          )}
        >
          {label && <span className={labelTextVariants({ size: ctx.size, disabled })}>{label}</span>}
          {description && <span className={descTextVariants({ size: ctx.size, disabled })}>{description}</span>}
        </span>
      )}
      {trailing && (
        <span className="ml-auto shrink-0 text-[var(--color-foren-text-secondary)] text-[14px] leading-[21px] font-medium tracking-[0.01em]">
          {trailing}
        </span>
      )}
    </label>
  );
});
/* ─── Card-style radio (bordered selectable) ──────────────────────────── */
export interface ForenRadioCardProps extends ForenRadioProps {
  /** Optional badge slot — e.g. "Save 33%" pill. */
  badge?: React.ReactNode;
  /** Optional second row under price (e.g. "$240 billed yearly"). */
  caption?: React.ReactNode;
  /** Right-side primary line — typically the price. */
  price?: React.ReactNode;
}
export const ForenRadioCard = React.forwardRef<HTMLInputElement, ForenRadioCardProps>(function ForenRadioCard(
  { value, label, description, price, caption, badge, disabled: disabledProp, id: idProp, className, ...rest },
  ref
) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("ForenRadioCard must be used inside ForenRadioGroup");
  const reactId = React.useId();
  const id = idProp ?? reactId;
  const disabled = disabledProp ?? ctx.disabled;
  const checked = ctx.value === value;
  return (
    <label
      htmlFor={id}
      className={cn(
        "relative flex items-center gap-4 px-5 py-4 rounded-[16px] border bg-[var(--color-foren-bg-default)] transition-[border-color,box-shadow] duration-150 ease-out select-none",
        checked
          ? "border-[var(--color-foren-brand-green)] shadow-[var(--shadow-foren-xs)]"
          : "border-[var(--color-foren-border-muted)] hover:border-[var(--color-foren-border-default)]",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
    >
      <input
        ref={ref}
        id={id}
        type="radio"
        name={ctx.name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.checked) ctx.setValue(value);
        }}
        className="peer sr-only"
        {...rest}
      />
      <Dot checked={checked} size={ctx.size} disabled={disabled} />
      <span className="flex-1 min-w-0 flex items-center gap-3">
        {label && (
          <span className={cn(labelTextVariants({ size: ctx.size, disabled }), "shrink-0")}>{label}</span>
        )}
        {badge}
        {description && (
          <span className={descTextVariants({ size: ctx.size, disabled })}>{description}</span>
        )}
      </span>
      {(price || caption) && (
        <span className="flex flex-col items-end gap-0.5 shrink-0">
          {price && (
            <span className={cn(labelTextVariants({ size: ctx.size, disabled }), "tabular-nums")}>{price}</span>
          )}
          {caption && (
            <span className={descTextVariants({ size: ctx.size, disabled })}>{caption}</span>
          )}
        </span>
      )}
    </label>
  );
});