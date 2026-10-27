"use client";
import { TransactionPinDialog } from "@/components/transaction-pin";
import { PageHeader } from "@/components/page-header";
import {
  ForenTable,
  ForenTableBody,
  ForenTableHead,
  ForenTableHeaderCell,
  ForenTableRow,
} from "@/components/ui/foren-table";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import * as React from "react";
import Link from "next/link";
import { RiAlarmWarningLine, RiCheckLine, RiCloseLine, RiInboxLine } from "@remixicon/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ForenBadge, type BadgeColor } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenInput } from "@/components/ui/foren-input";
import { ForenSearch } from "@/components/ui/foren-search";
import { CardArt } from "@/components/card/card-art";
import { countdown, timeAgo } from "@/components/cards/card-detail";
import { MerchantLogo } from "@/components/merchant-logo";
import { Money } from "@/components/money";
import { Modal, Sheet } from "@/components/overlay";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { POLICY } from "@/config/policy";
import { DECLINE } from "@/content/copy";
import { CATEGORY_LABEL, PERIOD_PHRASE } from "@/domain/labels";
import { format, parseAmount } from "@/domain/money";
import type { Card, CardRequest, Currency, Merchant } from "@/domain/types";
import { MERCHANTS, merchantById } from "@/fixtures/merchants";
import { decideRequest, requestEmergencyCard } from "@/lib/actions";
import { useAction, useLoad } from "@/lib/api";
import { can } from "@/lib/permissions";
import { currentUserId, personById, requestState, useNow, useStore } from "@/lib/store";

const KIND_LABEL: Record<CardRequest["kind"], string> = {
  one_time_approval: "One-time approval",
  unfreeze: "Unfreeze card",
  emergency_card: "Emergency card",
  new_card: "New card",
  limit_increase: "Limit increase",
};

const STATE: Record<CardRequest["state"], { label: string; color: BadgeColor }> = {
  pending: { label: "Waiting for decision", color: "orange" },
  approved: { label: "Approved", color: "success" },
  denied: { label: "Declined", color: "error" },
  expired: { label: "Expired", color: "gray" },
  used: { label: "Used", color: "gray" },
};

