"use client";
import { PageHeader } from "@/components/page-header";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RiDownloadLine, RiFileList3Line, RiFlaskLine, RiForbidLine, RiReceiptLine, RiUploadLine } from "@remixicon/react";
import { toast } from "sonner";
import { ForenBadge, type BadgeColor } from "@/components/ui/foren-badge";
import { ForenTable, ForenTableBody, ForenTableCell, ForenTableHead, ForenTableHeaderCell, ForenTableRow } from "@/components/ui/foren-table";
import { ForenButton } from "@/components/ui/foren-button";
import { NotFound } from "@/components/create/route-pages";
import { FundingLegs } from "@/components/funding-legs";
import { LinkButton } from "@/components/link-button";
import { MerchantLogo } from "@/components/merchant-logo";
import { Money } from "@/components/money";
import { ConfirmDialog, Sheet } from "@/components/overlay";
import { EmptyState, ErrorState, LoadingRows, Panel, SectionTitle } from "@/components/states";
import { COPY, DECLINE } from "@/content/copy";
import { CATEGORY_LABEL } from "@/domain/labels";
import type { Card, ExpenseCategory, Money as MoneyT, Transaction } from "@/domain/types";
import { format } from "@/domain/money";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import { merchantById } from "@/fixtures/merchants";
import { blockMerchant, updateTransaction } from "@/lib/actions";
import { useAction, useLoad } from "@/lib/api";
import { can, visibleCards } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const dt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function TransactionsPage({ cardId }: { cardId: string }) {
  const role = useStore((s) => s.role);
  const card = useStore((s) => visibleCards(role, s.cards).find((c) => c.id === cardId));
  const all = useStore((s) => s.transactions);
  const { status, retry } = useLoad(`tx-${cardId}`);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openId = params.get("tx");
  const [showFilter, setShowFilter] = React.useState<"all" | "receipts">("all");
  if (!card) return <NotFound />;
  const txns = all.filter((t) => t.cardId === card.id);
  const shown = showFilter === "receipts" ? txns.filter(needsReceipt) : txns;
  const open = txns.find((t) => t.id === openId);
  const setOpen = (id: string | null) => router.replace(id ? `${pathname}?tx=${id}` : pathname, { scroll: false });

  return (
    <div className="space-y-3">
      <PageHeader
        title="Transactions"
        description={`${card.nickname} •• ${card.last4}`}
        actions={
          can(role, "testCharge", card) &&
          card.status !== "canceled" && (
            <LinkButton href={`/cards/${card.id}/test-charge`} variant="outline" size="xxs" leadingIcon={<RiFlaskLine />}>
              Test a charge
            </LinkButton>
          )
        }
      />

      {status === "ready" && txns.length > 0 && <MonthlyStatement card={card} txns={txns} />}

      <div className="flex flex-wrap items-center gap-2">
        <ForenSegmentedControl
          size="lg"
          ariaLabel="Show"
          value={showFilter}
          onChange={(v) => setShowFilter(v as "all" | "receipts")}
          options={[
            { value: "all", label: "All" },
            { value: "receipts", label: `Missing receipts · ${txns.filter(needsReceipt).length}` },
          ]}
        />
      </div>

      <Panel className="px-6 py-4">
        {status === "loading" && <LoadingRows rows={6} />}
        {status === "error" && <ErrorState onRetry={retry} />}
        {status === "ready" && txns.length === 0 && <EmptyState icon={<RiFileList3Line />} title={COPY.transactionsEmpty.title} body={COPY.transactionsEmpty.body} />}
        {status === "ready" && txns.length > 0 && shown.length === 0 && <EmptyState icon={<RiFileList3Line />} title="Nothing missing" body="Every approved charge on this card has a receipt." />}
        {status === "ready" && shown.length > 0 && (
          <ForenTable className="table-flush" caption={`Transactions on ${card.nickname}`} minWidth={0}>
            <ForenTableHead>
              <tr>
                <ForenTableHeaderCell label="Description" />
                <ForenTableHeaderCell label="Date" className="hidden sm:table-cell" />
                <ForenTableHeaderCell label="Status" className="hidden sm:table-cell" />
                <ForenTableHeaderCell label="Amount" align="right" />
              </tr>
            </ForenTableHead>
            <ForenTableBody>
              {shown.map((t, i) => (
                <TxRow key={t.id} t={t} onOpen={() => setOpen(t.id)} selected={t.id === openId} last={i === shown.length - 1} />
              ))}
            </ForenTableBody>
          </ForenTable>
        )}
      </Panel>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open ? merchantById(open.merchantId)?.name ?? "Transaction" : ""} description={open ? dt(open.at) : undefined}>
        {open && <TransactionDetail t={open} card={card} />}
      </Sheet>
    </div>
  );
}

