"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Radio option with a title and a one-line explanation underneath (Foren radio-card styling). */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  badge,
  icon,
  disabled,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "relative flex cursor-pointer gap-3 rounded-[16px] border bg-surface px-4 py-3.5 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
        checked ? "border-[var(--color-foren-brand-green)] shadow-[var(--shadow-foren-xs)]" : "border-line hover:bg-sunken",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <input id={id} type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
          checked ? "border-[var(--color-foren-brand-green)] bg-[var(--color-foren-brand-green)]" : "border-line-strong bg-surface"
        )}
      >
        {checked && <span className="size-2 rounded-full bg-white" />}
      </span>
      {icon && <span className="mt-0.5 shrink-0 text-fg-2 [&_svg]:size-5">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-[14px] leading-[21px] font-semibold text-fg">
          {title}
          {badge}
        </span>
        {description && <span className="mt-0.5 block text-[13px] leading-[18px] text-fg-2">{description}</span>}
      </span>
    </label>
  );
}
