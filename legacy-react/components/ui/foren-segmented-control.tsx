"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const trackVariants = cva(
  "relative inline-flex items-stretch bg-[var(--color-foren-bg-subtle)] rounded-full",
  {
    variants: {
      size: {
        sm: "p-[3px] h-9",
        md: "p-1 h-11",
        lg: "p-1 h-12",
      },
    },
    defaultVariants: { size: "md" },
  }
);
const segmentVariants = cva(
  "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-subtle)] focus-visible:ring-[var(--color-foren-border-focus)] disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      size: {
        sm: "h-full px-4 text-[13px] leading-[18px]",
        md: "h-full px-5 text-[14px] leading-[21px]",
        lg: "h-full px-5 text-[14px] leading-[21px]",
      },
      stretch: {
        true: "flex-1 min-w-0",
        false: "flex-none",
      },
      active: {
        // Figma (Segmented Control 3404:194063): both states medium; inactive uses text/secondary.
        true: "font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]",
        false: "font-medium tracking-[0.01em] text-[var(--color-foren-text-secondary)] hover:text-[var(--color-foren-text-primary)]",
      },
    },
    defaultVariants: { size: "md", active: false, stretch: false },
  }
);
export type ForenSegmentOption<V extends string = string> = {
  value: V;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
};
export interface ForenSegmentedControlProps<V extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    VariantProps<typeof trackVariants> {
  options: ForenSegmentOption<V>[];
  value?: V;
  defaultValue?: V;
  onChange?: (next: V) => void;
  /** Full-width track. Defaults to false (intrinsic width). */
  fullWidth?: boolean;
  /** aria-label when no surrounding label. */
  ariaLabel?: string;
}
export function ForenSegmentedControl<V extends string = string>({
  options,
  value: controlled,
  defaultValue,
  onChange,
  size = "md",
  fullWidth = false,
  className,
  ariaLabel = "Segmented control",
  ...rest
}: ForenSegmentedControlProps<V>) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = React.useState<V>(
    (defaultValue ?? options[0]?.value) as V
  );
  const value = isControlled ? controlled! : internal;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [pill, setPill] = React.useState<{ x: number; w: number; h: number } | null>(null);
  // Position the active pill via JS for smooth slide between segments.
  React.useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const active = track.querySelector<HTMLButtonElement>(`[data-value="${value}"]`);
      if (!active) {
        setPill(null);
        return;
      }
      const trackRect = track.getBoundingClientRect();
      const r = active.getBoundingClientRect();
      setPill({ x: r.left - trackRect.left, w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => ro.disconnect();
  }, [value, options.length, size]);
  function select(v: V) {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  }
  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(trackVariants({ size }), fullWidth ? "w-full" : "w-auto", className)}
      {...rest}
    >
      {pill && (
        <span
          aria-hidden
          className="absolute rounded-full bg-[var(--color-foren-bg-elevated)] shadow-[0_1px_1px_rgba(36,28,21,0.05)] transition-[left,width] duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
          style={{ left: pill.x, width: pill.w, height: pill.h, top: "50%", transform: "translateY(-50%)" }}
        />
      )}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-value={opt.value}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && select(opt.value)}
            className={segmentVariants({ size, active, stretch: fullWidth })}
          >
            {opt.icon}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}