import { cva, type VariantProps } from "class-variance-authority";

export const tooltipVariants = cva(
  "absolute z-50 pointer-events-none rounded-lg shadow-[var(--shadow-foren-xs)] data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-[opacity,transform] duration-150 ease-out",
  {
    variants: {
      variant: {
        dark: "bg-[var(--color-foren-bg-button-primary,#1e1711)] text-[var(--color-foren-text-inverse)]",
        light:
          "bg-[var(--color-foren-bg-default)] text-[var(--color-foren-text-primary)] border border-[var(--color-foren-border-muted)] shadow-[var(--shadow-foren-md)]",
      },
      size: {
        sm: "w-[200px] px-3 py-2.5 gap-1.5 text-[12px] leading-[17px] tracking-[0.01em]",
        md: "w-[260px] px-3.5 py-3 gap-1.5 text-[12px] leading-[17px] tracking-[0.01em]",
        lg: "w-[320px] px-4 py-3.5 gap-2 text-[13px] leading-[18px] tracking-[0.01em]",
      },
    },
    defaultVariants: { variant: "dark", size: "sm" },
  },
);

export const arrowVariants = cva("absolute size-2 rotate-45", {
  variants: {
    variant: {
      dark: "bg-[var(--color-foren-bg-button-primary,#1e1711)]",
      light:
        "bg-[var(--color-foren-bg-default)] border-[var(--color-foren-border-muted)]",
    },
  },
  defaultVariants: { variant: "dark" },
});

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface ForenTooltipProps {
  variant?: NonNullable<VariantProps<typeof tooltipVariants>["variant"]>;
  size?: NonNullable<VariantProps<typeof tooltipVariants>["size"]>;
  /** Optional heading shown in semibold above the body. */
  title?: string;
  /** Body copy. Required. */
  description: string;
  /** Optional action label rendered as an inline link. */
  action?: string;
  /** Href for the action. Renders a real anchor when provided. Otherwise the `action` event fires. */
  actionHref?: string;
  /** Which side of the trigger the tooltip appears on. */
  side?: TooltipSide;
  /** Open delay in ms. Defaults to 200. */
  delay?: number;
}

export const sidePosition: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 -translate-x-2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 translate-x-2 ml-2",
};

export const sideMotion: Record<TooltipSide, { open: string; closed: string }> =
  {
    top: {
      open: "data-[state=open]:translate-y-0 data-[state=open]:-translate-x-1/2",
      closed:
        "data-[state=closed]:translate-y-1 data-[state=closed]:-translate-x-1/2",
    },
    bottom: {
      open: "data-[state=open]:translate-y-0 data-[state=open]:-translate-x-1/2",
      closed:
        "data-[state=closed]:-translate-y-1 data-[state=closed]:-translate-x-1/2",
    },
    left: {
      open: "data-[state=open]:translate-x-0 data-[state=open]:-translate-y-1/2",
      closed:
        "data-[state=closed]:translate-x-1 data-[state=closed]:-translate-y-1/2",
    },
    right: {
      open: "data-[state=open]:translate-x-0 data-[state=open]:-translate-y-1/2",
      closed:
        "data-[state=closed]:-translate-x-1 data-[state=closed]:-translate-y-1/2",
    },
  };

export const arrowPosition: Record<TooltipSide, string> = {
  top: "left-1/2 -translate-x-1/2 -bottom-1 border-b border-r",
  bottom: "left-1/2 -translate-x-1/2 -top-1 border-t border-l",
  left: "top-1/2 -translate-y-1/2 -right-1 border-t border-r",
  right: "top-1/2 -translate-y-1/2 -left-1 border-b border-l",
};
