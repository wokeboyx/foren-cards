"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import {
  RiArchiveLine,
  RiBankCardLine,
  RiBuilding2Line,
  RiArrowUpCircleLine,
  RiDraftLine,
  RiFilter3Line,
  RiTimeLine,
} from "@remixicon/react";
import { ForenAvatar } from "@/components/ui/foren-avatar";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenProgress } from "@/components/ui/foren-progress";
import {
  ForenTable,
  ForenTableBody,
  ForenTableHead,
  ForenTableHeaderCell,
  ForenTableRow,
} from "@/components/ui/foren-table";
import { CardArt } from "@/components/card/card-art";
import {
  CardStatusBadge,
  listStatus,
  MerchantLockBadge,
} from "@/components/card/status-badge";
import { spendSummary } from "@/components/card/spend-meter";
import { usedBy } from "@/components/card/holder";
import { CardsHeader } from "@/components/cards/cards-header";
import { SetupChecklist } from "@/components/cards/setup-checklist";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { PERIOD_PHRASE, STATUS_LABEL, strategyLabel } from "@/domain/labels";
import { format } from "@/domain/money";
import { RequestDetail } from "@/components/requests/requests-page";
import { Sheet } from "@/components/overlay";
import { timeAgo } from "@/components/cards/card-detail";
import type { Card, CardDraft, CardRequest } from "@/domain/types";
import { toast } from "sonner";
import { LinkButton } from "@/components/link-button";
import { deleteCardDraft } from "@/lib/actions";
import { merchantById } from "@/fixtures/merchants";
import { PEOPLE } from "@/fixtures/seed";
import { useLoad } from "@/lib/api";
import { can, visibleCards } from "@/lib/permissions";
import {
  allPeople,
  currentUserId,
  personById,
  useNow,
  useStore,
} from "@/lib/store";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "frozen", label: "Frozen" },
  { value: "canceled", label: "Canceled" },
] as const;

