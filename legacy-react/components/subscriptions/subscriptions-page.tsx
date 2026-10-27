"use client";
import { ForenInfoNote } from "@/components/ui/foren-info-note";
import {
  ForenTable,
  ForenTableBody,
  ForenTableHead,
  ForenTableHeaderCell,
  ForenTableRow,
} from "@/components/ui/foren-table";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  RiAlertLine,
  RiBankCardLine,
  RiCloseLine,
  RiRepeatLine,
} from "@remixicon/react";
import { CardsHeader } from "@/components/cards/cards-header";
import { toast } from "sonner";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { MerchantLogo } from "@/components/merchant-logo";
import { Money } from "@/components/money";
import { Sheet } from "@/components/overlay";
import {
  EmptyState,
  ErrorState,
  LoadingRows,
} from "@/components/states";
import { COPY, DECLINE } from "@/content/copy";
import {
  forecast,
  subscriptionStatus,
  type SubStatus,
} from "@/domain/forecast";
import { FREQUENCY_LABEL } from "@/domain/labels";
import { add, convert } from "@/domain/money";
import type { Card, Currency, Money as M, Subscription } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { allowNextAttempt, topUpBalance, unfreezeCard } from "@/lib/actions";
import { useLoad } from "@/lib/api";
import { can, visibleCards } from "@/lib/permissions";
import { useNow, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SubscriptionDetail } from "./subscription-detail";

const short = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function useSubStatus() {
  const s = useStore();
  const now = useNow(30_000);
  return (sub: Subscription, card: Card) =>
    subscriptionStatus(sub, card, merchantById(sub.merchantId)!, {
      balances: s.balances,
      transactions: s.transactions,
      requests: s.requests,
      subscriptions: s.subscriptions,
      now,
    });
}

