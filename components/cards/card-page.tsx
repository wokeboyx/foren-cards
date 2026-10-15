"use client";
import { PageHeader } from "@/components/page-header";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiFileCopyLine,
  RiFileList3Line,
  RiLockLine,
  RiLockUnlockLine,
  RiPlaneLine,
  RiSnowflakeLine,
  RiTimeLine,
} from "@remixicon/react";
import { toast } from "sonner";
import type { BadgeColor } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenInfoNote } from "@/components/ui/foren-info-note";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import { ForenTable, ForenTableBody, ForenTableCell, ForenTableHead, ForenTableHeaderCell, ForenTableRow } from "@/components/ui/foren-table";
import { ForenProgress } from "@/components/ui/foren-progress";
import { ForenToggle } from "@/components/ui/foren-toggle";
import { CardArt } from "@/components/card/card-art";
import { CardStatusBadge, lockText } from "@/components/card/status-badge";
import { nameOnCard, usedBy } from "@/components/card/holder";
import { permissionSentence } from "@/components/card/funding-path";
import { NotFound } from "@/components/create/route-pages";
import { LinkButton } from "@/components/link-button";
import { Money } from "@/components/money";
import { COPY } from "@/content/copy";
import { spentInPeriod } from "@/domain/authorize";
import { forecast } from "@/domain/forecast";
import { PERIOD_NOUN, PERIOD_PHRASE, strategyLabel } from "@/domain/labels";
import { format } from "@/domain/money";
import type { Card, CardControls, Transaction } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { DEFAULT_CONTROLS, freezeCard, unfreezeCard, updateCard } from "@/lib/actions";
import { useAction } from "@/lib/api";
import { can, visibleCards } from "@/lib/permissions";
import { currentUserId, personById, requestState, useNow, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CardDialogs, countdown, timeAgo, WalletButtons, type DialogKind } from "./card-detail";

/** Card detail as its own page, laid out like the Foren Business Banking dashboard. */
export function CardPage({ cardId }: { cardId: string }) {
  const role = useStore((s) => s.role);
  const cards = useStore((s) => s.cards);
  const card = visibleCards(role, cards).find((c) => c.id === cardId);
  const [dialog, setDialog] = React.useState<DialogKind>(null);
  if (!card) return <NotFound />;

  return (
    <div>
      <CardHeader card={card} />
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_363px]">
        <div className="min-w-0 space-y-3">
          <SpendCard card={card} onPick={setDialog} />
          <CardTabs card={card} onPick={setDialog} />
        </div>
        <div className="space-y-3">
          <CardDetails card={card} />
          <AboutCard card={card} />
        </div>
      </div>
      <CardDialogs key={dialog ?? "closed"} card={card} dialog={dialog} setDialog={setDialog} />
    </div>
  );
}

function CardHeader({ card }: { card: Card }) {
  const holder = personById(card.holderId);
  return (
    <PageHeader
      title={card.nickname}
      badge={card.status !== "active" || card.kind === "emergency" ? <CardStatusBadge card={card} size="sm" /> : undefined}
      description={
        <>
          {card.companyCard ? `Company card · ${usedBy(card)}` : holder?.name} · •• {card.last4}
          {holder?.invited && !card.companyCard && " · Invite pending"}
        </>
      }
    />
  );
}

const panel = "rounded-[20px] bg-surface";

// ---------------------------------------------------------------- spend + actions

