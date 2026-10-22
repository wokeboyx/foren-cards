"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ExchangePanel } from "./exchange-panel";
import { PaymentLinkPanel } from "./payment-link-panel";
import { QuotePanel } from "./quote-panel";

const TABS = [
  { key: "quote", label: "Quote on WhatsApp", short: "WhatsApp quote", Panel: QuotePanel },
  { key: "link", label: "Payment link", short: "Payment link", Panel: PaymentLinkPanel },
  { key: "rate", label: "Exchange rate", short: "Rates", Panel: ExchangePanel },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/** One foren.co section with three interactive views. Each panel keeps its state while you switch tabs. */
export function RatesSection() {
  const [tab, setTab] = React.useState<TabKey>("quote");
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const t = TABS[(next + TABS.length) % TABS.length];
    setTab(t.key);
    refs.current[t.key]?.focus();
  };

  return (
    <section aria-label="Try Foren" className="bg-white px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-[1154px]">
        <div role="tablist" aria-label="Try Foren" className="mb-12 grid w-full grid-cols-3 gap-1 rounded-full bg-[#f2f1ef] p-1 sm:inline-flex sm:w-auto lg:mb-16">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[t.key] = el;
              }}
              role="tab"
              id={`tab-${t.key}`}
              aria-controls={`panel-${t.key}`}
              aria-selected={tab === t.key}
              tabIndex={tab === t.key ? 0 : -1}
              onClick={() => setTab(t.key)}
              onKeyDown={(e) => onKey(e, i)}
              aria-label={t.label}
              className={cn(
                "h-10 min-w-0 rounded-full px-2 text-[13px] font-semibold whitespace-nowrap sm:px-5 sm:text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30",
                tab === t.key ? "bg-white text-[#2f2d2b] shadow-[0_1px_3px_rgba(23,18,13,0.12)]" : "text-[#6b6661] hover:text-[#2f2d2b]"
              )}
            >
              <span className="sm:hidden">{t.short}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        {TABS.map(({ key, Panel }) => (
          <div key={key} role="tabpanel" id={`panel-${key}`} aria-labelledby={`tab-${key}`} hidden={tab !== key}>
            <Panel />
          </div>
        ))}
      </div>
    </section>
  );
}
