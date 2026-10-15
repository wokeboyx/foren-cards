"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const fieldVariants = cva(
  "flex items-center gap-2 rounded-[16px] border transition-[background-color,border-color,box-shadow] duration-150 ease-out [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
      size: {
        md: "h-12 px-3 [&_svg]:size-5",
        lg: "h-14 px-3.5 [&_svg]:size-6",
      },
      status: {
        default:
          "bg-[var(--color-foren-bg-subtle)] border-transparent hover:border-[var(--color-foren-border-default)] focus-within:bg-[var(--color-foren-bg-default)] focus-within:border-[var(--color-foren-border-focus)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-foren-border-focus)_18%,transparent)]",
        error:
          "bg-[var(--color-foren-bg-default)] border-[var(--color-foren-error,#c62828)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-foren-error,#c62828)_18%,transparent)]",
        success:
          "bg-[var(--color-foren-bg-default)] border-[var(--color-foren-success)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-foren-success)_18%,transparent)]",
      },
      disabled: {
        true: "bg-[var(--color-foren-bg-button-disabled)] border-transparent cursor-not-allowed pointer-events-none",
        false: "",
      },
    },
    defaultVariants: { size: "md", status: "default", disabled: false },
  }
);
const inputVariants = cva(
  "flex-1 min-w-0 bg-transparent outline-none font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)] placeholder:text-[var(--color-foren-text-disabled)] disabled:cursor-not-allowed disabled:text-[var(--color-foren-text-disabled)]",
  {
    variants: {
      size: {
        md: "text-[14px] leading-[21px]",
        lg: "text-[16px] leading-[24px]",
      },
    },
    defaultVariants: { size: "md" },
  }
);
const iconColor = "text-[var(--color-foren-text-tertiary)]";
export interface ForenInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix">,
    Omit<VariantProps<typeof fieldVariants>, "status" | "disabled"> {
  label?: React.ReactNode;
  /** Helper text shown under the field when no error/success message. */
  description?: React.ReactNode;
  /** Error message — also flips status to error. */
  error?: React.ReactNode;
  /** Success message — also flips status to success. */
  success?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** Wrapper className (applies to outer label element). */
  containerClassName?: string;
}
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <path d="M2 2l20 20" />
  </svg>
);
export interface ForenPasswordInputProps extends Omit<ForenInputProps, "type" | "trailingIcon"> {}
export const ForenPasswordInput = React.forwardRef<HTMLInputElement, ForenPasswordInputProps>(
  function ForenPasswordInput({ ...props }, ref) {
    const [visible, setVisible] = React.useState(false);
    return (
      <ForenInput
        ref={ref}
        type={visible ? "text" : "password"}
        trailingIcon={
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className="pointer-events-auto inline-flex items-center justify-center cursor-pointer text-[var(--color-foren-text-tertiary)] hover:text-[var(--color-foren-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] rounded-sm"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
        {...props}
      />
    );
  }
);
export const ForenInput = React.forwardRef<HTMLInputElement, ForenInputProps>(function ForenInput(
  {
    className,
    containerClassName,
    label,
    description,
    error,
    success,
    leadingIcon,
    trailingIcon,
    size = "md",
    disabled,
    id: idProp,
    ...props
  },
  ref
) {
  const reactId = React.useId();
  const id = idProp ?? reactId;
  const status = error ? "error" : success ? "success" : "default";
  const messageId = `${id}-msg`;
  const message = error ?? success ?? description;
  const messageColor =
    error
      ? "text-[var(--color-foren-error,#c62828)]"
      : success
      ? "text-[var(--color-foren-success)]"
      : "text-[var(--color-foren-text-tertiary)]";
  return (
    <div className={cn("flex flex-col gap-2 w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]"
        >
          {label}
        </label>
      )}
      <div className={cn(fieldVariants({ size, status, disabled: !!disabled }))}>
        {leadingIcon && <span className={cn(iconColor, "inline-flex")}>{leadingIcon}</span>}
        <input
          ref={ref}
          id={id}
          disabled={!!disabled}
          aria-invalid={!!error}
          aria-describedby={message ? messageId : undefined}
          className={cn(inputVariants({ size }), className)}
          {...props}
        />
        {trailingIcon && <span className={cn(iconColor, "inline-flex")}>{trailingIcon}</span>}
      </div>
      {message && (
        <p id={messageId} className={cn("text-[12px] leading-[16px] tracking-[0.01em]", messageColor)}>
          {message}
        </p>
      )}
    </div>
  );
});