function SpendCard({ card, onPick }: { card: Card; onPick: (d: DialogKind) => void }) {
  const role = useStore((s) => s.role);
  const txns = useStore((s) => s.transactions);
  const requests = useStore((s) => s.requests);
  const now = useNow(1000);
  const freeze = useAction(freezeCard);
  const unfreeze = useAction(unfreezeCard);
  const perTxn = card.limit.period === "per_txn";
  const spent = spentInPeriod(perTxn ? { ...card, limit: { ...card.limit, period: "monthly" } } : card, txns, now);
  const pending = txns.filter((t) => t.cardId === card.id && t.status === "pending").reduce((s, t) => s + t.amount.minor, 0);
  const left = Math.max(0, card.limit.amount.minor - spent.minor - pending);
  const ratio = perTxn ? 0 : Math.min(1, spent.minor / card.limit.amount.minor);
  const pendingUnfreeze = requests.find((r) => r.kind === "unfreeze" && r.cardId === card.id && requestState(r, now) === "pending");
  const pendingLimit = requests.find((r) => r.kind === "limit_increase" && r.cardId === card.id && requestState(r, now) === "pending");
  const canceled = card.status === "canceled";
  const frozen = card.status === "frozen";
  const emergencyLeft = card.validUntil ? new Date(card.validUntil).getTime() - now.getTime() : null;
  const emergencyDead = card.kind === "emergency" && ((emergencyLeft !== null && emergencyLeft <= 0) || !!card.used);
  const locked = card.lockedMerchantId ? merchantById(card.lockedMerchantId) : undefined;

  const toggleFreeze = async () => {
    if (!frozen) {
      if ((await freeze.run(card.id)).ok) toast("Card frozen. Payments will fail until you unfreeze it.");
    } else if (card.adminLock) onPick("unlock");
    else if (can(role, "unfreeze", card)) {
      if ((await unfreeze.run(card.id)).ok) toast("Card unfrozen");
    } else onPick("request-unfreeze");
  };

  return (
    <section className={panel} aria-label="Spending">
      <div className="px-6 pt-4 pb-4">
        <div className="text-[14px] text-fg-2">{perTxn ? "Spent this month" : `Spent ${PERIOD_NOUN[card.limit.period]}`}</div>
        <BigAmount value={spent} />
        {!perTxn && !canceled && (
          <ForenProgress
            size="sm"
            className="mt-3 max-w-[420px]"
            value={ratio * 100}
            hideValue
            aria-label={`${format(spent)} of ${format(card.limit.amount)} spent ${PERIOD_NOUN[card.limit.period]}`}
            fillColor={ratio >= 0.9 ? "var(--color-foren-warning)" : undefined}
          />
        )}
        <p className="tnum mt-2 text-[13px] text-fg-3">
          {perTxn
            ? `Up to ${format(card.limit.amount)} per charge`
            : `${format({ minor: left, currency: card.limit.amount.currency })} left of ${format(card.limit.amount)} ${PERIOD_PHRASE[card.limit.period]}`}
          {pending > 0 && ` · ${format({ minor: pending, currency: card.limit.amount.currency })} pending`}
        </p>

        <div className="mt-4 space-y-2 empty:hidden">
          {frozen && card.adminLock && (
            <Note tone="warning" icon={<RiLockLine />}>
              <span className="font-semibold">Locked by {card.adminLock.by}.</span> {card.adminLock.reason ? `“${card.adminLock.reason}” ` : ""}
              No payments will go through, and only an account admin can unlock it.
            </Note>
          )}
          {frozen && !card.adminLock && (
            <Note tone="info" icon={<RiSnowflakeLine />}>
              {COPY.cardFrozen}
              {pendingUnfreeze && <span className="block text-fg-2">Unfreeze requested {timeAgo(pendingUnfreeze.createdAt, now)}. Waiting for the account owner.</span>}
            </Note>
          )}
          {canceled && <Note tone="error">This card has been canceled. It can’t be used or reactivated.{card.archived && " It’s in Archived."}</Note>}
          {card.kind === "emergency" && (
            <Note tone={emergencyDead ? "error" : "warning"} icon={<RiTimeLine />}>
              {emergencyDead ? "This emergency card is no longer usable." : `Single use at ${locked?.name}. Valid for ${countdown(emergencyLeft!)} more.`}
            </Note>
          )}
          {pendingLimit && (
            <Note tone="neutral">
              Limit increase to <Money value={pendingLimit.newLimit!.amount} /> requested {timeAgo(pendingLimit.createdAt, now)}. Waiting for the account owner.
            </Note>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-line px-6 py-4 sm:flex sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
        {!canceled && (
          <ForenButton
            size="xxs"
            variant={frozen ? "primary" : "outline"}
            leadingIcon={frozen ? (card.adminLock ? <RiLockUnlockLine /> : undefined) : <RiSnowflakeLine />}
            disabled={freeze.pending || unfreeze.pending || emergencyDead || (!frozen && !can(role, "freeze", card)) || (frozen && !!card.adminLock && !can(role, "unfreeze", card)) || (frozen && !!pendingUnfreeze)}
            onClick={toggleFreeze}
          >
            {!frozen ? "Freeze" : card.adminLock ? (can(role, "unfreeze", card) ? "Unlock" : "Locked by an admin") : can(role, "unfreeze", card) ? "Unfreeze" : pendingUnfreeze ? "Unfreeze requested" : "Request unfreeze"}
          </ForenButton>
        )}
        <LinkButton href={`/cards/${card.id}/transactions`} variant="outline" size="xxs" leadingIcon={<RiFileList3Line />}>
          Transactions
        </LinkButton>
        {!canceled && (
          <LinkButton href={`/travel?card=${card.id}`} variant="outline" size="xxs" leadingIcon={<RiPlaneLine />}>
            Spending abroad
          </LinkButton>
        )}
        {canceled && !card.archived && can(role, "archive", card) && (
          <ForenButton size="xxs" variant="outline" onClick={() => onPick("archive")}>
            Archive
          </ForenButton>
        )}
      </div>
    </section>
  );
}

function BigAmount({ value }: { value: Card["limit"]["amount"] }) {
  const s = format(value);
  const dot = s.lastIndexOf(".");
  return (
    <div className="tnum mt-0.5 text-[40px] leading-[54px] font-semibold tracking-[-0.02em] text-fg">
      {dot > 0 ? s.slice(0, dot) : s}
      {dot > 0 && <span className="text-[24px] text-fg-3">{s.slice(dot)}</span>}
    </div>
  );
}

const NOTE_INTENT = { info: "info", warning: "warning", error: "error", neutral: "default" } as const;

/** Status messages use the DS Info note, allowed to wrap onto several lines. */
function Note({ tone, icon, children }: { tone: keyof typeof NOTE_INTENT; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <ForenInfoNote intent={NOTE_INTENT[tone]} icon={icon} className="h-auto items-start rounded-[14px] py-2.5 [&>span]:whitespace-normal [&>svg]:mt-0.5">
      {children}
    </ForenInfoNote>
  );
}

// ---------------------------------------------------------------- tabs

type TabKey = "transactions" | "controls" | "subscriptions";

/** Recent transactions, Card controls and Subscriptions share one panel, switched with the DS Segmented control. */
function CardTabs({ card, onPick }: { card: Card; onPick: (d: DialogKind) => void }) {
  const params = useSearchParams();
  const subs = useStore((s) => s.subscriptions).filter((s) => s.cardId === card.id);
  const initial = params.get("tab");
  const [tab, setTab] = React.useState<TabKey>(initial === "controls" || initial === "subscriptions" ? initial : "transactions");
  const options: { value: TabKey; label: string }[] = [
    { value: "transactions", label: "Recent transactions" },
    ...(card.status !== "canceled" ? [{ value: "controls" as const, label: "Card controls" }] : []),
    { value: "subscriptions", label: subs.length ? `Subscriptions · ${subs.length}` : "Subscriptions" },
  ];
  const active = options.some((o) => o.value === tab) ? tab : "transactions";
  return (
    <section className={cn(panel, "px-6 py-4")} aria-label="Card activity and controls">
      <div className="max-w-full overflow-x-auto">
        <ForenSegmentedControl size="lg" ariaLabel="Card sections" options={options} value={active} onChange={setTab} />
      </div>
      <div className="mt-6" role="tabpanel" aria-label={options.find((o) => o.value === active)?.label}>
        {active === "transactions" && <TransactionsTab card={card} />}
        {active === "controls" && <Controls card={card} onPick={onPick} />}
        {active === "subscriptions" && <SubscriptionsTab card={card} />}
      </div>
    </section>
  );
}

function TransactionsTab({ card }: { card: Card }) {
  const router = useRouter();
  const txns = useStore((s) => s.transactions).filter((t) => t.cardId === card.id);
  if (txns.length === 0)
    return (
      <p className="rounded-[14px] bg-canvas px-4 py-6 text-center text-[13px] text-fg-3">
        <span className="block font-medium text-fg-2">{COPY.transactionsEmpty.title}</span>
        {COPY.transactionsEmpty.body}
      </p>
    );
  return (
    <>
      <ForenTable className="table-flush" caption={`Recent transactions on ${card.nickname}`} minWidth={0}>
        <ForenTableHead>
          <tr>
            <ForenTableHeaderCell label="Description" />
            <ForenTableHeaderCell label="Status" className="hidden sm:table-cell" />
            <ForenTableHeaderCell label="Amount" align="right" />
          </tr>
        </ForenTableHead>
        <ForenTableBody>
          {txns.slice(0, 6).map((t, i, all) => {
            const m = merchantById(t.merchantId);
            return (
              <ForenTableRow key={t.id} last={i === all.length - 1} onClick={() => router.push(`/cards/${card.id}/transactions?tx=${t.id}`)}>
                <ForenTableCell
                  label={
                    <Link href={`/cards/${card.id}/transactions?tx=${t.id}`} className="outline-none focus-visible:underline" onClick={(e) => e.stopPropagation()}>
                      {m?.name}
                    </Link>
                  }
                  description={t.legs.some((l) => l.fx) ? "Converted" : t.status === "declined" ? "Not charged" : "No conversion"}
                  avatar={{ initials: m?.mark, name: m?.name }}
                />
                <ForenTableCell type="badge" label={TX_STATUS[t.status]} color={TX_COLOR[t.status]} className="hidden sm:table-cell" />
                <ForenTableCell
                  align="right"
                  label={<Money value={t.amount} sign={t.status === "refunded" ? "+" : undefined} className={cn(t.status === "declined" && "text-fg-3 line-through")} />}
                  description={new Date(t.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                />
              </ForenTableRow>
            );
          })}
        </ForenTableBody>
      </ForenTable>
      <LinkButton href={`/cards/${card.id}/transactions`} variant="secondary" size="xxs" className="mt-3 w-full">
        View all transactions
      </LinkButton>
    </>
  );
}

const TX_STATUS: Record<Transaction["status"], string> = { approved: "Paid", declined: "Declined", pending: "Pending", refunded: "Refunded" };
const TX_COLOR: Record<Transaction["status"], BadgeColor> = { approved: "success", declined: "error", pending: "orange", refunded: "gray" };

// ---------------------------------------------------------------- card controls

/**
 * Card controls in the Settings › Security pattern: each row says what the control does and
 * what it's set to now, with a switch (applies straight away) or a Change button.
 */
function Controls({ card, onPick }: { card: Card; onPick: (d: DialogKind) => void }) {
  const role = useStore((s) => s.role);
  const txns = useStore((s) => s.transactions);
  const now = useNow(30_000);
  const save = useAction(updateCard);
  const freeze = useAction(freezeCard);
  const unfreeze = useAction(unfreezeCard);
  const me = currentUserId(role);
  const canEdit = can(role, "edit", card) && card.kind !== "emergency";
  const controls = card.controls ?? DEFAULT_CONTROLS;
  const frozen = card.status === "frozen";

  if (card.status === "canceled") return null;

  const setControl = async (k: keyof CardControls, v: boolean, done: string) => {
    if ((await save.run(card.id, { controls: { ...controls, [k]: v } })).ok) toast(done);
  };

  const perTxn = card.limit.period === "per_txn";
  const spent = perTxn ? null : spentInPeriod(card, txns, now);
  const limitValue = perTxn
    ? `Up to ${format(card.limit.amount)} per charge`
    : `${format(card.limit.amount)} ${PERIOD_PHRASE[card.limit.period]} · ${format({ minor: Math.max(0, card.limit.amount.minor - spent!.minor), currency: spent!.currency })} left`;
  const period =
    card.activeFrom || card.activeUntil ? `${card.activeFrom ? shortDate(card.activeFrom) : "Now"} – ${card.activeUntil ? shortDate(card.activeUntil) : "no end"}` : "Any day";

  const freezeRow = (() => {
    if (card.adminLock)
      return {
        desc: `Locked by ${card.adminLock.by}. Only an admin can unlock it.`,
        action: can(role, "unfreeze", card) ? <RowButton onClick={() => onPick("unlock")}>Unlock</RowButton> : <span className="text-[12px] font-medium text-fg-3">Locked</span>,
      };
    if (frozen && !can(role, "unfreeze", card)) return { desc: "Frozen. Only the account owner can unfreeze it.", action: <RowButton onClick={() => onPick("request-unfreeze")}>Ask to unfreeze</RowButton> };
    return {
      desc: frozen ? "All payments are declined." : "Stops all payments until you turn it off.",
      action: (
        <ForenToggle
          aria-label="Freeze card"
          checked={frozen}
          disabled={!can(role, "freeze", card) || freeze.pending || unfreeze.pending}
          onCheckedChange={async (v) => {
            const r = v ? await freeze.run(card.id) : await unfreeze.run(card.id);
            if (r.ok) toast(v ? "Card frozen" : "Card unfrozen");
          }}
        />
      ),
    };
  })();

  return (
    <div>
      <p className="text-[14px] leading-[21px] text-fg-2">
        {canEdit ? "Changes apply straight away." : "Only the account owner can change these."}
      </p>

      <ControlGroup title="Payments">
        <Row title="Freeze card" desc={freezeRow.desc} action={freezeRow.action} />
        <Row
          title="Payments in other currencies"
          desc={controls.foreignCurrency ? "USD, GBP, EUR and CAD charges are allowed." : "Only NGN charges go through."}
          action={<ForenToggle aria-label="Payments in other currencies" checked={controls.foreignCurrency} disabled={!canEdit || save.pending} onCheckedChange={(v) => setControl("foreignCurrency", v, v ? "Payments in other currencies turned on" : "Payments in other currencies turned off")} />}
        />
        <Row
          title="Payments without a security code"
          desc={controls.non3ds ? "Allowed. Most subscriptions need this." : "Only payments with a security code go through."}
          action={<ForenToggle aria-label="Payments without a security code" checked={controls.non3ds} disabled={!canEdit || save.pending} onCheckedChange={(v) => setControl("non3ds", v, v ? "Payments without a security code turned on" : "Payments without a security code turned off")} />}
        />
      </ControlGroup>

      <ControlGroup title="Limits and rules">
        <Row
          title="Spending limit"
          desc={limitValue}
          action={
            canEdit ? (
              <RowButton onClick={() => onPick("limit")}>Change</RowButton>
            ) : card.holderId === me && card.status === "active" ? (
              <RowButton onClick={() => onPick("limit-request")}>Ask for more</RowButton>
            ) : null
          }
        />
        <Row title="Where it can be used" desc={permissionSentence(card)} action={canEdit ? <RowLink href={`/cards/${card.id}/edit`}>Change</RowLink> : null} />
        <Row title="Spending period" desc={period} action={canEdit ? <RowButton onClick={() => onPick("period")}>{card.activeFrom || card.activeUntil ? "Change" : "Set dates"}</RowButton> : null} />
        <Row title="Which balance pays" desc={`${strategyLabel(card.funding)} · ${FUNDING_HINT[card.funding.strategy]}`} action={canEdit ? <RowLink href={`/cards/${card.id}/edit`}>Change</RowLink> : null} />
      </ControlGroup>

      <ControlGroup title="Manage card">
        <Row title="Nickname" desc={card.nickname} action={canEdit ? <RowButton onClick={() => onPick("nickname")}>Change</RowButton> : null} />
        <Row title="History" desc="Every change, who made it and when." action={<RowButton onClick={() => onPick("history")}>View</RowButton>} />
        {can(role, "testCharge", card) && (
          <Row title="Test a charge" desc="Check a payment without charging anything." action={<RowLink href={`/cards/${card.id}/test-charge`}>Test</RowLink>} />
        )}
        {can(role, "cancel", card) && card.status === "active" && (
          <Row title="Lock card" desc="Only an admin can unlock it." action={<RowButton onClick={() => onPick("lock")}>Lock</RowButton>} />
        )}
        {can(role, "cancel", card) && (
          <Row
            title="Cancel card"
            desc="Permanent. Subscriptions on it will fail."
            action={
              <RowButton destructive onClick={() => onPick("cancel")}>
                Cancel card
              </RowButton>
            }
          />
        )}
      </ControlGroup>
    </div>
  );
}

const FUNDING_HINT: Record<Card["funding"]["strategy"], string> = {
  cheapest_fx: "lowest cost per charge",
  protect: "spent last",
  custom: "your order",
};

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-[12px] font-semibold tracking-[0.01em] text-fg-3 uppercase">{title}</h3>
      <ul className="divide-y divide-line rounded-[20px] border border-line">{children}</ul>
    </div>
  );
}

function Row({ title, desc, action }: { title: string; desc: React.ReactNode; action: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-6 px-5 py-3">
      <div className="min-w-0">
        <div className="text-[14px] leading-[21px] font-medium text-fg">{title}</div>
        <div className="mt-1 text-[14px] leading-[21px] text-fg-3">{desc}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </li>
  );
}

function RowButton({ onClick, children, destructive }: { onClick: () => void; children: React.ReactNode; destructive?: boolean }) {
  return (
    <ForenButton variant="outline" size="xxs" destructive={destructive} onClick={onClick}>
      {children}
    </ForenButton>
  );
}

function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <LinkButton href={href} variant="outline" size="xxs">
      {children}
    </LinkButton>
  );
}

