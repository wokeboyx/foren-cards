"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
/**
 * Toggle spec lifted from /Toggle Animation reference:
 *  - track: 51×24 (md), pill radius, color-track-off → -on transitions in 320ms ease-in-out
 *  - thumb: 29×22 (md) oblong, 1px white border, inset+outer shadow, travels 20px on spring
 *  - spring easing: cubic-bezier(0.34, 1.45, 0.64, 1) → slight overshoot
 */
// travel = trackW - thumbW - 2*offset (so thumb hugs both ends symmetrically)
const sizeMap = {
  sm: { trackW: 36, trackH: 20, thumbW: 16, thumbH: 16, offset: 2, travel: 16, radius: 8 },
  md: { trackW: 51, trackH: 24, thumbW: 29, thumbH: 22, offset: 1, travel: 20, radius: 14 },
  lg: { trackW: 60, trackH: 30, thumbW: 36, thumbH: 28, offset: 1, travel: 22, radius: 16 },
} as const;
const trackVariants = cva(
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
const labelVariants = cva("font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]", {
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
const descVariants = cva("text-[var(--color-foren-text-tertiary)] tracking-[0.01em]", {
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
export interface ForenToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size" | "onChange" | "type">,
    Omit<VariantProps<typeof trackVariants>, "checked" | "error" | "disabled"> {
  size?: "sm" | "md" | "lg";
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  error?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  /** Reverse label position to the left of the switch. */
  reverse?: boolean;
  /** Hidden form name — emits a checkbox-like input. */
  name?: string;
  value?: string;
}
export const ForenToggle = React.forwardRef<HTMLButtonElement, ForenToggleProps>(function ForenToggle(
  {
    className,
    checked: controlled,
    defaultChecked = false,
    onCheckedChange,
    size = "md",
    error = false,
    disabled = false,
    label,
    description,
    reverse = false,
    name,
    value = "on",
    id: idProp,
    ...props
  },
  ref
) {
  const reactId = React.useId();
  const id = idProp ?? reactId;
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked);
  const checked = isControlled ? controlled! : internal;
  const dim = sizeMap[size];
  function toggle() {
    if (disabled) return;
    const next = !checked;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  }
  const switchEl = (
    <button
      ref={ref}
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-invalid={error || undefined}
      disabled={disabled}
      onClick={toggle}
      style={{ width: dim.trackW, height: dim.trackH }}
      className={cn(
        trackVariants({ checked, error, disabled }),
        "cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foren-brand-green)]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        style={{
          width: dim.thumbW,
          height: dim.thumbH,
          borderRadius: dim.radius,
          top: dim.offset,
          left: dim.offset,
          transform: `translateX(${checked ? dim.travel : 0}px)`,
          boxShadow: checked
            ? "inset 0 4px 4px rgba(170,170,170,0.25), 0 2px 6px rgba(0,0,0,0.18)"
            : "inset 0 4px 4px rgba(170,170,170,0.25), 0 1px 3px rgba(0,0,0,0.12)",
          transitionProperty: "transform, box-shadow",
          transitionDuration: "380ms",
          transitionTimingFunction: "cubic-bezier(0.34, 1.45, 0.64, 1)",
          willChange: "transform",
        }}
        className="absolute bg-white border border-white"
      />
    </button>
  );
  if (!label && !description) return switchEl;
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-start gap-3 select-none",
        reverse && "flex-row-reverse",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      {switchEl}
      <span className="flex flex-col gap-1">
        {label && <span className={labelVariants({ size, disabled })}>{label}</span>}
        {description && <span className={descVariants({ size, disabled })}>{description}</span>}
      </span>
      {name && <input type="hidden" name={name} value={checked ? value : ""} />}
    </label>
  );
});