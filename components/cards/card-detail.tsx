"use client";
import * as React from "react";
import {
  RiArchiveLine,
  RiFileCopyLine,
  RiAppleFill,
  RiGoogleFill,
  RiLockLine,
  RiLockUnlockLine,
  RiUserForbidLine,
  RiSnowflakeLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenInfoNote } from "@/components/ui/foren-info-note";
import { ForenInput } from "@/components/ui/foren-input";
import { CardArt } from "@/components/card/card-art";
import { CardStatusBadge } from "@/components/card/status-badge";
import { CardHistoryList } from "@/components/card/card-history";
import { nameOnCard } from "@/components/card/holder";
import { CancelConsequences } from "@/components/card/cancel-consequences";
import { Modal } from "@/components/overlay";
import { POLICY } from "@/config/policy";
import { COPY } from "@/content/copy";
import { PERIOD_LABEL, PERIOD_PHRASE } from "@/domain/labels";
import { format, parseAmount } from "@/domain/money";
import type { Card, LimitPeriod } from "@/domain/types";
import { lockCard, requestLimitIncrease, setSpendingPeriod, unlockCard, archiveCard, cancelCard, freezeCard, renameCard, requestUnfreeze, setCardLimit, unfreezeCard } from "@/lib/actions";
import { useAction } from "@/lib/api";
import { can } from "@/lib/permissions";
import { now as clockNow, currentUserId, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WalletModal, type Wallet } from "@/components/card/wallet-modal";

export type DialogKind = null | "freeze" | "unfreeze" | "request-unfreeze" | "cancel" | "archive" | "copy" | "limit" | "nickname" | "history" | "limit-request" | "lock" | "unlock" | "period" | "wallet";

/** Small confirmation modal that shows which card is affected (Mercury freeze/cancel pattern). */
function CardConfirm({
  open,
  onClose,
  card,
  title,
  body,
  confirmLabel,
  icon,
  destructive,
  action,
  okToast,
  alternative,
}: {
  open: boolean;
  onClose: () => void;
  card: Card;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  action: (id: string) => Promise<unknown>;
  okToast: string;
  /** A reversible option offered next to a destructive one (Revolut: "Freeze card temporarily"). */
  alternative?: { label: string; onClick: () => void };
}) {
  const a = useAction(action);
  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title={title}>
      <div className="flex items-center gap-3 border-y border-line py-3">
        <CardArt card={card} size="xs" />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-fg">{card.nickname}</div>
          <div className="text-[12px] text-fg-3">
            Card •• {card.last4}
          </div>
        </div>
      </div>
      <div className="mt-3 text-[14px] leading-[21px] text-fg-2">{body}</div>
      {a.error && (
        <p role="alert" className="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">
          {COPY.saveFailure}
        </p>
      )}
      <div className={cn("mt-5 flex flex-col-reverse gap-2", !alternative && "sm:flex-row sm:justify-end")}>
        <ForenButton variant="secondary" size="sm" onClick={onClose} disabled={a.pending}>
          Go back
        </ForenButton>
        {alternative && (
          <ForenButton variant="outline" size="sm" leadingIcon={<RiSnowflakeLine />} onClick={alternative.onClick} disabled={a.pending}>
            {alternative.label}
          </ForenButton>
        )}
        <ForenButton
          size="sm"
          destructive={destructive}
          leadingIcon={icon}
          disabled={a.pending}
          onClick={async () => {
            if ((await a.run(card.id)).ok) {
              toast(okToast);
              onClose();
            }
          }}
        >
          {a.pending ? "Working…" : confirmLabel}
        </ForenButton>
      </div>
    </Modal>
  );
}

