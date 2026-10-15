"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  // base — fully rounded pill, spring scale on press
  "inline-flex items-center justify-center whitespace-nowrap font-semibold rounded-[9999px] select-none outline-none cursor-pointer will-change-transform transition-[background-color,color,box-shadow,border-color,transform] duration-150 ease-out active:scale-[0.97] active:duration-75 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)] focus-visible:ring-[var(--color-foren-border-focus)] [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-foren-bg-button-primary,#1e1711)] text-[var(--color-foren-text-inverse)] hover:bg-[var(--color-foren-bg-button-primary-hover)] active:bg-[var(--color-foren-bg-button-primary-pressed)] disabled:bg-[var(--color-foren-bg-button-disabled)] disabled:text-[var(--color-foren-text-disabled)]",
        secondary:
          "bg-[var(--color-foren-bg-button-secondary)] text-[var(--color-foren-text-secondary)] hover:bg-[var(--color-foren-bg-button-secondary-hover)] hover:text-[var(--color-foren-text-primary)] active:bg-[var(--color-foren-border-default)] disabled:bg-[var(--color-foren-bg-button-disabled)] disabled:text-[var(--color-foren-text-disabled)]",
        outline:
          "bg-transparent text-[var(--color-foren-text-primary)] border border-[var(--color-foren-border-default)] hover:bg-[var(--color-foren-bg-button-secondary)] active:bg-[var(--color-foren-bg-button-secondary-active)] disabled:bg-transparent disabled:text-[var(--color-foren-text-disabled)] disabled:border-[var(--color-foren-bg-button-disabled)]",
        ghost:
          "bg-transparent text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-button-secondary)] active:bg-[var(--color-foren-bg-button-secondary-active)] disabled:bg-transparent disabled:text-[var(--color-foren-text-disabled)]",
        link:
          "bg-transparent text-[var(--color-foren-text-primary)] underline-offset-[3px] hover:underline px-0 disabled:text-[var(--color-foren-text-disabled)] disabled:no-underline",
      },
      size: {
        xxs: "h-8 px-3 gap-1.5 text-[12px] leading-[16px] tracking-[0.04em] [&_svg]:size-[12px]",
        xs: "h-9 px-3.5 gap-1.5 text-[12px] leading-[16px] tracking-[0.04em] [&_svg]:size-[14px]",
        sm: "h-10 px-4 gap-2 text-[14px] leading-[21px] tracking-[0.0125em] [&_svg]:size-[16px]",
        md: "h-12 px-6 gap-2 text-[14px] leading-[21px] tracking-[0.0125em] [&_svg]:size-[18px]",
        lg: "h-14 px-7 gap-2.5 text-[16px] leading-[24px] tracking-[0.0125em] [&_svg]:size-[20px]",
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
          "bg-[var(--color-foren-bg-error-subtle)] text-[var(--color-foren-error)] hover:bg-[var(--color-foren-bg-error-subtle-hover)] active:bg-[var(--color-foren-bg-error-subtle-pressed)] disabled:bg-[var(--color-foren-bg-button-disabled)] disabled:text-[var(--color-foren-text-disabled)]",
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