function txStatus(t: Transaction): { label: string; color: BadgeColor } {
  if (t.status === "declined") return { label: "Declined", color: "error" };
  if (t.status === "pending") return { label: "Pending", color: "gray" };
  if (t.status === "refunded") return { label: "Refunded", color: "gray" };
  if (needsReceipt(t)) return { label: "Missing receipt", color: "orange" };
  if (t.feeAvoided) return { label: "Fee avoided", color: "success" };
  return { label: "Paid", color: "success" };
}

function TxRow({ t, onOpen, selected, last }: { t: Transaction; onOpen: () => void; selected?: boolean; last?: boolean }) {
  const m = merchantById(t.merchantId);
  const st = txStatus(t);
  return (
    <ForenTableRow onClick={onOpen} selected={selected} last={last}>
      <ForenTableCell
        avatar={{ initials: m?.mark, name: m?.name }}
        label={
          <button type="button" onClick={(e) => (e.stopPropagation(), onOpen())} className="outline-none focus-visible:underline">
            {m?.name}
          </button>
        }
        description={t.status === "declined" ? "Not charged" : t.legs.length > 1 ? "Split across balances" : t.legs.some((l) => l.fx) ? "Converted" : `${t.legs[0]?.source.currency ?? ""} balance`}
      />
      <ForenTableCell label={dt(t.at)} className="hidden sm:table-cell" />
      <ForenTableCell type="badge" label={st.label} color={st.color} className="hidden sm:table-cell" />
      <ForenTableCell align="right" label={<Money value={t.amount} className={cn(t.status === "declined" && "text-fg-3 line-through")} />} />
    </ForenTableRow>
  );
}