/** Every dialog a card's actions can open. Remount per dialog so inputs reset between opens. */
export function CardDialogs({ card, dialog, setDialog }: { card: Card; dialog: DialogKind; setDialog: (d: DialogKind) => void }) {
  const role = useStore((s) => s.role);
  const close = () => setDialog(null);
  const reqUnfreeze = useAction(requestUnfreeze);
  const [note, setNote] = React.useState("");

  return (
    <>
      <CardConfirm
        open={dialog === "freeze"}
        onClose={close}
        card={card}
        title="Are you sure you want to freeze this card?"
        body="New charges and subscriptions on this card will fail while it’s frozen. Nothing is canceled, and it can be unfrozen later."
        confirmLabel="Freeze card"
        icon={<RiSnowflakeLine />}
        action={freezeCard}
        okToast="Card frozen"
      />
      <CardConfirm
        open={dialog === "unfreeze"}
        onClose={close}
        card={card}
        title="Unfreeze this card?"
        body="New charges and subscriptions can go through again, within the card’s limits and permissions."
        confirmLabel="Unfreeze card"
        action={unfreezeCard}
        okToast="Card unfrozen"
      />
      <CardConfirm
        open={dialog === "cancel"}
        onClose={close}
        card={card}
        title={`Cancel the card ending in •• ${card.last4}?`}
        body={<CancelConsequences canFreeze={card.status === "active"} />}
        confirmLabel="Cancel card permanently"
        destructive
        action={cancelCard}
        okToast="Card canceled"
        alternative={card.status === "active" && can(role, "freeze", card) ? { label: "Freeze instead", onClick: () => setDialog("freeze") } : undefined}
      />
      <Modal open={dialog === "history"} onOpenChange={(o) => !o && close()} title="History" description={`${card.nickname} •• ${card.last4} · what changed, when, and who did it.`}>
        <div className="-mt-2 max-h-[60dvh] overflow-y-auto">
          <CardHistoryList card={card} />
        </div>
        <ForenButton variant="secondary" size="sm" className="mt-3 w-full" onClick={close}>
          Done
        </ForenButton>
      </Modal>
      <CardConfirm
        open={dialog === "archive"}
        onClose={close}
        card={card}
        title="Archive this card?"
        body="Archiving moves this canceled card out of your main list and into Archived. It doesn’t change anything else — the card is already canceled, and its history is kept."
        confirmLabel="Archive"
        icon={<RiArchiveLine />}
        action={archiveCard}
        okToast="Card archived. Find it under Archived."
      />
      <Modal open={dialog === "request-unfreeze"} onOpenChange={(o) => !o && close()} title="Ask to unfreeze this card" description="Only the account owner can unfreeze it. We’ll send them your request with this card’s details.">
        <label className="mb-1.5 block text-[14px] font-medium text-fg" htmlFor="unfreeze-note">
          Note for the owner <span className="font-normal text-fg-3">(optional)</span>
        </label>
        <textarea
          id="unfreeze-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus"
          placeholder="e.g. Found the card — it was in my bag."
        />
        {reqUnfreeze.error && <p role="alert" className="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t send your request. Try again.</p>}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ForenButton variant="secondary" size="sm" onClick={close}>
            Go back
          </ForenButton>
          <ForenButton
            size="sm"
            disabled={reqUnfreeze.pending}
            onClick={async () => {
              if ((await reqUnfreeze.run(card.id, note || undefined)).ok) {
                toast("Unfreeze requested. We’ll let you know when the owner decides.");
                close();
              }
            }}
          >
            {reqUnfreeze.pending ? "Sending…" : "Request unfreeze"}
          </ForenButton>
        </div>
      </Modal>
      {dialog === "limit" && <EditLimitModal card={card} onClose={close} />}
      {dialog === "limit-request" && <LimitRequestModal card={card} onClose={close} />}
      {dialog === "lock" && <LockModal card={card} onClose={close} />}
      {dialog === "period" && <PeriodModal card={card} onClose={close} />}
      <CardConfirm
        open={dialog === "unlock"}
        onClose={close}
        card={card}
        title="Unlock this card?"
        body="Payments and subscriptions can go through again, within the card’s limits and permissions."
        confirmLabel="Unlock card"
        icon={<RiLockUnlockLine />}
        action={unlockCard}
        okToast="Card unlocked"
      />
      {dialog === "nickname" && <EditNicknameModal card={card} onClose={close} />}
      <CopyDetailsDialog card={card} open={dialog === "copy"} onClose={close} allowed={can(role, "viewDetails", card)} />
    </>
  );
}

function EditLimitModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const [period, setPeriod] = React.useState<LimitPeriod>(card.limit.period);
  const [amount, setAmount] = React.useState(String(card.limit.amount.minor / 100));
  const [temporary, setTemporary] = React.useState(false);
  const [days, setDays] = React.useState(7);
  const [error, setError] = React.useState<string | null>(null);
  const save = useAction(setCardLimit);
  const cur = card.limit.amount.currency;
  const parsed = parseAmount(amount, cur);
  const changed = period !== card.limit.period || parsed?.minor !== card.limit.amount.minor;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Edit card limit">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="lim-type" className="text-[14px] font-medium text-fg">
            Limit type
          </label>
          <select id="lim-type" value={period} onChange={(e) => setPeriod(e.target.value as LimitPeriod)} className="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
            {(Object.keys(PERIOD_LABEL) as LimitPeriod[]).map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <ForenInput
          label="Spend limit"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          leadingIcon={<span className="text-[14px] font-medium text-fg-2">{cur}</span>}
          className="tnum"
          error={error ?? undefined}
          description={!error && parsed && parsed.minor > 0 ? `Up to ${format(parsed)} ${PERIOD_PHRASE[period]}.` : undefined}
        />
        <div>
          <ForenCheckbox checked={temporary} onCheckedChange={(v) => setTemporary(v === true)} label="This is a temporary change" description="Automatically restore the current limit after a period of time." />
          {temporary && (
            <div className="mt-3 flex items-center gap-2 pl-8 text-[13px] text-fg-2">
              <label htmlFor="lim-days">Restore after</label>
              <select id="lim-days" value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 rounded-full bg-subtle px-3 text-[13px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          )}
        </div>
        {save.error && <p role="alert" className="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">{COPY.saveFailure}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ForenButton variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </ForenButton>
          <ForenButton
            size="sm"
            disabled={!changed || save.pending}
            onClick={async () => {
              const max = POLICY.maxLimitMajor[cur];
              if (!parsed) return setError("Enter an amount using numbers only, like 2,500.00.");
              if (parsed.minor <= 0) return setError("The limit must be more than zero.");
              if (parsed.minor > max * 100) return setError(`The most you can set is ${format({ minor: max * 100, currency: cur })}.`);
              setError(null);
              const until = temporary ? new Date(clockNow().getTime() + days * 86_400_000).toISOString() : undefined;
              if ((await save.run(card.id, { period, amount: parsed }, until)).ok) {
                toast(temporary ? `Limit changed for ${days} ${days === 1 ? "day" : "days"}` : "Limit saved");
                onClose();
              }
            }}
          >
            {save.pending ? "Saving…" : "Save limit"}
          </ForenButton>
        </div>
      </div>
    </Modal>
  );
}

function EditNicknameModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const [name, setName] = React.useState(card.nickname);
  const save = useAction(renameCard);
  const trimmed = name.trim();
  const valid = trimmed.length > 0 && trimmed.length <= 40;
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Change card nickname">
      <ForenInput
        aria-label="Card nickname"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        description={trimmed.length > 40 ? undefined : "Something short but memorable."}
        error={trimmed.length > 40 ? "Use 40 characters or fewer." : undefined}
      />
      <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-line p-3">
        <CardArt card={{ ...card, nickname: trimmed || "Card name" }} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-fg">{trimmed || "Card name"}</div>
          <div className="text-[12px] text-fg-3">•• {card.last4}</div>
        </div>
        <CardStatusBadge card={card} size="sm" />
      </div>
      {save.error && <p role="alert" className="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">{COPY.saveFailure}</p>}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="secondary" size="sm" onClick={onClose}>
          Go back
        </ForenButton>
        <ForenButton
          size="sm"
          disabled={!valid || trimmed === card.nickname || save.pending}
          onClick={async () => {
            if ((await save.run(card.id, trimmed)).ok) {
              toast("Nickname saved");
              onClose();
            }
          }}
        >
          {save.pending ? "Saving…" : "Save"}
        </ForenButton>
      </div>
    </Modal>
  );
}

