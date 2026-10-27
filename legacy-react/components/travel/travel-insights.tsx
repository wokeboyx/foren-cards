"use client";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { RiArrowDownSLine, RiCheckLine, RiCloseCircleLine, RiExchangeLine, RiErrorWarningLine, RiShieldCheckLine, RiSnowflakeLine } from "@remixicon/react";
import { CurrencyFlag } from "@/components/currency-flag";
import { FundingLegs } from "@/components/funding-legs";
import { Money } from "@/components/money";
import { authorize, spentInPeriod } from "@/domain/authorize";
import { CURRENCY_NAME, format, formatRate, fxFeeBps, money, rate } from "@/domain/money";
import { route } from "@/domain/routing";
import type { Balance, Card, Currency } from "@/domain/types";
import { COUNTRIES } from "@/fixtures/countries";
import { merchantById } from "@/fixtures/merchants";
import { now, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** A typical charge in the local currency, used to show how the card would pay. */
export const SAMPLE: Record<Currency, number> = { GBP: 100, USD: 100, EUR: 100, CAD: 150, NGN: 150_000 };

export function CountrySelect({ value, onChange, label = "Where are you going?" }: { value: string; onChange: (code: string) => void; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const c = COUNTRIES.find((x) => x.code === value)!;
  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="text-[14px] font-medium text-fg">
        {label}
      </span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger role="combobox" aria-labelledby={id} aria-expanded={open} className="relative flex h-14 w-full items-center gap-3 rounded-[16px] bg-subtle pr-10 pl-3 text-left text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <CurrencyFlag currency={c.currency} size={28} />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium text-fg">{c.name}</span> <span className="text-fg-3">· pays in {c.currency}</span>
          </span>
          <RiArrowDownSLine className={cn("absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-fg-3 transition-transform", open && "rotate-180")} aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={6} className="z-[90] w-[var(--radix-popover-trigger-width)] rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none">
            <div role="listbox" aria-labelledby={id} className="max-h-[320px] overflow-y-auto">
              {COUNTRIES.map((x) => (
                <button
                  key={x.code}
                  type="button"
                  role="option"
                  aria-selected={x.code === value}
                  onClick={() => {
                    onChange(x.code);
                    setOpen(false);
                  }}
                  className={cn("flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left outline-none hover:bg-subtle focus-visible:bg-subtle", x.code === value && "bg-subtle")}
                >
                  <CurrencyFlag currency={x.currency} size={24} />
                  <span className="flex-1">
                    <span className="block text-[14px] font-medium text-fg">{x.name}</span>
                    <span className="block text-[12px] text-fg-3">
                      {CURRENCY_NAME[x.currency]} ({x.currency})
                    </span>
                  </span>
                  {x.code === value && <RiCheckLine className="size-[18px] text-success" aria-hidden />}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

/** What spending abroad looks like on one card: which balance pays, what it costs, and whether it'll work. */
export function useTravelPlan(card: Card | undefined, local: Currency, balances: Balance[], home: Currency) {
  const txns = useStore((s) => s.transactions);
  if (!card) return null;
  const sample = money(SAMPLE[local], local);
  const r = route(sample, card.funding, balances);
  const held = balances.find((b) => b.currency === local)?.available;
  // A real merchant in that currency, to check the card's rules the same way a payment would.
  const probeMerchant = { id: "probe", name: "a local merchant", category: "travel" as const, billingCurrency: local, mark: "", tint: "", network: { kind: "works" as const } };
  const decision = authorize(card, probeMerchant, sample, { balances, transactions: txns, requests: [], subscriptions: [], now: now() });
  const spent = spentInPeriod(card, txns.filter((t) => t.cardId === card.id), now());
  const left = card.limit.amount.minor >= 1_000_000_000 ? null : { minor: Math.max(0, card.limit.amount.minor - spent.minor), currency: card.limit.amount.currency };
  return { sample, route: r, held, decision, left, homeRate: rate(local, home), fee: fxFeeBps(home, local) };
}

export function RateBox({ local, home, fee }: { local: Currency; home: Currency; fee: number }) {
  return (
    <div className="rounded-[16px] bg-surface p-4 text-center ring-1 ring-line">
      <div className="tnum text-[18px] font-semibold text-fg">{formatRate(local, home, rate(local, home))}</div>
      <div className="mt-0.5 text-[13px] text-fg-2">{local === home ? "No conversion needed" : `${(fee / 100).toFixed(1)}% conversion fee if paid from ${home} · today’s test rate`}</div>
    </div>
  );
}

export function PaysWith({ plan, local }: { plan: NonNullable<ReturnType<typeof useTravelPlan>>; local: Currency }) {
  const legs = plan.route.ok ? plan.route.legs : [];
  return (
    <div className="space-y-3">
      <p className="text-[14px] leading-[21px] text-fg-2">
        {plan.held && plan.held.minor >= plan.sample.minor ? (
          <>
            You hold <Money value={plan.held} className="tnum font-semibold text-fg" /> in {local}. No conversion needed.
          </>
        ) : plan.held && plan.held.minor > 0 ? (
          <>
            You hold <Money value={plan.held} className="tnum font-semibold text-fg" /> in {local}. It’s used first; the rest is converted at the lowest cost.
          </>
        ) : (
          <>You don’t hold {local}. Charges are converted at the lowest cost.</>
        )}
      </p>
      {plan.route.ok ? (
        <>
          <p className="text-[13px] font-medium text-fg">A {format(plan.sample)} charge would be paid like this:</p>
          <FundingLegs legs={legs} feeAvoided={plan.route.feeAvoided} />
        </>
      ) : (
        <p className="rounded-[14px] bg-warning-subtle px-3.5 py-2.5 text-[13px] text-fg">Balances can’t cover a {format(plan.sample)} charge.</p>
      )}
    </div>
  );
}

export function WillItWork({ card, plan }: { card: Card; plan: NonNullable<ReturnType<typeof useTravelPlan>> }) {
  const ok = plan.decision.approved;
  const items: { good: boolean; text: string }[] = [
    card.status === "active" ? { good: true, text: "The card is active" } : { good: false, text: card.status === "frozen" ? "The card is frozen" : "The card has been canceled" },
    plan.left ? { good: plan.left.minor > 0, text: `${format(plan.left)} left on the limit this period` } : { good: true, text: "No spending limit beyond your balances" },
  ];
  if (card.activeFrom || card.activeUntil) items.push({ good: true, text: `Only works ${card.activeFrom ?? "now"} to ${card.activeUntil ?? "no end"}` });
  if (card.lockedMerchantId) items.push({ good: false, text: `Locked to ${merchantById(card.lockedMerchantId)?.name}` });
  const why = !ok ? plan.decision.reason : undefined;
  if (why === "spend_limit" || why === "per_charge_limit") items.push({ good: false, text: `A ${format(plan.sample)} charge would go over the card’s limit` });
  else if (why === "card_control") items.push({ good: false, text: "Payments in other currencies are turned off in Card controls" });
  else if (why === "outside_period") items.push({ good: false, text: "Today is outside the card’s spending period" });
  else if (why === "insufficient_balance") items.push({ good: false, text: "Balances can’t cover a typical charge" });
  else if ((why === "category_blocked" || why === "merchant_not_allowed") && !card.lockedMerchantId)
    items.push({ good: false, text: "Card rules don’t allow travel spending" });
  return (
    <ul className="space-y-2 text-[14px] leading-[20px]">
      {items.map((i) => (
        <li key={i.text} className="flex gap-2.5">
          {i.good ? <RiCheckLine className="mt-0.5 size-[18px] shrink-0 text-success" aria-hidden /> : <RiErrorWarningLine className="mt-0.5 size-[18px] shrink-0 text-warning" aria-hidden />}
          <span className="text-fg">{i.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Wise-style tips, adapted to how Foren pays. */
export function Tips({ local, home }: { local: Currency; home: Currency }) {
  const tips = [
    { icon: <RiExchangeLine />, title: `Always choose to pay in ${local}`, body: `Say no if offered ${home === local ? "another currency" : CURRENCY_NAME[home]}. Foren’s rate is usually better.` },
    { icon: <RiShieldCheckLine />, title: "Spend like you’re home", body: "The cheapest balance pays automatically." },
    { icon: <RiSnowflakeLine />, title: "Card details lost or stolen?", body: "Freeze it straight away, then replace it." },
    { icon: <RiCloseCircleLine />, title: "Back home?", body: "Set trip dates so the card stops when you return." },
  ];
  return (
    <ul className="space-y-4">
      {tips.map((t) => (
        <li key={t.title} className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-fg [&_svg]:size-[18px]" aria-hidden>
            {t.icon}
          </span>
          <div>
            <div className="text-[14px] font-semibold text-fg">{t.title}</div>
            <p className="text-[13px] leading-[18px] text-fg-2">{t.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