export function TransactionDetail({ t, card }: { t: Transaction; card: Card }) {
  const role = useStore((s) => s.role);
  const m = merchantById(t.merchantId);
  const [confirm, setConfirm] = React.useState(false);
  const block = useAction(blockMerchant);
  const alreadyBlocked = card.permissions.blockedMerchantIds.includes(t.merchantId);
  const reason = t.declineReason ? DECLINE[t.declineReason] : null;

  return (
    <div className="space-y-6 px-5 py-5 sm:px-6">
      <div className="flex items-center gap-4">
        <MerchantLogo merchant={m} size={48} />
        <div className="min-w-0 flex-1">
          <Money value={t.amount} code className="block text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg" />
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-fg-3">
            <ForenBadge size="sm" color={t.status === "declined" ? "error" : t.status === "approved" ? "success" : "gray"}>
              {t.status === "approved" ? "Approved" : t.status === "declined" ? "Declined" : t.status === "pending" ? "Pending" : "Refunded"}
            </ForenBadge>
            {m && CATEGORY_LABEL[m.category]} · {card.nickname} •• {card.last4}
          </div>
        </div>
      </div>

      {t.viaApprovalId && <p className="rounded-[14px] bg-info-subtle px-3.5 py-2.5 text-[13px] text-info">Paid using a one-time approval from the account owner.</p>}

      {reason ? (
        <section>
          <SectionTitle className="mb-2">Why it was declined</SectionTitle>
          <div className="rounded-[16px] bg-error-subtle px-4 py-3 text-[14px] leading-[20px]">
            <p className="font-semibold text-error">{reason.title}</p>
            <p className="mt-1 text-fg-2">{role === "owner" ? ownerNext(t) : reason.next}</p>
          </div>
        </section>
      ) : (
        <section>
          <SectionTitle className="mb-3">How it was paid</SectionTitle>
          <FundingLegs legs={t.legs} feeAvoided={t.feeAvoided} />
        </section>
      )}

      {!card.personal && t.status === "approved" && <ExpenseDetails t={t} card={card} />}

      <section>
        <SectionTitle className="mb-2">Details</SectionTitle>
        <dl className="divide-y divide-line text-[13px]">
          {[
            ["Merchant", m?.name],
            ["Amount", <Money key="a" value={t.amount} code />],
            ["Date", new Date(t.at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })],
            ["Reference", t.id.toUpperCase()],
          ].map(([k, v]) => (
            <div key={String(k)} className="grid grid-cols-[110px_1fr] gap-3 py-2">
              <dt className="text-fg-3">{k}</dt>
              <dd className="tnum text-fg">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {can(role, "manageSubscriptions", card) && card.status !== "canceled" && (
        <section className="rounded-[16px] border border-line p-4">
          <div className="text-[14px] font-semibold text-fg">Don’t recognise this merchant?</div>
          <p className="mt-1 text-[13px] text-fg-2">Block {m?.name} on this card to decline its future charges. Other merchants aren’t affected.</p>
          <ForenButton variant="outline" size="xs" destructive className="mt-3" leadingIcon={<RiForbidLine />} disabled={alreadyBlocked} onClick={() => setConfirm(true)}>
            {alreadyBlocked ? "Blocked on this card" : "Block merchant"}
          </ForenButton>
        </section>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Block ${m?.name} on ${card.nickname}?`}
        consequence={COPY.blockMerchantConfirm}
        confirmLabel="Block merchant"
        destructive
        pending={block.pending}
        error={block.error ? COPY.saveFailure : null}
        onConfirm={async () => {
          if ((await block.run(card.id, t.merchantId)).ok) {
            toast(`${m?.name} blocked on ${card.nickname}`);
            setConfirm(false);
          }
        }}
      />
    </div>
  );
}

function ownerNext(t: Transaction) {
  switch (t.declineReason) {
    case "frozen":
      return "Unfreeze the card if this charge was expected.";
    case "merchant_blocked":
      return "Unblock this merchant on the card, or approve one charge if the cardholder asks.";
    case "category_blocked":
    case "merchant_not_allowed":
      return "Review the card’s merchant permissions if this charge was expected.";
    case "per_charge_limit":
    case "spend_limit":
      return "Review the card’s spending limit if this charge was expected.";
    case "insufficient_balance":
      return "Top up an eligible balance, or allow more balances in the card’s funding.";
    default:
      return DECLINE[t.declineReason ?? "unknown"].next;
  }
}

/** Receipts are expected on approved business charges (Mercury / Revolut expense reporting). */
export function needsReceipt(t: Transaction) {
  return t.status === "approved" && !t.receipt && !!useStore.getState().cards.find((c) => c.id === t.cardId && !c.personal);
}

const EXPENSE: Record<ExpenseCategory, string> = {
  travel: "Travel",
  meals: "Meals & entertainment",
  software: "Software",
  marketing: "Marketing",
  office: "Office & supplies",
  transport: "Local transport",
  other: "Other",
};

/** Receipt, note and category on a charge, so finance can reconcile it. */
function ExpenseDetails({ t, card }: { t: Transaction; card: Card }) {
  const role = useStore((s) => s.role);
  const save = useAction(updateTransaction);
  const [note, setNote] = React.useState(t.note ?? "");
  const fileRef = React.useRef<HTMLInputElement>(null);
  // The cardholder, the account owner and the finance lead can add expense details.
  const canEdit = role === "finance" || can(role, "freeze", card);
  const persist = async (patch: Parameters<typeof updateTransaction>[1], ok: string) => {
    const r = await save.run(t.id, patch);
    toast(r.ok ? ok : COPY.saveFailure);
  };
  return (
    <section>
      <SectionTitle className="mb-2">Expense details</SectionTitle>
      <div className="space-y-3 rounded-[16px] bg-subtle p-4">
        <div className="flex items-center gap-3">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-[10px]", t.receipt ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning")} aria-hidden>
            <RiReceiptLine className="size-5" />
          </span>
          <div className="min-w-0 flex-1 text-[13px]">
            {t.receipt ? (
              <>
                <div className="truncate font-semibold text-fg">{t.receipt.name}</div>
                <div className="text-fg-3">
                  {Math.max(1, Math.round(t.receipt.size / 1024))} KB · added {new Date(t.receipt.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-fg">Missing receipt</div>
                <div className="text-fg-3">Add a photo or PDF of the receipt.</div>
              </>
            )}
          </div>
          {canEdit && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                aria-label="Receipt file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) persist({ receipt: { name: f.name, size: f.size, at: new Date().toISOString() } }, "Receipt added");
                  e.target.value = "";
                }}
              />
              <ForenButton size="xs" variant={t.receipt ? "ghost" : "secondary"} className="bg-surface" leadingIcon={<RiUploadLine />} onClick={() => fileRef.current?.click()}>
                {t.receipt ? "Replace" : "Add receipt"}
              </ForenButton>
            </>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`cat-${t.id}`} className="text-[13px] font-medium text-fg">
            Category
          </label>
          <select
            id={`cat-${t.id}`}
            disabled={!canEdit}
            value={t.expenseCategory ?? ""}
            onChange={(e) => persist({ expenseCategory: (e.target.value || undefined) as ExpenseCategory | undefined }, "Category saved")}
            className="h-10 rounded-[12px] bg-surface px-3 text-[13px] font-medium text-fg ring-1 ring-line outline-none focus:ring-2 focus:ring-focus"
          >
            <option value="">Choose a category</option>
            {(Object.keys(EXPENSE) as ExpenseCategory[]).map((k) => (
              <option key={k} value={k}>
                {EXPENSE[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`note-${t.id}`} className="text-[13px] font-medium text-fg">
            Note
          </label>
          <textarea
            id={`note-${t.id}`}
            rows={2}
            maxLength={280}
            disabled={!canEdit}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (t.note ?? "") && persist({ note: note.trim() || undefined }, "Note saved")}
            placeholder="What was this for?"
            className="rounded-[12px] bg-surface px-3 py-2 text-[13px] text-fg ring-1 ring-line outline-none focus:ring-2 focus:ring-focus"
          />
        </div>
      </div>
    </section>
  );
}

/** This month on one card, by merchant, with a CSV export (Mercury statements). */
function MonthlyStatement({ card, txns }: { card: Card; txns: Transaction[] }) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = txns.filter((t) => t.status === "approved" && new Date(t.at) >= start);
  const byMerchant = new Map<string, { count: number; total: MoneyT }>();
  for (const t of month) {
    const k = `${t.merchantId}|${t.amount.currency}`;
    const prev = byMerchant.get(k);
    byMerchant.set(k, { count: (prev?.count ?? 0) + 1, total: { minor: (prev?.total.minor ?? 0) + t.amount.minor, currency: t.amount.currency } });
  }
  const totals = new Map<string, number>();
  for (const t of month) totals.set(t.amount.currency, (totals.get(t.amount.currency) ?? 0) + t.amount.minor);
  const missing = month.filter((t) => !t.receipt).length;

  const exportCsv = () => {
    const rows = [["Date", "Merchant", "Amount", "Currency", "Status", "Category", "Note", "Receipt"]];
    for (const t of txns)
      rows.push([
        new Date(t.at).toISOString().slice(0, 10),
        merchantById(t.merchantId)?.name ?? t.merchantId,
        (t.amount.minor / 100).toFixed(2),
        t.amount.currency,
        t.status,
        t.expenseCategory ? EXPENSE[t.expenseCategory] : "",
        t.note ?? "",
        t.receipt?.name ?? "",
      ]);
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.nickname.replace(/\W+/g, "-").toLowerCase()}-${card.last4}-transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Statement downloaded");
  };

  return (
    <Panel className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] text-fg-2">{now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} statement</h2>
          <p className="tnum mt-1 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg">
            {totals.size ? [...totals].map(([c, m]) => format({ minor: m, currency: c as MoneyT["currency"] })).join(" · ") : "Nothing spent yet"}
          </p>
          <p className="mt-1 text-[13px] text-fg-3">
            {month.length} {month.length === 1 ? "charge" : "charges"}
            {missing ? ` · ${missing} missing ${missing === 1 ? "receipt" : "receipts"}` : ""}
          </p>
        </div>
        <ForenButton size="xxs" variant="secondary" leadingIcon={<RiDownloadLine />} onClick={exportCsv}>
          Export CSV
        </ForenButton>
      </div>
      {byMerchant.size > 0 && (
        <ForenTable caption="Spend by merchant this month" minWidth={0} className="table-flush mt-4">
          <ForenTableHead>
            <tr>
              <ForenTableHeaderCell label="Merchant" />
              <ForenTableHeaderCell label="Charges" align="right" className="hidden sm:table-cell" />
              <ForenTableHeaderCell label="Total" align="right" />
            </tr>
          </ForenTableHead>
          <ForenTableBody>
            {[...byMerchant]
              .sort((a, b) => b[1].total.minor - a[1].total.minor)
              .map(([k, v], i, all) => {
                const m = merchantById(k.split("|")[0]);
                return (
                  <ForenTableRow key={k} last={i === all.length - 1}>
                    <ForenTableCell avatar={{ initials: m?.mark, name: m?.name }} label={m?.name} />
                    <ForenTableCell align="right" label={String(v.count)} className="hidden sm:table-cell" />
                    <ForenTableCell align="right" label={<Money value={v.total} />} />
                  </ForenTableRow>
                );
              })}
          </ForenTableBody>
        </ForenTable>
      )}
    </Panel>
  );
}