const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// ---------------------------------------------------------------- right column

/** The card itself, with its details shown in place (Revolut "See details"). */
function CardDetails({ card }: { card: Card }) {
  const role = useStore((s) => s.role);
  const [shown, setShown] = React.useState(false);
  const allowed = can(role, "viewDetails", card) && card.status !== "canceled";
  const locked = card.lockedMerchantId ? merchantById(card.lockedMerchantId) : undefined;
  // Test number only: Visa test range.
  const pan = `4000 0012 3456 ${card.last4}`;
  const expiry = `${card.expiry.slice(5)}/${card.expiry.slice(2, 4)}`;
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ""));
    } catch {
      /* clipboard may be unavailable in some browsers */
    }
    toast(`${label} copied`);
  };

  return (
    <section className={cn(panel, "p-5")} aria-labelledby="card-details-title">
      <div className="flex justify-center">
        <CardArt
          card={card}
          size="md"
          holderName={nameOnCard(card)}
          merchantName={locked?.name}
          lockText={lockText(card)}
          className={cn((card.status === "frozen" || card.status === "canceled") && "opacity-60 saturate-50")}
        />
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <h2 id="card-details-title" className="text-[16px] font-semibold text-fg">
          Card details
        </h2>
        {allowed && (
          <ForenButton size="xxs" variant={shown ? "secondary" : "primary"} leadingIcon={shown ? <RiEyeOffLine /> : <RiEyeLine />} onClick={() => setShown((v) => !v)}>
            {shown ? "Hide details" : "Show details"}
          </ForenButton>
        )}
      </div>
      {allowed ? (
        <div className="mt-3 divide-y divide-line">
          <DetailRow label="Card number" value={shown ? pan : `•••• •••• •••• ${card.last4}`} onCopy={shown ? () => copy("Card number", pan) : undefined} />
          <DetailRow label="Expiry" value={expiry} onCopy={() => copy("Expiry", expiry)} />
          <DetailRow label="Security code (CVC)" value={shown ? "123" : "•••"} onCopy={shown ? () => copy("Security code", "123") : undefined} />
          <DetailRow label="Name on card" value={nameOnCard(card) ?? ""} onCopy={() => copy("Name", nameOnCard(card) ?? "")} />
        </div>
      ) : (
        <p className="mt-3 rounded-[14px] bg-canvas px-3.5 py-3 text-[13px] leading-[18px] text-fg-3">
          {card.status === "canceled" ? "Not available for canceled cards." : "Only the cardholder and account owner can see these."}
        </p>
      )}
      {allowed && shown && <p className="mt-2 text-[12px] text-fg-3">Test data</p>}
      <div className="mt-4 empty:hidden">
        <WalletButtons card={card} />
      </div>
    </section>
  );
}