export function SubscriptionsPage() {
  const role = useStore((s) => s.role);
  const cards = useStore((s) => s.cards);
  const subs = useStore((s) => s.subscriptions);
  const now = useNow(30_000);
  const statusOf = useSubStatus();
  const { status, retry } = useLoad("subs");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const cardFilter = params.get("card") ?? "all";
  const openId = params.get("sub");

  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "all") next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  };

  const mineCards = visibleCards(role, cards);
  const rows = subs
    .map((s) => ({
      s,
      card: mineCards.find((c) => c.id === s.cardId)!,
      f: forecast(s, now),
    }))
    .filter(
      (r) =>
        r.card &&
        (cardFilter === "all" ||
          r.card.id === cardFilter ||
          r.s.movingToCardId === cardFilter),
    )
    .map((r) => ({ ...r, st: statusOf(r.s, r.card) }))
    .sort((a, b) => {
      const da = a.f.kind === "estimate" ? a.f.date.getTime() : Infinity;
      const db = b.f.kind === "estimate" ? b.f.date.getTime() : Infinity;
      return da - db;
    });

  const live = rows.filter((r) => !r.s.blocked);
  const soon = live.filter((r) => r.f.kind === "estimate" && r.f.daysAway <= 7);
  const later = live.filter(
    (r) => !(r.f.kind === "estimate" && r.f.daysAway <= 7),
  );
  const blocked = rows.filter((r) => r.s.blocked);
  const totals = (days: number) => {
    const m = new Map<Currency, M>();
    live.forEach((r) => {
      if (r.f.kind === "estimate" && r.f.daysAway <= days)
        m.set(
          r.f.amount.currency,
          m.has(r.f.amount.currency)
            ? add(m.get(r.f.amount.currency)!, r.f.amount)
            : r.f.amount,
        );
    });
    return [...m.values()];
  };
  const open = rows.find((r) => r.s.id === openId);
  const [showTip, setShowTip] = React.useState(() => {
    try {
      return localStorage.getItem("foren-sub-tip") !== "hidden";
    } catch {
      return true;
    }
  });
  const dismissTip = () => {
    setShowTip(false);
    try {
      localStorage.setItem("foren-sub-tip", "hidden");
    } catch {
      /* storage unavailable */
    }
  };
  const cardsWithSubs = mineCards.filter((c) =>
    subs.some((s) => s.cardId === c.id),
  );
  const attention = rows.filter((r) => r.st.kind === "at_risk" || r.st.kind === "declined");
  const split = false; // details open in a drawer (Figma), so the list keeps its full width
  const select = (id: string) => setParam({ sub: id === openId ? null : id });

  return (
    <div>
      <CardsHeader tab="subscriptions" />

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="sub-card">
          Card
        </label>
        <select
          id="sub-card"
          value={cardFilter}
          onChange={(e) => setParam({ card: e.target.value })}
          className="h-8 rounded-full bg-surface pl-3 text-[13px] font-medium text-fg ring-1 ring-line outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <option value="all">All cards</option>
          {cardsWithSubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nickname} •• {c.last4}
            </option>
          ))}
        </select>
        <span className="text-[13px] text-fg-3">Estimates based on past charges</span>
      </div>

      {status === "loading" && <LoadingRows />}
      {status === "error" && <ErrorState onRetry={retry} />}
      {status === "ready" && rows.length === 0 && <EmptyState icon={<RiRepeatLine />} title={COPY.subscriptionsEmpty.title} body={COPY.subscriptionsEmpty.body} />}
      {status === "ready" && rows.length > 0 && (
        <div className={cn("grid items-start gap-6", split && "grid-cols-[minmax(0,1fr)_420px]")}>
          <div className="min-w-0 space-y-4">
            {/* Estimates strip */}
            <dl className="grid divide-y divide-line rounded-[20px] bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[7, 30].map((d) => {
                const t = totals(d);
                return (
                  <div key={d} className="px-4 py-3">
                    <dt className="flex items-center gap-1.5 text-[12px] font-medium text-fg-3">
                      Next {d} days
                      <ForenBadge size="sm" color="gray">
                        Estimate
                      </ForenBadge>
                    </dt>
                    <dd className="tnum mt-1 flex flex-wrap gap-x-3 text-[17px] font-semibold text-fg">{t.length ? t.map((m) => <Money key={m.currency} value={m} />) : <span className="text-fg-3">Nothing expected</span>}</dd>
                  </div>
                );
              })}
              <div className="px-4 py-3">
                <dt className="text-[12px] font-medium text-fg-3">Subscriptions</dt>
                <dd className="tnum mt-1 text-[17px] font-semibold text-fg">
                  {live.length} active{blocked.length ? <span className="text-[13px] font-normal text-fg-3"> · {blocked.length} blocked</span> : null}
                </dd>
              </div>
            </dl>

            {showTip && (
              <ForenInfoNote
                icon={<RiBankCardLine />}
                className="bg-surface"
                action={<ForenButton variant="ghost" size="xxs" aria-label="Dismiss tip" className="px-2" leadingIcon={<RiCloseLine />} onClick={dismissTip} />}
              >
                Give each subscription its own card to stop one without affecting the rest.
              </ForenInfoNote>
            )}

            {attention.length > 0 && (
              <section aria-label="Needs attention" aria-live="polite" className="overflow-hidden rounded-[20px]">
                <div className="flex items-center gap-2 bg-warning-subtle px-4 py-2 text-[12px] font-semibold text-warning">
                  <RiAlertLine className="size-4" aria-hidden /> Needs attention · {attention.length}
                </div>
                <ul className="divide-y divide-line bg-surface">
                  {attention.map((r) => (
                    <RiskCallout key={r.s.id} r={r} onOpen={() => select(r.s.id)} />
                  ))}
                </ul>
              </section>
            )}

            <SubTable groups={[["Due in the next 7 days", soon], ["Later", later], ["Blocked", blocked]]} compact={split} selectedId={openId} onSelect={select} />
          </div>
        </div>
      )}

      {(
        <Sheet
          open={!!open}
          onOpenChange={(o) => !o && setParam({ sub: null })}
          title={open ? (merchantById(open.s.merchantId)?.name ?? "") : ""}
          description={open ? `${FREQUENCY_LABEL[open.s.frequency]} · ${open.card.nickname} •• ${open.card.last4}` : undefined}
        >
          {open && <SubscriptionDetail sub={open.s} card={open.card} status={open.st} />}
        </Sheet>
      )}
    </div>
  );
}