function CopyDetailsDialog({ card, open, onClose, allowed }: { card: Card; open: boolean; onClose: () => void; allowed: boolean }) {
  const [revealed, setRevealed] = React.useState(false);
  // Test number only — Visa test range.
  const pan = `4000 0012 3456 ${card.last4}`;
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ""));
    } catch {
      /* clipboard may be unavailable in some browsers */
    }
    toast(`${label} copied`);
  };
  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title="Card details" description={allowed ? "Share these only with the intended cardholder." : undefined}>
      {!allowed ? (
        <ForenInfoNote intent="default" size="lg" className="h-auto rounded-[16px] py-3 [&>span]:whitespace-normal">
          Only the cardholder and the account owner can see this card’s full details.
        </ForenInfoNote>
      ) : (
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-warning-subtle px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.06em] text-warning uppercase">Test data</div>
          <DetailCopy label="Card number" value={revealed ? pan : `•••• •••• •••• ${card.last4}`} onCopy={() => copy("Card number", pan)} canCopy={revealed} />
          <div className="grid grid-cols-2 gap-3">
            <DetailCopy label="Expiry" value={`${card.expiry.slice(5)}/${card.expiry.slice(2, 4)}`} onCopy={() => copy("Expiry", `${card.expiry.slice(5)}/${card.expiry.slice(2, 4)}`)} canCopy />
            <DetailCopy label="CVC" value={revealed ? "123" : "•••"} onCopy={() => copy("CVC", "123")} canCopy={revealed} />
          </div>
          <DetailCopy label="Name on card" value={nameOnCard(card) ?? ""} onCopy={() => copy("Name", nameOnCard(card) ?? "")} canCopy />
          <ForenButton variant="secondary" size="sm" className="w-full" onClick={() => setRevealed((r) => !r)}>
            {revealed ? "Hide details" : "Show full details"}
          </ForenButton>
        </div>
      )}
      <ForenButton variant="outline" size="sm" className="mt-3 w-full" onClick={onClose}>
        Done
      </ForenButton>
    </Modal>
  );
}

