"use client";
import * as React from "react";
import { RiCheckboxCircleFill, RiErrorWarningFill, RiInformationFill } from "@remixicon/react";
import { cn } from "@/lib/utils";

/** Multi-line note (Figma "Why we ask this" / review notes). The DS Info note is single-line, so it can't hold these. */
export function Note({
  intent = "info",
  title,
  children,
  className,
}: {
  intent?: "info" | "warning" | "success" | "error";
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = intent === "success" ? RiCheckboxCircleFill : intent === "info" ? RiInformationFill : RiErrorWarningFill;
  return (
    <div
      role={intent === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2 rounded-[12px] px-3 py-2.5 text-[12px] leading-[18px] font-medium",
        intent === "info" && "bg-info-subtle text-info",
        intent === "warning" && "bg-warning-subtle text-warning",
        intent === "success" && "bg-success-subtle text-success",
        intent === "error" && "bg-error-subtle text-error",
        className
      )}
    >
      <Icon className="mt-px size-[14px] shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

/** Radio card from the Figma "Registration type" row: code on top, hint below, radio top-right, green border when selected. */
export function RadioCard({
  name,
  value,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  label: string;
  hint: string;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "relative flex min-h-[72px] min-w-0 flex-1 cursor-pointer flex-col justify-center gap-1 rounded-[12px] border bg-surface px-3 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
        checked ? "border-[var(--color-foren-brand-green)]" : "border-surface hover:border-line"
      )}
    >
      <input id={id} type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      <span className="text-[14px] leading-[21px] font-medium text-fg">{label}</span>
      <span className="text-[12px] leading-[18px] font-medium text-fg-3">{hint}</span>
      <span
        aria-hidden
        className={cn(
          "absolute top-3 right-3 grid size-4 place-items-center rounded-full border",
          checked ? "border-[var(--color-foren-brand-green)]" : "border-line-2"
        )}
      >
        {checked && <span className="size-2 rounded-full bg-[var(--color-foren-brand-green)]" />}
      </span>
    </label>
  );
}

/** Two-column label/value grid used by the registry card and the review page. */
export function DetailGrid({ items }: { items: { label: string; value: React.ReactNode; wide?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className={cn("flex min-w-0 flex-col gap-1", it.wide && "sm:col-span-2")}>
          <dt className="text-[12px] leading-[18px] font-medium text-fg-3">{it.label}</dt>
          <dd className="text-[14px] leading-[21px] font-medium break-words text-fg">{it.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export const formatDate = (iso: string | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