type Row = {
  s: Subscription;
  card: Card;
  f: ReturnType<typeof forecast>;
  st: SubStatus;
};

/** Dense Mercury-style table, grouped by when the next charge is expected. */
function SubTable({ groups, compact, selectedId, onSelect }: { groups: [string, Row[]][]; compact: boolean; selectedId: string | null; onSelect: (id: string) => void }) {
  const cols = compact ? 3 : 5;
  return (
    <>
      <div className="hidden rounded-[20px] bg-surface px-6 py-4 md:block">
      <ForenTable className="table-flush" caption="Subscriptions" minWidth={720}>
        <ForenTableHead>
          <tr>
            <ForenTableHeaderCell label="Merchant" />
            {!compact && <ForenTableHeaderCell label="Card" />}
            <ForenTableHeaderCell label="Next charge" />
            {!compact && <ForenTableHeaderCell label="Amount" align="right" />}
            <ForenTableHeaderCell label="Status" align="right" />
          </tr>
        </ForenTableHead>
        {groups.map(([title, rows]) =>
          rows.length ? (
            <ForenTableBody key={title}>
              <tr>
                <th colSpan={cols} scope="colgroup" className="bg-sunken px-4 py-1.5 text-left text-[12px] font-semibold text-fg-2">
                  {title} <span className="tnum font-normal text-fg-3">· {rows.length}</span>
                </th>
              </tr>
              {rows.map((r) => {
                const m = merchantById(r.s.merchantId);
                const sel = r.s.id === selectedId;
                return (
                  <ForenTableRow key={r.s.id} onClick={() => onSelect(r.s.id)} aria-selected={sel} selected={sel}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <MerchantLogo merchant={m} size={28} />
                        <button
                          className="min-w-0 truncate text-left text-[13px] font-medium text-fg outline-none focus-visible:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(r.s.id);
                          }}
                        >
                          {m?.name}
                          <span className="block text-[12px] font-normal text-fg-3">{FREQUENCY_LABEL[r.s.frequency]}</span>
                        </button>
                      </div>
                    </td>
                    {!compact && (
                      <td className="tnum px-4 py-2.5 text-[13px] text-fg-2">
                        •• {r.card.last4} <span className="text-fg">{r.card.nickname}</span>
                      </td>
                    )}
                    <td className="tnum px-4 py-2.5 text-[13px] text-fg">
                      {r.s.blocked ? <span className="text-fg-3">No more charges</span> : r.f.kind === "estimate" ? short(r.f.date) : <span className="text-fg-3">Not enough history</span>}
                    </td>
                    {!compact && (
                      <td className="tnum px-4 py-2.5 text-right text-[13px] text-fg">
                        <Money value={r.f.kind === "estimate" ? r.f.amount : r.s.usualAmount} />
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-right">
                      <SubStatusBadge st={r.st} />
                    </td>
                  </ForenTableRow>
                );
              })}
            </ForenTableBody>
          ) : null
        )}
      </ForenTable>
      </div>
      {/* Phone list */}
      <div className="space-y-4 md:hidden">
        {groups.map(([title, rows]) =>
          rows.length ? (
            <section key={title} aria-label={title}>
              <h2 className="mb-1 text-[12px] font-semibold text-fg-2">
                {title} <span className="tnum font-normal text-fg-3">· {rows.length}</span>
              </h2>
              <ul className="divide-y divide-line">
                {rows.map((r) => {
                  const m = merchantById(r.s.merchantId);
                  return (
                    <li key={r.s.id}>
                      <button onClick={() => onSelect(r.s.id)} className="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-subtle">
                        <MerchantLogo merchant={m} size={36} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold text-fg">{m?.name}</span>
                          <span className="tnum block truncate text-[12px] text-fg-3">
                            {r.f.kind === "estimate" && !r.s.blocked ? `${short(r.f.date)} · ` : ""}•• {r.card.last4} {r.card.nickname}
                          </span>
                        </span>
                        <span className="flex flex-col items-end gap-1">
                          <Money value={r.f.kind === "estimate" ? r.f.amount : r.s.usualAmount} className="tnum text-[14px] font-semibold text-fg" />
                          <SubStatusBadge st={r.st} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null
        )}
      </div>
    </>
  );
}

export function SubStatusBadge({ st }: { st: SubStatus }) {
  switch (st.kind) {
    case "blocked":
      return (
        <ForenBadge color="error" dot>
          Blocked
        </ForenBadge>
      );
    case "still_on_old_card":
      return (
        <ForenBadge color="orange" dot>
          {COPY.stillOnOldCard}
        </ForenBadge>
      );
    case "declined":
      return (
        <ForenBadge color="error" dot>
          Declined
        </ForenBadge>
      );
    case "at_risk":
      return (
        <ForenBadge color="orange" leadingIcon={<RiAlertLine aria-hidden />}>
          At risk
        </ForenBadge>
      );
    case "due_soon":
      return (
        <ForenBadge color="primary" dot>
          Due soon
        </ForenBadge>
      );
    default:
      return (
        <ForenBadge color="success" dot>
          Active
        </ForenBadge>
      );
  }
}

/** Warning before a subscription declines — names merchant, date, amount, cause and one fix (AC 8.5). */
function RiskCallout({ r, onOpen }: { r: Row; onOpen: () => void }) {
  const role = useStore((s) => s.role);
  const m = merchantById(r.s.merchantId)!;
  const [busy, setBusy] = React.useState(false);
  const reason =
    r.st.kind === "at_risk" || r.st.kind === "declined"
      ? r.st.reason
      : "unknown";
  const when =
    r.f.kind === "estimate"
      ? `around ${short(r.f.date)} (estimate)`
      : "next time it charges";
  const amount = r.f.kind === "estimate" ? r.f.amount : r.s.usualAmount;
  const owner = can(role, "manageSubscriptions", r.card);

  const fix: { label: string; run: () => Promise<void> } | null = !owner
    ? null
    : reason === "frozen"
      ? { label: "Unfreeze card", run: () => unfreezeCard(r.card.id) }
      : reason === "insufficient_balance"
        ? {
            label: `Top up ${amount.currency} (test funds)`,
            run: () =>
              topUpBalance(
                amount.currency,
                convert(amount, amount.currency).minor * 2,
              ),
          }
        : reason === "merchant_blocked" ||
            reason === "category_blocked" ||
            reason === "merchant_not_allowed"
          ? {
              label: "Allow next charge only",
              run: () => allowNextAttempt(r.s.id),
            }
          : null;

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
      <MerchantLogo merchant={m} size={28} />
      <p className="flex-1 text-[13px] leading-[18px] text-fg">
        {r.st.kind === "declined" ? (
          <>
            <span className="font-semibold">The last {m.name} charge was declined.</span> {DECLINE[reason].title}{" "}
          </>
        ) : (
          <>
            <span className="font-semibold">
              {m.name} may decline {when} for <Money value={amount} />.
            </span>{" "}
            {DECLINE[reason].title}{" "}
          </>
        )}
        {!fix && (reason === "spend_limit" || reason === "per_charge_limit" ? "Review the card’s spending limit." : owner ? "" : DECLINE[reason].next)}
      </p>
      <div className="flex shrink-0 gap-2">
        <ForenButton size="xxs" variant="ghost" onClick={onOpen}>
          Details
        </ForenButton>
        {fix && (
          <ForenButton
            size="xxs"
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await fix.run();
                toast("Done — we’ll update the status once it’s confirmed.");
              } catch {
                toast.error(COPY.saveFailure);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working…" : fix.label}
          </ForenButton>
        )}
      </div>
    </li>
  );
}
