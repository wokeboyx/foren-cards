"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
/**
 * Foren Design System "Button" (Figma fMjvoaNbmk0lqhd9hatUEa · 180:90).
 * Types: Primary, Secondary, Secondary Outlined (`outline`), Text (`ghost`), Link. Destructive = Primary with the red subtle fill.
 * Sizes: XX-Small 32 · X-Small 36 (12px medium) · Small 40 · Medium 48 (14px semibold) · Large 56 (16px semibold).
 * Focused: 1px white + 3px focused-primary ring. Disabled: disabled fill, disabled text.
 */
const buttonVariants = cva(
  // base — fully rounded pill, spring scale on press
  "inline-flex items-center justify-center whitespace-nowrap rounded-[9999px] select-none outline-none cursor-pointer will-change-transform transition-[background-color,color,box-shadow,border-color,transform] duration-150 ease-out active:scale-[0.97] active:duration-75 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 focus-visible:shadow-[0_0_0_1px_var(--color-foren-bg-default),0_0_0_3px_var(--color-foren-border-focused-primary)] [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-foren-bg-button-primary,#1e1711)] text-[var(--color-foren-text-on-primary)] shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.05)] hover:bg-[var(--color-foren-bg-button-primary-hover)] active:bg-[var(--color-foren-bg-button-primary-pressed)] disabled:bg-[var(--color-foren-bg-button-disabled)] disabled:text-[var(--color-foren-text-disabled)] disabled:shadow-none",
        secondary:
          "bg-[var(--color-foren-bg-button-secondary)] text-[var(--color-foren-text-secondary)] hover:bg-[var(--color-foren-bg-button-secondary-hover)] active:bg-[var(--color-foren-bg-button-secondary)] disabled:bg-[var(--color-foren-bg-button-disabled)] disabled:text-[var(--color-foren-text-disabled)]",
        outline:
          "bg-transparent text-[var(--color-foren-text-secondary)] border-[1.2px] border-[var(--color-foren-border-default)] hover:bg-[var(--color-foren-bg-button-secondary)] active:bg-transparent disabled:bg-[var(--color-foren-bg-button-disabled)] disabled:border-transparent disabled:text-[var(--color-foren-text-disabled)]",
        ghost:
          "bg-transparent text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-button-secondary)] active:bg-[var(--color-foren-bg-button-secondary-active)] disabled:bg-transparent disabled:text-[var(--color-foren-text-disabled)]",
        link:
          "bg-transparent text-[var(--color-foren-text-primary)] underline-offset-[3px] hover:underline px-0 disabled:text-[var(--color-foren-text-disabled)] disabled:no-underline",
      },
      size: {
        xxs: "h-8 px-3 gap-2 text-[12px] leading-[18px] font-medium tracking-[0.01em] [&_svg]:size-[14px]",
        xs: "h-9 px-3 gap-2 text-[12px] leading-[18px] font-medium tracking-[0.01em] [&_svg]:size-[16px]",
        sm: "h-10 px-4 gap-2 text-[14px] leading-[21px] font-semibold tracking-[0.0125em] [&_svg]:size-[16px]",
        md: "h-12 px-6 gap-2 text-[14px] leading-[21px] font-semibold tracking-[0.0125em] [&_svg]:size-[18px]",
        lg: "h-14 px-6 gap-2 text-[16px] leading-[26px] font-semibold tracking-[0.005em] [&_svg]:size-[18px]",
      },
      destructive: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // Destructive — Foren spec: bg Feedback/Error Subtle (var(--color-foren-bg-error-subtle)) + text Feedback/Error (#c62828)
      {
        variant: "primary",
        destructive: true,
        className:
          "bg-[var(--color-foren-bg-error-subtle)] text-[var(--color-foren-error)] shadow-[inset_0_-1px_0_0_#fff] hover:bg-[var(--color-foren-bg-error-subtle-hover)] active:bg-[var(--color-foren-bg-error-subtle-pressed)] disabled:bg-[var(--color-foren-bg-button-disabled)] disabled:text-[var(--color-foren-text-disabled)] disabled:shadow-none",
      },
      {
        variant: "secondary",
        destructive: true,
        className:
          "bg-[var(--color-foren-bg-error-subtle)] text-[var(--color-foren-error)] hover:bg-[var(--color-foren-bg-error-subtle-hover)] active:bg-[var(--color-foren-bg-error-subtle-pressed)]",
      },
      {
        variant: "outline",
        destructive: true,
        className:
          "bg-transparent text-[var(--color-foren-error)] border-[var(--color-foren-error)]/30 hover:bg-[var(--color-foren-bg-error-subtle)] hover:border-[var(--color-foren-error)]/60 active:bg-[var(--color-foren-bg-error-subtle-hover)]",
      },
      {
        variant: "ghost",
        destructive: true,
        className: "bg-transparent text-[var(--color-foren-error)] hover:bg-[var(--color-foren-bg-error-subtle)] active:bg-[var(--color-foren-bg-error-subtle-hover)]",
      },
      {
        variant: "link",
        destructive: true,
        className: "bg-transparent text-[var(--color-foren-error)]",
      },
      // link size overrides — remove height/padding, keep type scale only
      { variant: "link", size: "xxs", className: "h-auto text-[12px]" },
      { variant: "link", size: "xs", className: "h-auto text-[12px]" },
      { variant: "link", size: "sm", className: "h-auto text-[14px]" },
      { variant: "link", size: "md", className: "h-auto text-[14px]" },
      { variant: "link", size: "lg", className: "h-auto text-[16px]" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      destructive: false,
    },
  }
);
export interface ForenButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof buttonVariants> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  children?: React.ReactNode;
}
export const ForenButton = React.forwardRef<HTMLButtonElement, ForenButtonProps>(function ForenButton(
  {
    className,
    variant,
    size,
    destructive,
    leadingIcon,
    trailingIcon,
    children,
    type = "button",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, destructive }), className)}
      {...props}
    >
      {leadingIcon}
      {children != null && <span>{children}</span>}
      {trailingIcon}
    </button>
  );
});
export { buttonVariants };