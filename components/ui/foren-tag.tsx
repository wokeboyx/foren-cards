"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const tagVariants = cva(
  "inline-flex items-center justify-center rounded-full whitespace-nowrap select-none outline-none cursor-pointer will-change-transform transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.97] active:duration-75 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)] focus-visible:ring-[var(--color-foren-border-focus)] [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
      state: {
        unselected:
          "bg-[var(--color-foren-bg-button-secondary)] text-[var(--color-foren-text-secondary)] font-medium tracking-[0.01em] hover:bg-[var(--color-foren-bg-button-secondary-hover)] hover:text-[var(--color-foren-text-primary)]",
        selected:
          "bg-[var(--color-foren-bg-button-primary,#1e1711)] text-[var(--color-foren-text-inverse)] font-semibold tracking-[0.0125em] hover:bg-[var(--color-foren-bg-button-primary-hover)]",
        destructive:
          "bg-[var(--color-foren-bg-error-subtle)] text-[var(--color-foren-error)] font-semibold tracking-[0.0125em] hover:bg-[var(--color-foren-bg-error-subtle-hover)]",
      },
      size: {
        xs: "h-8 gap-1.5 text-[12px] leading-[16px] [&_svg]:size-[14px]",
        normal: "h-11 gap-2 text-[14px] leading-[21px] [&_svg]:size-[16px]",
      },
      padding: {
        symmetric: "",
        leading: "",
        trailing: "",
        both: "",
        iconOnly: "",
      },
    },
    compoundVariants: [
      // xs paddings — tighter on the icon side
      { size: "xs", padding: "symmetric", className: "px-3" },
      { size: "xs", padding: "leading", className: "pl-2 pr-3" },
      { size: "xs", padding: "trailing", className: "pl-3 pr-2" },
      { size: "xs", padding: "both", className: "px-2" },
      { size: "xs", padding: "iconOnly", className: "px-0 aspect-square" },
      // normal paddings — more breathing, bigger asymmetry
      { size: "normal", padding: "symmetric", className: "px-4" },
      { size: "normal", padding: "leading", className: "pl-3 pr-4" },
      { size: "normal", padding: "trailing", className: "pl-4 pr-3" },
      { size: "normal", padding: "both", className: "px-3" },
      { size: "normal", padding: "iconOnly", className: "px-0 aspect-square" },
    ],
    defaultVariants: { state: "unselected", size: "normal", padding: "symmetric" },
  }
);
export interface ForenTagProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof tagVariants> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  children?: React.ReactNode;
  /** Convenience for filter UIs — true === state:"selected". */
  selected?: boolean;
}
export const ForenTag = React.forwardRef<HTMLButtonElement, ForenTagProps>(function ForenTag(
  {
    className,
    state,
    size,
    selected,
    leadingIcon,
    trailingIcon,
    children,
    type = "button",
    ...props
  },
  ref
) {
  const resolvedState = state ?? (selected ? "selected" : "unselected");
  const hasLabel = children != null;
  const padding = !hasLabel && (leadingIcon || trailingIcon)
    ? "iconOnly"
    : leadingIcon && trailingIcon
      ? "both"
      : leadingIcon
        ? "leading"
        : trailingIcon
          ? "trailing"
          : "symmetric";
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={resolvedState === "selected" || resolvedState === "destructive"}
      className={cn(tagVariants({ state: resolvedState, size, padding }), className)}
      {...props}
    >
      {leadingIcon}
      {children != null && <span>{children}</span>}
      {trailingIcon}
    </button>
  );
});
export { tagVariants };