function DetailCopy({ label, value, onCopy, canCopy }: { label: string; value: string; onCopy: () => void; canCopy: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[16px] bg-subtle px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="text-[12px] text-fg-3">{label}</div>
        <div className="tnum truncate text-[15px] font-semibold tracking-[0.04em] text-fg">{value}</div>
      </div>
      <ForenButton variant="ghost" size="xxs" aria-label={`Copy ${label.toLowerCase()}`} disabled={!canCopy} onClick={onCopy} leadingIcon={<RiFileCopyLine />} className="px-2" />
    </div>
  );
}

export function countdown(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function timeAgo(iso: string, now: Date) {
  const m = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}


/** Cardholder asks for a higher limit (Revolut "spending limit increase" request). */
function LimitRequestModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const [amount, setAmount] = React.useState(String((card.limit.amount.minor / 100) * 2));
  const [note, setNote] = React.useState("");
  const send = useAction(requestLimitIncrease);
  const parsed = parseAmount(amount, card.limit.amount.currency);
  const invalid = !parsed || parsed.minor <= card.limit.amount.minor;
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Ask for a higher limit" description={`${card.nickname} can spend up to ${format(card.limit.amount)} ${PERIOD_PHRASE[card.limit.period]} now.`}>
      <div className="space-y-4">
        <ForenInput
          label={`New ${PERIOD_LABEL[card.limit.period].toLowerCase()} limit (${card.limit.amount.currency})`}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="tnum"
          error={amount && invalid ? "Enter an amount higher than the current limit." : undefined}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="lim-note" className="text-[14px] font-medium text-fg">
            Why do you need it? <span className="font-normal text-fg-3">(optional)</span>
          </label>
          <textarea id="lim-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Conference tickets and hotel next week." className="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus" />
        </div>
        {send.error && <p role="alert" className="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t send your request. Try again.</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ForenButton variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </ForenButton>
          <ForenButton
            size="sm"
            disabled={invalid || send.pending}
            onClick={async () => {
              if ((await send.run(card.id, { period: card.limit.period, amount: parsed! }, note.trim() || undefined)).ok) {
                toast("Request sent. We’ll let you know when the account owner decides.");
                onClose();
              }
            }}
          >
            {send.pending ? "Sending…" : "Send request"}
          </ForenButton>
        </div>
      </div>
    </Modal>
  );
}

