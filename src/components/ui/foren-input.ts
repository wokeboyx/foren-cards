import { cva, type VariantProps } from "class-variance-authority";

export const fieldVariants = cva(
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
  },
);

export const inputVariants = cva(
  "flex-1 min-w-0 bg-transparent outline-none font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)] placeholder:text-[var(--color-foren-text-disabled)] disabled:cursor-not-allowed disabled:text-[var(--color-foren-text-disabled)]",
  {
    variants: {
      size: {
        md: "text-[14px] leading-[21px]",
        lg: "text-[16px] leading-[24px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const inputIconColor = "text-[var(--color-foren-text-tertiary)]";

export interface ForenInputProps {
  size?: NonNullable<VariantProps<typeof fieldVariants>["size"]>;
  label?: string;
  /** Helper text shown under the field when no error/success message. */
  description?: string;
  /** Error message — also flips status to error. `true` flips status without a message. */
  error?: string | boolean;
  /** Success message — also flips status to success. */
  success?: string | boolean;
  disabled?: boolean;
  id?: string;
  /** Wrapper class (applies to the outer element). `class` goes on the <input>. */
  containerClassName?: string;
}
