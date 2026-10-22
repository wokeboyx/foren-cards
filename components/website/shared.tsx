"use client";
import * as React from "react";
import { RiCheckLine } from "@remixicon/react";
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { CURRENCIES, DIAL_CODES, dialFor } from "./data";

/** Website palette, from the foren.co Figma (midnight espresso + warm greys). */
export const ink = "text-[#2f2d2b]";
export const muted = "text-[#95908b]";

export const inputCls =
  "h-12 w-full rounded-[16px] border border-[#e6e4e2] bg-white px-4 text-[15px] font-medium text-[#2f2d2b] outline-none placeholder:text-[#b5b0ab] focus-visible:border-[#2f2d2b] focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/15 aria-[invalid=true]:border-[#d92d20]";

export const primaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1e1711] px-6 text-[14px] font-semibold tracking-[0.175px] text-[#eee] outline-none transition-colors hover:bg-[#3a2f26] focus-visible:ring-2 focus-visible:ring-[#1e1711]/40 focus-visible:ring-offset-2 disabled:opacity-40";

/** Secondary action: never competes with the one dark button in a panel. */
export const secondaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ebe9e5] px-6 text-[14px] font-semibold tracking-[0.175px] text-[#2f2d2b] outline-none transition-colors hover:bg-[#dfdcd7] focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30";

export const linkBtn = "text-[14px] font-medium text-[#6b6661] underline underline-offset-4 outline-none hover:text-[#2f2d2b] focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30 rounded";

/** The frosted card from the calculator in the website Figma (node 3011:4384). */
export function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full rounded-[40px] border border-[rgba(192,225,250,0.2)] bg-gradient-to-b from-[rgba(216,237,255,0.1)] to-[#d8edff] to-[168.8%] p-4 backdrop-blur-[16px]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Inner panel of the glass card ("SendR" and "Header" in Figma). */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[24px] border border-[rgba(198,178,187,0.2)] bg-[rgba(243,243,243,0.95)]", className)}>{children}</div>;
}

export function Flag({ code, size = 24, className }: { code: string; size?: number; className?: string }) {
  const c = CURRENCIES[code];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={c?.flag} alt="" width={size} height={size} className={cn("shrink-0 rounded-full", className)} style={{ width: size, height: size }} />;
}

/** Figma "Currency Selector" pill, with a native select laid over it for keyboard and screen readers. */
export function CurrencyPill({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative inline-flex h-9 items-center gap-2 rounded-full border border-[#eee] bg-[rgba(216,214,213,0.4)] pr-2.5 pl-1.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/30">
      <Flag code={value} />
      <span className={cn("text-[14px] font-semibold tracking-[0.175px]", ink)}>{value}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/website/chevron.svg")} alt="" width={18} height={18} className="size-[18px]" />
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
        {options.map((o) => (
          <option key={o} value={o}>
            {o} · {CURRENCIES[o].name}
          </option>
        ))}
      </select>
    </div>
  );
}

/** WhatsApp number: country code pill + number. */
export function PhoneField({
  id,
  dial,
  onDial,
  number,
  onNumber,
  invalid,
}: {
  id: string;
  dial: string;
  onDial: (v: string) => void;
  number: string;
  onNumber: (v: string) => void;
  invalid?: boolean;
}) {
  const current = dialFor(dial);
  return (
    <div className="flex gap-2">
      <div className="relative flex h-12 shrink-0 items-center gap-2 rounded-[16px] border border-[#e6e4e2] bg-white px-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.flag} alt="" width={20} height={20} className="size-5 rounded-full" />
        <span className={cn("text-[15px] font-medium", ink)}>{current.code}</span>
        <select aria-label="Country code" value={dial} onChange={(e) => onDial(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
          {DIAL_CODES.map((d) => (
            <option key={d.iso} value={d.iso}>
              {d.country} ({d.code})
            </option>
          ))}
        </select>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="803 000 0000"
        value={number}
        aria-invalid={invalid}
        onChange={(e) => onNumber(e.target.value.replace(/[^\d ]/g, ""))}
        className={cn(inputCls, "min-w-0 flex-1")}
      />
    </div>
  );
}

export const validPhone = (n: string) => n.replace(/\D/g, "").length >= 7;

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-2 block text-[14px] font-medium", ink)}>
      {children}
    </label>
  );
}

/** Numbered checklist on the left of a panel: done = dark tick, current = accent number, later = outlined. */
export function StepList({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-3" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full text-[15px] font-semibold transition-colors",
                done && "bg-[#ebe9e5] text-[#2f2d2b]",
                active && "bg-[#1e1711] text-white",
                !done && !active && "border border-[#e6e4e2] text-[#95908b]"
              )}
            >
              {done ? <RiCheckLine className="size-5" aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-[17px] font-medium transition-colors", done || active ? ink : muted)}>
              {s}
              {done && <span className="sr-only"> (done)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Left column of every tab: display headline, one-line description, then whatever the tab needs. */
export function Intro({ title, description, children }: { title: React.ReactNode; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 lg:pt-6">
      <div className="flex flex-col gap-4">
        <h2 className={cn("max-w-[420px] font-display text-[32px] leading-[52px] font-medium tracking-[-0.4px]", ink)}>{title}</h2>
        <p className={cn("max-w-[480px] text-[16px] leading-[24px] tracking-[-0.08px]", muted)}>{description}</p>
      </div>
      {children}
    </div>
  );
}