/** Admin lock: stronger than freeze. The cardholder sees who locked it and can’t ask to unfreeze. */
function LockModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const [reason, setReason] = React.useState("");
  const lock = useAction(lockCard);
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Lock this card?">
      <div className="space-y-4">
        <ul className="space-y-2.5 rounded-[16px] bg-subtle px-4 py-3 text-[14px] leading-[20px] text-fg">
          <li className="flex gap-2.5">
            <RiLockLine className="mt-0.5 size-[18px] shrink-0 text-fg-2" aria-hidden />
            No payments or subscriptions will go through.
          </li>
          <li className="flex gap-2.5">
            <RiUserForbidLine className="mt-0.5 size-[18px] shrink-0 text-fg-2" aria-hidden />
            Unlike freezing, the cardholder can’t ask to unfreeze it. Only an account admin can unlock it.
          </li>
        </ul>
        <ForenInput label="Reason (optional)" value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Suspected fraud, or leaving the team" description="The cardholder will see this." />
        {lock.error && <p role="alert" className="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">{COPY.saveFailure}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ForenButton variant="secondary" size="sm" onClick={onClose}>
            Go back
          </ForenButton>
          <ForenButton
            size="sm"
            leadingIcon={<RiLockLine />}
            disabled={lock.pending}
            onClick={async () => {
              if ((await lock.run(card.id, reason.trim() || undefined)).ok) {
                toast("Card locked");
                onClose();
              }
            }}
          >
            {lock.pending ? "Locking…" : "Lock card"}
          </ForenButton>
        </div>
      </div>
    </Modal>
  );
}

/** Spending period (Revolut): the card only works between two dates, e.g. a conference week. */
function PeriodModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const [from, setFrom] = React.useState(card.activeFrom ?? "");
  const [until, setUntil] = React.useState(card.activeUntil ?? "");
  const save = useAction(setSpendingPeriod);
  const bad = !!from && !!until && until < from;
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Spending period" description="The card only works between these dates. Payments outside them are declined. Leave a date empty to have no start or end.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ForenInput label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <ForenInput label="Until" type="date" value={until} onChange={(e) => setUntil(e.target.value)} error={bad ? "Must be on or after the start date." : undefined} />
        </div>
        {save.error && <p role="alert" className="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">{COPY.saveFailure}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {card.activeFrom || card.activeUntil ? (
            <ForenButton
              variant="ghost"
              size="sm"
              onClick={async () => {
                if ((await save.run(card.id, undefined, undefined)).ok) {
                  toast("Spending period removed");
                  onClose();
                }
              }}
            >
              Remove period
            </ForenButton>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <ForenButton variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </ForenButton>
            <ForenButton
              size="sm"
              disabled={bad || (!from && !until) || save.pending}
              onClick={async () => {
                if ((await save.run(card.id, from || undefined, until || undefined)).ok) {
                  toast("Spending period saved");
                  onClose();
                }
              }}
            >
              Save
            </ForenButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Add to Apple Pay / Google Pay (Wise, Revolut). Simulated here: real provisioning depends on the card
 * processor, so this needs confirming with engineering before launch.
 */
export function WalletButtons({ card }: { card: Card }) {
  const role = useStore((s) => s.role);
  const [open, setOpen] = React.useState<null | Wallet>(null);
  if (card.status !== "active" || card.holderId !== currentUserId(role) || card.kind === "emergency") return null;
  const has = (w: Wallet) => card.wallets?.includes(w);
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        disabled={has("apple")}
        onClick={() => setOpen("apple")}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b0b0b] px-4 text-[13px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
      >
        <RiAppleFill className="size-4" aria-hidden />
        {has("apple") ? "In Apple Pay" : "Add to Apple Pay"}
      </button>
      <button
        type="button"
        disabled={has("google")}
        onClick={() => setOpen("google")}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-[13px] font-semibold text-fg ring-1 ring-line outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
      >
        <RiGoogleFill className="size-4" aria-hidden />
        {has("google") ? "In Google Pay" : "Add to Google Pay"}
      </button>
      {open && <WalletModal card={card} wallet={open} open onOpenChange={(o) => !o && setOpen(null)} />}
    </div>
  );
}