export function CardsOverview() {
  const role = useStore((s) => s.role);
  const allCards = useStore((s) => s.cards);
  const txns = useStore((s) => s.transactions);
  const now = useNow(30_000);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { status, retry } = useLoad("cards");

  const view = params.get("view") === "archived" ? "archived" : "manage";
  const statusFilter = params.get("status");
  const holderFilter = params.get("holder");
  const openId = params.get("card");
  const openRequestId = params.get("request");
  const allRequests = useStore((s) => s.requests);
  const me = currentUserId(role);
  // Card requests sit in the list as "Pending request" rows: the requester sees theirs, the owner sees all.
  const pendingCards =
    view === "manage" && !statusFilter
      ? allRequests.filter(
          (r) =>
            r.kind === "new_card" &&
            r.state === "pending" &&
            (role === "cardholder" ? r.requesterId === me : true) &&
            (!holderFilter || r.requesterId === holderFilter),
        )
      : [];
  const selectedRequest = allRequests.find(
    (r) => r.id === openRequestId && r.kind === "new_card",
  );
  const drafts = useStore((s) => s.cardDrafts);
  const myDrafts =
    view === "manage" && !statusFilter && can(role, "issue") ? drafts : [];

  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  };

  const cards = visibleCards(role, allCards);
  const inView = cards.filter((c) =>
    view === "archived" ? c.archived : !c.archived,
  );
  const filtered = inView.filter(
    (c) =>
      (!statusFilter || listStatus(c) === statusFilter) &&
      (!holderFilter || c.holderId === holderFilter),
  );
  const filters = [
    statusFilter && {
      key: "status",
      label: `Status: ${STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}`,
    },
    holderFilter && {
      key: "holder",
      label: `Cardholder: ${personById(holderFilter)?.name}`,
    },
  ].filter(Boolean) as { key: string; label: string }[];
  const split = false; // details open in a drawer (Figma), so the list keeps its full width

  // Cards open on their own page; old ?card= links still land there.
  React.useEffect(() => {
    if (openId) router.replace(`/cards/${openId}`);
  }, [openId, router]);

  if (
    status === "ready" &&
    cards.length === 0 &&
    pendingCards.length === 0 &&
    myDrafts.length === 0 &&
    view === "manage"
  )
    return (
      <div>
        <CardsHeader tab="manage" />
        <SetupChecklist />
      </div>
    );

  return (
    <div>
      <CardsHeader tab={view} />

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FilterMenu
          role={role}
          holders={allPeople().filter((p) =>
            cards.some((c) => c.holderId === p.id),
          )}
          onPick={(k, v) => setParam({ [k]: v })}
          counts={(v) => inView.filter((c) => listStatus(c) === v).length}
          showStatus={view === "manage"}
        />
        {filters.length === 0 ? (
          <span className="text-[13px] text-fg-3">No filters applied</span>
        ) : (
          <>
            {filters.map((f) => (
              <ForenBadge
                key={f.key}
                size="lg"
                color="primary"
                onDismiss={() => setParam({ [f.key]: null })}
                dismissLabel={`Remove ${f.label}`}
              >
                {f.label}
              </ForenBadge>
            ))}
            <button
              className="text-[13px] font-semibold text-fg-2 underline-offset-2 hover:underline"
              onClick={() =>
                setParam({ status: null, holder: null, type: null })
              }
            >
              Clear all
            </button>
          </>
        )}
      </div>
      {view === "archived" && (
        <p className="mb-3 text-[13px] leading-[18px] text-fg-3">
          Archived cards are canceled cards you’ve moved out of the main list.
          They can’t be used, and their history is kept.
        </p>
      )}

      {status === "loading" && <LoadingRows />}
      {status === "error" && <ErrorState onRetry={retry} />}
      {status === "ready" && (
        <div
          className={cn(
            "grid items-start gap-6",
            split && "grid-cols-[minmax(0,1fr)_420px]",
          )}
        >
          <div className="min-w-0">
            {myDrafts.length > 0 && <DraftList drafts={myDrafts} />}
            {filtered.length === 0 && pendingCards.length === 0 ? (
              view === "archived" ? (
                <EmptyState
                  icon={<RiArchiveLine />}
                  title="No archived cards"
                  body="When you archive a canceled card, it moves here."
                />
              ) : (
                <EmptyState
                  icon={<RiBankCardLine />}
                  title={
                    filters.length
                      ? "No cards match these filters"
                      : "No cards yet"
                  }
                  body={
                    filters.length
                      ? "Try a different status, type or cardholder."
                      : "Cards issued to you will appear here."
                  }
                  action={
                    filters.length > 0 && (
                      <ForenButton
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setParam({ status: null, holder: null, type: null })
                        }
                      >
                        Clear filters
                      </ForenButton>
                    )
                  }
                />
              )
            ) : (
              <div className="rounded-[20px] bg-surface px-6 py-4">
                <CardTable
                  cards={filtered}
                  requests={pendingCards}
                  compact={split}
                  selectedId={openRequestId}
                  now={now}
                  txns={txns}
                  onSelect={(id) => router.push(`/cards/${id}`)}
                  onSelectRequest={(id) =>
                    setParam({
                      request: id === openRequestId ? null : id,
                      card: null,
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {(
        <Sheet
          open={!!selectedRequest}
          onOpenChange={(o) => !o && setParam({ request: null })}
          title="Request details"
        >
          {selectedRequest && (
            <RequestDetail
              r={selectedRequest}
              canDecide={can(role, "approve")}
            />
          )}
        </Sheet>
      )}
    </div>
  );
}

function CardTable({
  cards,
  requests,
  compact,
  selectedId,
  onSelect,
  onSelectRequest,
  now,
  txns,
}: {
  cards: Card[];
  requests: CardRequest[];
  compact: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSelectRequest: (id: string) => void;
  now: Date;
  txns: ReturnType<typeof useStore.getState>["transactions"];
}) {
  const role = useStore((s) => s.role);
  const me = currentUserId(role);
  const limitAsks = new Set(
    useStore((s) => s.requests)
      .filter((r) => r.kind === "limit_increase" && r.state === "pending")
      .map((r) => r.cardId!),
  );
  return (
    <>
      {/* Desktop / tablet table (DS Table) */}
      <ForenTable caption="Company cards" className="table-flush hidden md:block" minWidth={720}>
        <ForenTableHead>
          <tr>
            <ForenTableHeaderCell label="Cardholder" />
            <ForenTableHeaderCell label="Card" />
            <ForenTableHeaderCell label="Spent vs limit" align="right" />
            {!compact && <ForenTableHeaderCell label="Funding" />}
          </tr>
        </ForenTableHead>
        <ForenTableBody>
          {requests.map((r) => (
            <PendingRequestRow
              key={r.id}
              r={r}
              compact={compact}
              selected={r.id === selectedId}
              me={me}
              onSelect={() => onSelectRequest(r.id)}
            />
          ))}
          {cards.map((c) => {
            const holder = personById(c.holderId);
            const sel = c.id === selectedId;
            const sum = spendSummary(c, txns, now);
            return (
              <ForenTableRow
                key={c.id}
                onClick={() => onSelect(c.id)}
                selected={sel}
                aria-selected={sel}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {c.companyCard ? (
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-fg-2 ring-1 ring-line"
                        aria-hidden
                      >
                        <RiBuilding2Line className="size-3.5" />
                      </span>
                    ) : (
                      <ForenAvatar
                        size="xs"
                        name={holder?.name}
                        initials={holder?.name
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                        fallback="initials"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-fg">
                        {c.companyCard ? "Company card" : holder?.name}
                      </span>
                      {c.companyCard && (
                        <span className="block truncate text-[11px] text-fg-3">
                          {usedBy(c)}
                        </span>
                      )}
                    </span>
                    {holder?.invited && !c.companyCard && (
                      <ForenBadge size="sm" color="orange">
                        Invite pending
                      </ForenBadge>
                    )}
                    {c.holderId === me && !c.companyCard && (
                      <ForenBadge size="sm" color="primary">
                        You
                      </ForenBadge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <CardArt card={c} size="xs" />
                    <button
                      className="tnum min-w-0 truncate text-left text-[13px] text-fg outline-none focus-visible:underline"
                      aria-label={`${c.nickname}, card ending ${c.last4}, ${STATUS_LABEL[c.status]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(c.id);
                      }}
                    >
                      <span className="text-fg-2">•• {c.last4}</span>{" "}
                      <span className="font-medium">{c.nickname}</span>
                    </button>
                    {(listStatus(c) !== "active" || c.kind === "emergency") && (
                      <CardStatusBadge card={c} size="sm" />
                    )}
                    <MerchantLockBadge
                      card={c}
                      merchantName={
                        c.lockedMerchantId
                          ? merchantById(c.lockedMerchantId)?.name
                          : undefined
                      }
                    />
                    {limitAsks.has(c.id) && (
                      <ForenBadge
                        size="sm"
                        color="orange"
                        leadingIcon={<RiArrowUpCircleLine aria-hidden />}
                      >
                        Limit request
                      </ForenBadge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {c.status === "canceled" ? (
                    <span className="text-[13px] text-fg-3">—</span>
                  ) : (
                    <div className="ml-auto w-[150px]">
                      <div className="tnum text-[13px] whitespace-nowrap text-fg">
                        {sum.short}
                      </div>
                      {sum.ratio !== null && (
                        <ForenProgress
                          size="sm"
                          value={sum.ratio * 100}
                          hideValue
                          className="mt-1"
                          aria-label={sum.sentence}
                          fillColor={
                            sum.ratio >= 0.9
                              ? "var(--color-foren-warning)"
                              : undefined
                          }
                        />
                      )}
                    </div>
                  )}
                </td>
                {!compact && (
                  <td className="px-4 py-2.5 text-[13px] text-fg-2">
                    {strategyLabel(c.funding)}
                  </td>
                )}
              </ForenTableRow>
            );
          })}
        </ForenTableBody>
      </ForenTable>
      {/* Phone list */}
      <ul className="divide-y divide-line md:hidden">
        {requests.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => onSelectRequest(r.id)}
              className="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-subtle"
            >
              <CardArt
                card={{
                  design: r.newCard!.design,
                  nickname: r.newCard!.nickname,
                  last4: "",
                  kind: "standard",
                  status: "active",
                }}
                size="sm"
                className="opacity-60"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[14px] font-semibold text-fg">
                    {r.newCard!.nickname}
                  </span>
                  <PendingBadge />
                </div>
                <div className="truncate text-[12px] text-fg-3">
                  {personById(r.requesterId)?.name} · asked{" "}
                  {timeAgo(r.createdAt, now)}
                </div>
                <div className="tnum mt-1 text-[12px] text-fg-2">
                  Up to {format(r.newCard!.limit.amount, { compact: true })}{" "}
                  {PERIOD_PHRASE[r.newCard!.limit.period]}
                </div>
              </div>
            </button>
          </li>
        ))}
        {cards.map((c) => {
          const holder = personById(c.holderId);
          const sum = spendSummary(c, txns, now);
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-subtle"
              >
                <CardArt card={c} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold text-fg">
                      {c.nickname}
                    </span>
                    {(listStatus(c) !== "active" || c.kind === "emergency") && (
                      <CardStatusBadge card={c} size="sm" />
                    )}
                  </div>
                  <div className="tnum truncate text-[12px] text-fg-3">
                    {c.companyCard ? "Company card" : holder?.name} · ••{" "}
                    {c.last4}
                  </div>
                  {c.status !== "canceled" && (
                    <div className="tnum mt-1 text-[12px] text-fg-2">
                      {sum.short}
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function FilterMenu({
  role,
  holders,
  onPick,
  counts,
  showStatus,
}: {
  role: string;
  holders: typeof PEOPLE;
  onPick: (key: string, value: string) => void;
  counts: (v: string) => number;
  showStatus: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const pick = (k: string, v: string) => {
    onPick(k, v);
    setOpen(false);
  };
  const opt =
    "flex w-full items-center justify-between gap-3 rounded-[10px] px-2.5 py-1.5 text-left text-[13px] text-fg outline-none hover:bg-subtle focus-visible:bg-subtle";
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <ForenButton
          variant="secondary"
          size="xxs"
          leadingIcon={<RiFilter3Line />}
        >
          Add filter
        </ForenButton>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 max-h-[70dvh] w-[260px] overflow-y-auto rounded-[16px] bg-surface p-2 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
        >
          {showStatus && (
            <>
              <div className="px-2.5 pt-1 pb-1 text-[11px] font-semibold tracking-[0.06em] text-fg-3 uppercase">
                Status
              </div>
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={opt}
                  onClick={() => pick("status", o.value)}
                >
                  {o.label}
                  <span className="tnum text-[12px] text-fg-3">
                    {counts(o.value)}
                  </span>
                </button>
              ))}
            </>
          )}
          {role !== "cardholder" && (
            <>
              <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-[0.06em] text-fg-3 uppercase">
                Cardholder
              </div>
              {holders.map((h) => (
                <button
                  key={h.id}
                  className={opt}
                  onClick={() => pick("holder", h.id)}
                >
                  {h.name}
                </button>
              ))}
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function PendingBadge() {
  return (
    <ForenBadge
      size="sm"
      color="orange"
      leadingIcon={<RiTimeLine aria-hidden />}
    >
      Pending request
    </ForenBadge>
  );
}

/** A requested card waiting for the owner, shown in the card list so requests and cards live together. */
function PendingRequestRow({
  r,
  compact,
  selected,
  me,
  onSelect,
}: {
  r: CardRequest;
  compact: boolean;
  selected: boolean;
  me: string;
  onSelect: () => void;
}) {
  const now = useNow(30_000);
  const requester = personById(r.requesterId);
  const want = r.newCard!;
  return (
    <ForenTableRow onClick={onSelect} selected={selected} aria-selected={selected}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <ForenAvatar
            size="xs"
            name={requester?.name}
            initials={requester?.name
              .split(" ")
              .map((x) => x[0])
              .join("")}
            fallback="initials"
          />
          <span className="truncate text-[13px] text-fg">
            {requester?.name}
          </span>
          {r.requesterId === me && (
            <ForenBadge size="sm" color="primary">
              You
            </ForenBadge>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <CardArt
            card={{
              design: want.design,
              nickname: want.nickname,
              last4: "",
              kind: "standard",
              status: "active",
            }}
            size="xs"
            className="opacity-50"
          />
          <button
            className="min-w-0 truncate text-left text-[13px] text-fg outline-none focus-visible:underline"
            aria-label={`${want.nickname}, pending card request from ${requester?.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <span className="font-medium">{want.nickname}</span>
            {!compact && (
              <span className="text-fg-3">
                {" "}
                · asked {timeAgo(r.createdAt, now)}
              </span>
            )}
          </button>
          <PendingBadge />
        </div>
      </td>
      <td className="tnum px-4 py-2.5 text-right text-[13px] whitespace-nowrap text-fg-2">
        {compact
          ? `${format(want.limit.amount, { compact: true })} asked`
          : `Up to ${format(want.limit.amount, { compact: true })} ${PERIOD_PHRASE[want.limit.period]}`}
      </td>
      {!compact && (
        <td className="px-4 py-2.5 text-[13px] text-fg-3">Set on approval</td>
      )}
    </ForenTableRow>
  );
}

/** Cards being created, saved to finish later (Revolut drafts). */
function DraftList({ drafts }: { drafts: CardDraft[] }) {
  return (
    <section
      aria-label="Drafts"
      className="mb-4 overflow-hidden rounded-[20px] bg-surface"
    >
      <ul className="divide-y divide-line">
        {drafts.map((d) => {
          const names = [d.card.nickname, ...d.names]
            .map((n) => n.trim())
            .filter(Boolean);
          return (
            <li
              key={d.id}
              className="flex flex-wrap items-center gap-3 px-4 py-2.5"
            >
              <CardArt
                card={{
                  ...d.card,
                  nickname: names[0] || "Untitled card",
                  last4: "",
                }}
                size="xs"
                className="opacity-50"
              />
              <span className="min-w-[60%] flex-1 text-[13px] sm:min-w-0">
                <span className="font-medium text-fg">
                  {names.length ? names.join(", ") : "Untitled card"}
                </span>
                <span className="text-fg-3">
                  {" "}
                  · step {d.step + 1} of 5 · saved{" "}
                  {new Date(d.savedAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </span>
              <ForenBadge
                size="sm"
                color="gray"
                leadingIcon={<RiDraftLine aria-hidden />}
              >
                Draft
              </ForenBadge>
              <ForenButton
                size="xxs"
                variant="ghost"
                onClick={() => {
                  deleteCardDraft(d.id);
                  toast("Draft deleted");
                }}
              >
                Delete
              </ForenButton>
              <LinkButton
                href={`/cards/new?draft=${d.id}`}
                size="xxs"
                variant="secondary"
              >
                Continue
              </LinkButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