function DetailRow({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="text-[12px] text-fg-3">{label}</div>
        <div className="tnum truncate text-[14px] font-medium tracking-[0.02em] text-fg">{value}</div>
      </div>
      <ForenButton
        variant="ghost"
        size="xxs"
        aria-label={`Copy ${label.toLowerCase()}`}
        disabled={!onCopy}
        onClick={onCopy}
        leadingIcon={<RiFileCopyLine />}
        className={cn("px-2", !onCopy && "invisible")}
      />
    </div>
  );
}

function AboutCard({ card }: { card: Card }) {
  const holder = personById(card.holderId);
  const a = card.billingAddress;
  const rows: [string, React.ReactNode][] = [
    card.companyCard ? ["Used by", (card.contactIds ?? [card.holderId]).map((id) => personById(id)?.name).join(", ")] : ["Cardholder", holder?.name],
    ["Type", card.companyCard ? "Company card · virtual" : "Virtual card"],
    ["Created", new Date(card.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })],
    ["Expires", `${card.expiry.slice(5)}/${card.expiry.slice(0, 4)}`],
    ["Billing address", <span key="a" className="block max-w-[190px]">{a.line1}, {a.city} {a.postcode}</span>],
    ...(card.wallets?.length ? ([["Mobile wallets", card.wallets.map((w) => (w === "apple" ? "Apple Pay" : "Google Pay")).join(", ")]] as [string, React.ReactNode][]) : []),
  ];
  return (
    <section aria-labelledby="about-title" className="pt-7">
      <h2 id="about-title" className="mb-2 text-[20px] leading-[28px] font-semibold text-fg">
        About this card
      </h2>
      <dl className={cn(panel, "divide-y divide-line px-4")}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 py-3 text-[14px]">
            <dt className="shrink-0 text-fg-2">{k}</dt>
            <dd className="text-right text-fg">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SubscriptionsTab({ card }: { card: Card }) {
  const router = useRouter();
  const subs = useStore((s) => s.subscriptions).filter((s) => s.cardId === card.id);
  const now = useNow(60_000);
  if (subs.length === 0)
    return <p className="rounded-[14px] bg-canvas px-4 py-6 text-center text-[13px] text-fg-3">No subscriptions yet</p>;
  return (
    <ForenTable className="table-flush" caption={`Subscriptions on ${card.nickname}`} minWidth={0}>
      <ForenTableHead>
        <tr>
          <ForenTableHeaderCell label="Merchant" />
          <ForenTableHeaderCell label="Next charge" className="hidden sm:table-cell" />
          <ForenTableHeaderCell label="Amount" align="right" />
        </tr>
      </ForenTableHead>
      <ForenTableBody>
        {subs.map((s, i) => {
          const m = merchantById(s.merchantId);
          const f = forecast(s, now);
          return (
            <ForenTableRow key={s.id} last={i === subs.length - 1} onClick={() => router.push(`/subscriptions?sub=${s.id}`)}>
              <ForenTableCell
                label={
                  <Link href={`/subscriptions?sub=${s.id}`} className="outline-none focus-visible:underline" onClick={(e) => e.stopPropagation()}>
                    {m?.name}
                  </Link>
                }
                description={s.frequency === "yearly" ? "Yearly" : "Monthly"}
                avatar={{ initials: m?.mark, name: m?.name }}
              />
              {s.blocked ? (
                <ForenTableCell type="badge" label="Blocked on this card" color="error" className="hidden sm:table-cell" />
              ) : (
                <ForenTableCell
                  className="hidden sm:table-cell"
                  label={f.kind === "estimate" ? f.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Not enough history"}
                  description={f.kind === "estimate" ? "Estimate" : COPY.insufficientHistory}
                />
              )}
              <ForenTableCell align="right" label={<Money value={s.usualAmount} />} />
            </ForenTableRow>
          );
        })}
      </ForenTableBody>
    </ForenTable>
  );
}