export function RequestsPage() {
  const role = useStore((s) => s.role);
  const all = useStore((s) => s.requests);
  const now = useNow(1000);
  const { status, retry } = useLoad("requests");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = React.useState<"pending" | "history">("pending");
  const [emergencyOpen, setEmergencyOpen] = React.useState(false);
  const approver = can(role, "approve");
  const mine = approver || role === "finance" ? all : all.filter((r) => r.requesterId === currentUserId(role));
  const pending = mine.filter((r) => requestState(r, now) === "pending");
  const history = mine.filter((r) => requestState(r, now) !== "pending");
  const list = tab === "pending" ? pending : history;
  const openId = params.get("r");
  const selected = mine.find((r) => r.id === openId);
  const split = false; // details open in a drawer (Figma), so the list keeps its full width
  const select = (id: string | null) => router.replace(`${pathname}${id ? `?r=${id}` : ""}`, { scroll: false });

  return (
    <div>
      <PageHeader
        title="Requests"
        description={approver ? "Approve or decline what your team asks for." : "What you’ve asked the account owner for."}
        actions={
          role === "cardholder" && (
            <ForenButton size="xxs" variant="outline" leadingIcon={<RiAlarmWarningLine />} onClick={() => setEmergencyOpen(true)}>
              Request emergency card
            </ForenButton>
          )
        }
        tabs={
        <ForenSegmentedControl
          size="lg"
          ariaLabel="Requests"
          options={[
            { value: "pending", label: `${approver ? "To review" : "Open"} · ${pending.length}` },
            { value: "history", label: "History" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
        />
        }
      />

      {status === "loading" && <LoadingRows rows={3} />}
      {status === "error" && <ErrorState onRetry={retry} />}
      {status === "ready" && (
        <div className={cn("grid items-start gap-6", split && "grid-cols-[minmax(0,1fr)_420px]")}>
          <div className="min-w-0">
            {list.length === 0 ? (
              <EmptyState
                icon={<RiInboxLine />}
                title={tab === "pending" ? "Nothing waiting" : "No past requests"}
                body={tab === "pending" ? (approver ? "When a cardholder asks for an approval, unfreeze or emergency card, it’ll appear here." : "Requests you send from a declined payment or a frozen card appear here.") : "Decided requests appear here."}
              />
            ) : (
              <RequestTable list={list} now={now} compact={split} selectedId={openId} onSelect={(id) => select(id === openId ? null : id)} />
            )}
          </div>
        </div>
      )}
      {(
        <Sheet open={!!selected} onOpenChange={(o) => !o && select(null)} title="Request details">
          {selected && <RequestDetail r={selected} canDecide={approver} />}
        </Sheet>
      )}
      <EmergencyRequestModal key={emergencyOpen ? "open" : "closed"} open={emergencyOpen} onOpenChange={setEmergencyOpen} />
    </div>
  );
}

export function requestTitle(r: CardRequest, card?: Card) {
  if (r.kind === "unfreeze") return `Unfreeze ${card?.nickname ?? "card"} •• ${card?.last4 ?? ""}`;
  if (r.kind === "limit_increase") return `${card?.nickname ?? "Card"} · up to ${format(r.newLimit!.amount)} ${PERIOD_PHRASE[r.newLimit!.period]}`;
  if (r.kind === "new_card") return `${r.newCard!.nickname} · up to ${format(r.newCard!.limit.amount)} ${PERIOD_PHRASE[r.newCard!.limit.period]}`;
  return `${format(r.amount!)} at ${merchantById(r.merchantId!)?.name}`;
}

/** Revolut-style status icon: the request's subject with a small state marker. */
export function RequestIcon({ r, state, size = 36 }: { r: CardRequest; state: CardRequest["state"]; size?: number }) {
  const card = useStore((s) => s.cards.find((c) => c.id === r.cardId));
  const m = r.merchantId ? merchantById(r.merchantId) : undefined;
  const mark = state === "approved" || state === "used" ? "bg-success" : state === "denied" ? "bg-error" : state === "pending" ? "bg-warning" : "bg-fg-3";
  return (
    <span className="relative shrink-0" aria-hidden>
      {m ? (
        <MerchantLogo merchant={m} size={size} />
      ) : card ? (
        <CardArt card={card} size="xs" />
      ) : r.newCard ? (
        <CardArt card={{ design: r.newCard.design, nickname: r.newCard.nickname, last4: "", kind: "standard", status: "active" }} size="xs" className="opacity-60" />
      ) : null}
      <span className={cn("absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface", mark)} />
    </span>
  );
}

function RequestTable({ list, now, compact, selectedId, onSelect }: { list: CardRequest[]; now: Date; compact: boolean; selectedId: string | null; onSelect: (id: string) => void }) {
  const cards = useStore((s) => s.cards);
  return (
    <>
      <div className="hidden rounded-[20px] bg-surface px-6 py-4 md:block">
      <ForenTable className="table-flush" caption="Requests" minWidth={640}>
        <ForenTableHead>
          <tr>
            <ForenTableHeaderCell label="Request" />
            <ForenTableHeaderCell label="From" />
            {!compact && <ForenTableHeaderCell label="Card" />}
            <ForenTableHeaderCell label="Status" align="right" />
          </tr>
        </ForenTableHead>
        <ForenTableBody>
          {list.map((r) => {
            const card = cards.find((c) => c.id === r.cardId);
            const state = requestState(r, now);
            const sel = r.id === selectedId;
            return (
              <ForenTableRow key={r.id} onClick={() => onSelect(r.id)} aria-selected={sel} selected={sel}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <RequestIcon r={r} state={state} size={32} />
                    <button
                      className="min-w-0 text-left outline-none focus-visible:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(r.id);
                      }}
                    >
                      <span className="tnum block truncate text-[13px] font-medium text-fg">{requestTitle(r, card)}</span>
                      <span className="block truncate text-[12px] text-fg-3">
                        {KIND_LABEL[r.kind]} · {timeAgo(r.createdAt, now)}
                      </span>
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[13px] text-fg">{personById(r.requesterId)?.name}</td>
                {!compact && <td className="tnum px-4 py-2.5 text-[13px] text-fg-2">{card ? `•• ${card.last4} ${card.nickname}` : "—"}</td>}
                <td className="px-4 py-2.5 text-right">
                  <ForenBadge size="sm" color={STATE[state].color} dot>
                    {STATE[state].label}
                  </ForenBadge>
                </td>
              </ForenTableRow>
            );
          })}
        </ForenTableBody>
      </ForenTable>
      </div>
      {/* Phone list (Revolut "Card requests") */}
      <ul className="divide-y divide-line md:hidden">
        {list.map((r) => {
          const card = cards.find((c) => c.id === r.cardId);
          const state = requestState(r, now);
          return (
            <li key={r.id}>
              <button onClick={() => onSelect(r.id)} className="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-subtle">
                <RequestIcon r={r} state={state} />
                <span className="min-w-0 flex-1">
                  <span className="tnum block truncate text-[14px] font-semibold text-fg">{requestTitle(r, card)}</span>
                  <span className="block truncate text-[12px] text-fg-3">
                    {personById(r.requesterId)?.name} · {timeAgo(r.createdAt, now)}
                  </span>
                  <span className={cn("block text-[12px] font-medium", state === "denied" ? "text-error" : state === "pending" ? "text-warning" : "text-fg-2")}>{STATE[state].label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Revolut request detail: decision buttons first, then status + approvals, note and request details. */
export function RequestDetail({ r, canDecide }: { r: CardRequest; canDecide: boolean }) {
  const now = useNow(1000);
  const card = useStore((s) => s.cards.find((c) => c.id === r.cardId));
  const issued = useStore((s) => s.cards.find((c) => c.id === r.issuedCardId));
  const state = requestState(r, now);
  const requester = personById(r.requesterId);
  const m = r.merchantId ? merchantById(r.merchantId) : undefined;
  const decide = useAction(decideRequest);
  const [denying, setDenying] = React.useState(false);
  const [denyNote, setDenyNote] = React.useState("");
  const [pinOpen, setPinOpen] = React.useState(false);
  const approveLabel = r.kind === "emergency_card" ? "Approve and issue" : r.kind === "unfreeze" ? "Unfreeze" : r.kind === "new_card" ? "Approve and create" : r.kind === "limit_increase" ? "Approve new limit" : "Approve once";
  // Approving needs the transaction PIN first.
  const approve = async () => {
    if (!(await decide.run(r.id, true)).ok) return false;
    setPinOpen(false);
    toast(r.kind === "one_time_approval" ? `Approved for one charge. ${requester?.name.split(" ")[0]} has ${POLICY.approvalWindowMinutes} minutes to retry.` : r.kind === "unfreeze" ? "Card unfrozen" : r.kind === "new_card" ? `Card created for ${requester?.name.split(" ")[0]}` : r.kind === "limit_increase" ? "New limit approved" : "Emergency card issued");
    return true;
  };
  const when = new Date(r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-5 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-fg-3">{KIND_LABEL[r.kind]}</p>
          <h2 className="tnum mt-0.5 text-[20px] leading-[26px] font-semibold tracking-[-0.01em] text-fg">{requestTitle(r, card)}</h2>
          <p className="mt-0.5 text-[13px] text-fg-3">{when}</p>
        </div>
        <RequestIcon r={r} state={state} size={40} />
      </div>

      {canDecide && state === "pending" && (
        <div>
          <div className="flex gap-2">
            <ForenButton size="sm" leadingIcon={<RiCheckLine />} disabled={decide.pending} onClick={() => setPinOpen(true)}>
              {approveLabel}
            </ForenButton>
            <ForenButton size="sm" variant="secondary" leadingIcon={<RiCloseLine />} disabled={decide.pending} onClick={() => setDenying(true)}>
              Decline
            </ForenButton>
          </div>
          <p className="mt-2 text-[12px] leading-[17px] text-fg-3">
            {r.kind === "one_time_approval"
              ? `Approving lets this exact charge through once within ${POLICY.approvalWindowMinutes} minutes. The card’s permissions and limits don’t change.`
              : r.kind === "emergency_card"
                ? `Issues a single-use card locked to ${m?.name}, valid for ${POLICY.emergencyValidityMinutes} minutes${POLICY.emergencyCeiling ? `, up to ${format(POLICY.emergencyCeiling)}` : ""}.`
                : r.kind === "limit_increase"
                  ? "The new limit applies to this card straight away. Nothing else about the card changes."
                  : r.kind === "new_card"
                  ? `Creates the card in ${requester?.name.split(" ")[0]}’s name with these settings. It pays from your balances using Cheapest FX, and you can change anything later.`
                  : "Unfreezing lets new charges and subscriptions go through on this card again."}
          </p>
          {decide.error && !denying && <p role="alert" className="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t record your decision. Nothing changed. Try again.</p>}
        </div>
      )}

      <section className="rounded-[16px] bg-sunken p-4">
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span className="text-fg-2">Status</span>
          <ForenBadge size="sm" color={STATE[state].color} dot>
            {STATE[state].label}
          </ForenBadge>
        </div>
        <ApprovalTimeline r={r} state={state} requester={requester?.name ?? "Team member"} />
        {state === "approved" && r.kind === "one_time_approval" && r.windowEndsAt && (
          <p className="tnum mt-3 text-[13px] text-success">Retry window: {countdown(new Date(r.windowEndsAt).getTime() - now.getTime())} left. Applies to this one charge only.</p>
        )}
        {state === "approved" && r.kind === "new_card" && issued && (
          <p className="mt-3 text-[13px] text-fg-2">
            Created card •• {issued.last4}.{" "}
            <Link href={`/cards/${issued.id}`} className="font-semibold text-fg underline-offset-2 hover:underline">
              View card
            </Link>
          </p>
        )}
        {state === "approved" && r.kind === "emergency_card" && issued && (
          <p className="mt-3 text-[13px] text-fg-2">
            Issued emergency card •• {issued.last4} — {issued.used ? "used" : new Date(issued.validUntil!) > now ? `valid for ${countdown(new Date(issued.validUntil!).getTime() - now.getTime())}` : "expired"}.
          </p>
        )}
      </section>

      {r.note && (
        <section className="rounded-[16px] bg-sunken p-4">
          <div className="text-[12px] font-medium text-fg-3">Note from {requester?.name.split(" ")[0]}</div>
          <p className="mt-1 text-[14px] leading-[20px] text-fg">{r.note}</p>
        </section>
      )}

      <section>
        <h3 className="mb-1 text-[14px] font-semibold text-fg">Request details</h3>
        <dl className="divide-y divide-line text-[13px]">
          <Detail label="Requested by">{requester?.name}</Detail>
          {card && <Detail label="Card">{`${card.nickname} •• ${card.last4}`}</Detail>}
          {m && <Detail label="Merchant">{m.name}</Detail>}
          {r.amount && (
            <Detail label="Amount">
              <Money value={r.amount} />
            </Detail>
          )}
          {r.reason && <Detail label="Declined because">{DECLINE[r.reason].title}</Detail>}
          {r.newLimit && (
            <>
              <Detail label="Current limit">{r.oldLimit ? <>Up to <Money value={r.oldLimit.amount} /> {PERIOD_PHRASE[r.oldLimit.period]}</> : "—"}</Detail>
              <Detail label="Asked for">
                Up to <Money value={r.newLimit.amount} /> {PERIOD_PHRASE[r.newLimit.period]}
              </Detail>
            </>
          )}
          {r.newCard && (
            <>
              <Detail label="Card name">{r.newCard.nickname}</Detail>
              <Detail label="Spending limit">
                Up to <Money value={r.newCard.limit.amount} /> {PERIOD_PHRASE[r.newCard.limit.period]}
              </Detail>
              <Detail label="Merchants">{r.newCard.oneMerchant ? "One merchant (locks to the first that charges it)" : "Many merchants"}</Detail>
            </>
          )}
        </dl>
      </section>


      <TransactionPinDialog open={pinOpen} onOpenChange={setPinOpen} action={approveLabel} onConfirm={approve} />
      <Modal open={denying} onOpenChange={setDenying} title="Decline request?" description={requestTitle(r, card)}>
        <label htmlFor={`deny-${r.id}`} className="mb-1.5 block text-[14px] font-medium text-fg">
          Reason <span className="font-normal text-fg-3">(optional)</span>
        </label>
        <textarea id={`deny-${r.id}`} rows={3} maxLength={500} value={denyNote} onChange={(e) => setDenyNote(e.target.value)} placeholder="e.g. Please use the travel card for flights." className="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus" />
        <div className="tnum mt-1 flex justify-between text-[12px] text-fg-3">
          <span>{requester?.name.split(" ")[0]} will see this.</span>
          <span>{denyNote.length}/500</span>
        </div>
        {decide.error && <p role="alert" className="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t record your decision. Try again.</p>}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ForenButton variant="secondary" size="sm" onClick={() => setDenying(false)}>
            Cancel
          </ForenButton>
          <ForenButton
            size="sm"
            destructive
            disabled={decide.pending}
            onClick={async () => {
              if ((await decide.run(r.id, false, denyNote.trim() || undefined)).ok) {
                setDenying(false);
                toast("Request declined");
              }
            }}
          >
            Decline request
          </ForenButton>
        </div>
      </Modal>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-fg-2">{label}</dt>
      <dd className="tnum text-right text-fg">{children}</dd>
    </div>
  );
}

function EmergencyRequestModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [merchant, setMerchant] = React.useState<Merchant | null>(null);
  const [q, setQ] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<Currency>("USD");
  const [note, setNote] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const req = useAction(requestEmergencyCard);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Request an emergency card" description={`For an urgent payment you can’t make with your usual card. The owner must approve it. It works once, only at one merchant, for ${POLICY.emergencyValidityMinutes} minutes.`}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <span className="text-[14px] font-medium text-fg">Merchant</span>
          {merchant ? (
            <div className="flex h-12 items-center gap-2 rounded-[16px] bg-subtle px-3">
              <MerchantLogo merchant={merchant} size={26} />
              <span className="flex-1 truncate text-[14px] font-medium">{merchant.name}</span>
              <button className="text-[13px] font-semibold text-fg-2 hover:underline" onClick={() => setMerchant(null)}>
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
                      .slice(0, 5)
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
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <ForenInput label="Amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} className="tnum" />
          <div className="flex flex-col gap-2">
            <label htmlFor="em-cur" className="text-[14px] font-medium text-fg">
              Currency
            </label>
            <select id="em-cur" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-focus">
              {POLICY.launchCurrencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="em-note" className="mb-1.5 block text-[14px] font-medium text-fg">
            Why is it urgent?
          </label>
          <textarea id="em-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={!!errors.note} className="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus" />
          {errors.note && <p className="mt-1 text-[12px] text-error">{errors.note}</p>}
        </div>
        {req.error && <p role="alert" className="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t send your request. Try again.</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ForenButton variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </ForenButton>
          <ForenButton
            size="sm"
            disabled={req.pending || !merchant || !((parseAmount(amount, currency)?.minor ?? 0) > 0) || !note.trim()}
            onClick={async () => {
              const e: Record<string, string> = {};
              const amt = parseAmount(amount, currency);
              if (!merchant) e.merchant = "Choose the merchant you need to pay.";
              if (!amt || amt.minor <= 0) e.amount = "Enter an amount above zero.";
              if (!note.trim()) e.note = "Add a reason so the owner can decide quickly.";
              setErrors(e);
              if (Object.keys(e).length) return;
              if ((await req.run({ merchantId: merchant!.id, amount: amt!, note: note.trim() })).ok) {
                toast("Emergency card requested");
                onOpenChange(false);
              }
            }}
          >
            {req.pending ? "Sending…" : "Send request"}
          </ForenButton>
        </div>
      </div>
    </Modal>
  );
}


/** Revolut-style approvals timeline: who asked, then who decided (or that it's still waiting). */
function ApprovalTimeline({ r, state, requester }: { r: CardRequest; state: CardRequest["state"]; requester: string }) {
  const t = (at?: string) => (at ? new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");
  const decided = state === "approved" || state === "denied" || state === "used" || (state === "expired" && !!r.decidedAt);
  const dot = (tone: "done" | "wait" | "bad") =>
    cn("relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full", tone === "done" ? "bg-success" : tone === "bad" ? "bg-error" : "bg-warning ring-4 ring-warning-subtle");
  const decision =
    state === "pending" ? (
      <>
        <span className="font-medium text-fg">Account owner</span> · Waiting for a decision
      </>
    ) : r.state === "denied" || state === "denied" ? (
      <>
        <span className="font-medium text-fg">Declined by {r.decidedBy ?? "the account owner"}</span> · {t(r.decidedAt)}
        {r.denyNote && <span className="block text-fg-2">“{r.denyNote}”</span>}
      </>
    ) : decided ? (
      <>
        <span className="font-medium text-fg">Approved by {r.decidedBy ?? "the account owner"}</span> · {t(r.decidedAt)}
      </>
    ) : (
      <>
        <span className="font-medium text-fg">Account owner</span> · No decision before it expired
      </>
    );
  return (
    <ol className="relative mt-3 space-y-2.5 text-[13px] leading-[18px] text-fg-3" aria-label="Approvals">
      <span className="absolute top-3 bottom-3 left-[4.5px] w-px bg-line-2" aria-hidden />
      <li className="flex gap-3">
        <span className={dot("done")} aria-hidden />
        <span>
          <span className="font-medium text-fg">Submitted by {requester}</span> · {t(r.createdAt)}
        </span>
      </li>
      <li className="flex gap-3">
        <span className={dot(state === "pending" ? "wait" : state === "denied" ? "bad" : decided ? "done" : "bad")} aria-hidden />
        <span>{decision}</span>
      </li>
    </ol>
  );
}
