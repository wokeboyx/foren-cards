"use client";
import { PageHeader } from "@/components/page-header";
import * as React from "react";
import { useReducedMotion } from "motion/react";
import { RiCheckboxCircleFill, RiCloseCircleFill, RiFlaskLine, RiIndeterminateCircleLine } from "@remixicon/react";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenInput } from "@/components/ui/foren-input";
import { ForenSearch } from "@/components/ui/foren-search";
import { NotAllowed, NotFound } from "@/components/create/route-pages";
import { FundingLegs } from "@/components/funding-legs";
import { LinkButton } from "@/components/link-button";
import { MerchantLogo } from "@/components/merchant-logo";
import { Panel } from "@/components/states";
import { POLICY } from "@/config/policy";
import { COPY, DECLINE } from "@/content/copy";
import { authorize, type Decision } from "@/domain/authorize";
import { CATEGORY_LABEL } from "@/domain/labels";
import { parseAmount } from "@/domain/money";
import type { Currency, Merchant } from "@/domain/types";
import { MERCHANTS } from "@/fixtures/merchants";
import { can } from "@/lib/permissions";
import { now, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TestCharge({ cardId }: { cardId: string }) {
  const role = useStore((s) => s.role);
  const card = useStore((s) => s.cards.find((c) => c.id === cardId));
  const [merchant, setMerchant] = React.useState<Merchant | null>(null);
  const [q, setQ] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<Currency>("USD");
  const [errors, setErrors] = React.useState<{ merchant?: string; amount?: string }>({});
  const [decision, setDecision] = React.useState<Decision | null>(null);
  const [shown, setShown] = React.useState(0);
  const reduce = useReducedMotion();

  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);
  const reveal = (d: Decision) => {
    if (timer.current) clearInterval(timer.current);
    setDecision(d);
    if (reduce) return setShown(d.steps.length);
    setShown(0);
    timer.current = setInterval(() => {
      setShown((n) => {
        if (n >= d.steps.length) {
          if (timer.current) clearInterval(timer.current);
          return n;
        }
        return n + 1;
      });
    }, 380);
  };

  if (!card) return <NotFound />;
  if (!can(role, "testCharge", card)) return <NotAllowed body="Only the account owner can test charges on a card." />;

  const run = () => {
    const e: typeof errors = {};
    if (!merchant) e.merchant = "Choose a merchant.";
    const amt = parseAmount(amount, currency);
    if (!amount.trim()) e.amount = "Enter an amount.";
    else if (!amt || amt.minor <= 0) e.amount = "Enter an amount above zero, using numbers only.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const s = useStore.getState();
    reveal(authorize(card, merchant!, amt!, { balances: s.balances, transactions: s.transactions, requests: s.requests, subscriptions: s.subscriptions, now: now() }));
  };

  const done = decision && shown >= decision.steps.length;

  return (
    <div className="max-w-[760px] space-y-5">
      <PageHeader title="Test a charge" description={`${card.nickname} •• ${card.last4} · nothing is charged`} />

      <Panel className="p-5 sm:p-6">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="grid gap-4 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-start"
        >
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-fg" id="tc-merchant">
              Merchant
            </span>
            {merchant ? (
              <div className="flex h-12 items-center gap-2 rounded-[16px] bg-subtle px-3">
                <MerchantLogo merchant={merchant} size={26} />
                <span className="flex-1 truncate text-[14px] font-medium text-fg">{merchant.name}</span>
                <button type="button" className="text-[13px] font-semibold text-fg-2 underline-offset-2 hover:underline" onClick={() => setMerchant(null)}>
                  Change
                </button>
              </div>
            ) : (
              <ForenSearch
                ariaLabel="Merchant"
                placeholder="Search merchants"
                value={q}
                onChange={setQ}
                onSearch={(raw) =>
                  raw.trim()
                    ? MERCHANTS.filter((m) => m.name.toLowerCase().includes(raw.trim().toLowerCase()))
                        .slice(0, 6)
                        .map((m) => ({ value: m.id, label: m.name, description: CATEGORY_LABEL[m.category], icon: <MerchantLogo merchant={m} size={28} /> }))
                    : []
                }
                onSelect={(r) => {
                  const m = MERCHANTS.find((x) => x.id === r.value)!;
                  setMerchant(m);
                  setCurrency(m.billingCurrency);
                  setQ("");
                }}
              />
            )}
            {errors.merchant && <p className="text-[12px] text-error">{errors.merchant}</p>}
          </div>
          <ForenInput label="Amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} className="tnum" />
          <div className="flex flex-col gap-2">
            <label htmlFor="tc-cur" className="text-[14px] font-medium text-fg">
              Currency
            </label>
            <select id="tc-cur" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
              {POLICY.launchCurrencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <ForenButton type="submit" className="sm:mt-[29px]" disabled={!merchant || !((parseAmount(amount, currency)?.minor ?? 0) > 0)} leadingIcon={<RiFlaskLine />}>
            Run test
          </ForenButton>
        </form>
      </Panel>

      {decision && (
        <Panel className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-warning-subtle px-5 py-2.5 text-[13px] font-semibold text-warning">
            <RiFlaskLine className="size-4" aria-hidden /> {COPY.simulationLabel}
          </div>
          <ol className="space-y-0 px-5 py-4 sm:px-6" aria-live="polite">
            {decision.steps.map((s, i) => (
              <li key={s.key} className={cn("relative flex gap-3 pb-4 transition-opacity duration-200 last:pb-0", i < shown ? "opacity-100" : "opacity-0")}>
                {i < decision.steps.length - 1 && <span aria-hidden className="absolute top-7 bottom-0 left-[13px] w-px bg-line-2" />}
                <span aria-hidden className={cn("relative z-10 grid size-7 shrink-0 place-items-center rounded-full [&_svg]:size-[18px]", s.result === "passed" ? "bg-success-subtle text-success" : s.result === "blocked" ? "bg-error-subtle text-error" : "bg-subtle text-fg-3")}>
                  {s.result === "passed" ? <RiCheckboxCircleFill /> : s.result === "blocked" ? <RiCloseCircleFill /> : <RiIndeterminateCircleLine />}
                </span>
                <div className="min-w-0 pt-0.5">
                  <div className="text-[14px] font-semibold text-fg">
                    {s.label} <span className={cn("ml-1 text-[12px] font-semibold", s.result === "passed" ? "text-success" : s.result === "blocked" ? "text-error" : "text-fg-3")}>{s.result === "passed" ? "Passed" : s.result === "blocked" ? "Blocked" : "Not checked"}</span>
                  </div>
                  <div className="text-[13px] text-fg-2">{s.detail}</div>
                  {s.attempts && (
                    <ul className="mt-1.5 space-y-0.5 text-[12px] text-fg-3">
                      {s.attempts.map((a, j) => (
                        <li key={j}>
                          {`${a.source.currency} balance`}: {a.outcome === "used" ? "covered it" : a.outcome === "partial" ? "covered part" : "couldn’t cover it"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {done && (
            <div className="border-t border-line px-5 py-5 sm:px-6">
              {decision.approved ? (
                <>
                  <p className="text-[16px] font-semibold text-success">This charge would be approved.</p>
                  <div className="mt-3">
                    <FundingLegs legs={decision.legs} feeAvoided={decision.feeAvoided} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[16px] font-semibold text-error">{DECLINE[decision.reason].title}</p>
                  <p className="mt-1 text-[14px] text-fg-2">{fixFor(decision.reason)}</p>
                  {["merchant_blocked", "category_blocked", "merchant_not_allowed", "per_charge_limit", "spend_limit"].includes(decision.reason) && (
                    <LinkButton href={`/cards/${card.id}/edit`} variant="secondary" size="xs" className="mt-3">
                      Edit card settings
                    </LinkButton>
                  )}
                </>
              )}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function fixFor(reason: Decision extends infer D ? (D extends { approved: false; reason: infer R } ? R : never) : never): string {
  switch (reason) {
    case "frozen":
      return "Next: unfreeze the card.";
    case "merchant_blocked":
      return "Next: unblock this merchant on the card.";
    case "category_blocked":
    case "merchant_not_allowed":
      return "Next: allow this merchant or category in the card’s permissions.";
    case "per_charge_limit":
    case "spend_limit":
      return "Next: raise the card’s spending limit.";
    case "insufficient_balance":
      return "Next: top up an eligible balance, or allow more balances in the card’s funding.";
    default:
      return DECLINE[reason].next;
  }
}
