"use client";
import * as React from "react";
import { RiBankCardLine, RiForbidLine, RiNotification3Line, RiSearchEyeLine } from "@remixicon/react";
import { toast } from "sonner";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import { ForenToggle } from "@/components/ui/foren-toggle";
import { CardArt } from "@/components/card/card-art";
import { LinkButton } from "@/components/link-button";
import { Money } from "@/components/money";
import { ConfirmDialog } from "@/components/overlay";
import { SectionTitle } from "@/components/states";
import { COPY, DECLINE } from "@/content/copy";
import { forecast, type SubStatus } from "@/domain/forecast";
import type { Card, Subscription } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { FREQUENCY_LABEL } from "@/domain/labels";
import { MerchantLogo } from "@/components/merchant-logo";
import { allowNextAttempt, blockMerchant, confirmBillingMoved, setReminders, unblockMerchant } from "@/lib/actions";
import { useAction } from "@/lib/api";
import { GiveOwnCardModal } from "@/components/cards/give-own-card";
import { can } from "@/lib/permissions";
import { personById, useNow, useStore } from "@/lib/store";
import { SubStatusBadge } from "./subscriptions-page";

const long = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });

export function SubscriptionDetail({ sub, card, status, panel }: { sub: Subscription; card: Card; status: SubStatus; panel?: boolean }) {
  const role = useStore((s) => s.role);
  const newCard = useStore((s) => s.cards.find((c) => c.id === sub.movingToCardId));
  const now = useNow(30_000);
  const m = merchantById(sub.merchantId)!;
  const f = forecast(sub, now);
  const owner = can(role, "manageSubscriptions", card);
  const [confirm, setConfirm] = React.useState<null | "block" | "own">(null);
  const block = useAction(blockMerchant);
  const unblock = useAction(unblockMerchant);
  const allowOnce = useAction(allowNextAttempt);
  const moved = useAction(confirmBillingMoved);
  const rem = useAction(setReminders);
  const [reminders, setLocal] = React.useState(sub.reminders);
  const off = !reminders.owner && !reminders.cardholder;

  const saveReminders = async (next: Subscription["reminders"]) => {
    const prev = reminders;
    setLocal(next);
    if (!(await rem.run(sub.id, next)).ok) {
      setLocal(prev);
      toast.error(COPY.saveFailure);
    }
  };

  return (
    <div className="space-y-6 px-5 py-5 sm:px-6">
      {panel && (
        <div className="flex items-center gap-3 pr-8">
          <MerchantLogo merchant={m} size={40} />
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold text-fg">{m.name}</h2>
            <p className="tnum truncate text-[13px] text-fg-3">
              {FREQUENCY_LABEL[sub.frequency]} · {card.nickname} •• {card.last4}
            </p>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] text-fg-3">{COPY.estimatedNextCharge}</div>
          {sub.blocked ? (
            <div className="mt-0.5 text-[18px] font-semibold text-fg">Blocked on this card</div>
          ) : f.kind === "estimate" ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="tnum text-[22px] leading-[28px] font-semibold text-fg">
                <Money value={f.amount} /> · {long(f.date)}
              </span>
              <ForenBadge size="sm" color="gray">
                Estimate
              </ForenBadge>
            </div>
          ) : (
            <p className="mt-1 text-[14px] text-fg-2">{COPY.insufficientHistory}</p>
          )}
          {f.kind === "estimate" && !sub.blocked && <p className="mt-1 text-[12px] text-fg-3">Predicted from past charges. The merchant hasn’t confirmed this date.</p>}
        </div>
        <SubStatusBadge st={status} />
      </div>

      {status.kind === "still_on_old_card" && newCard && (
        <div className="rounded-[16px] bg-warning-subtle p-4 text-[14px] leading-[20px] text-fg">
          <p className="font-semibold text-warning">{COPY.stillOnOldCard}</p>
          <p className="mt-1">
            {m.name} will keep charging {card.nickname} •• {card.last4} until you update your payment method with {m.name} to the new card •• {newCard.last4}.
          </p>
          <ForenButton size="xs" variant="secondary" className="mt-3 bg-surface" disabled={moved.pending} onClick={async () => {
            if ((await moved.run(sub.id)).ok) toast(`${m.name} now charges •• ${newCard.last4}`);
          }}>
            Simulate: {m.name} confirmed the new card
          </ForenButton>
        </div>
      )}

      {(status.kind === "declined" || status.kind === "at_risk") && (
        <div className="rounded-[16px] bg-warning-subtle p-4 text-[14px] text-fg">
          <p className="font-semibold text-warning">{status.kind === "declined" ? "Last charge declined" : "May decline next time"}</p>
          <p className="mt-1">{DECLINE[status.reason].title}</p>
        </div>
      )}

      <section>
        <SectionTitle className="mb-2">Charged to</SectionTitle>
        <div className="flex items-center gap-3">
          <CardArt card={card} size="sm" />
          <div className="text-[14px]">
            <div className="font-medium text-fg">
              {card.nickname} •• {card.last4}
            </div>
            <div className="text-fg-3">{personById(card.holderId)?.name}</div>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle className="mb-2">History</SectionTitle>
        <ul className="divide-y divide-line text-[14px]">
          {[...sub.chargeDates].sort().reverse().map((d) => (
            <li key={d} className="flex justify-between py-2">
              <span className="text-fg-2">{long(new Date(d))}</span>
              <Money value={sub.usualAmount} className="text-fg" />
            </li>
          ))}
          {sub.lastDecline && (
            <li className="flex justify-between py-2">
              <span className="text-fg-2">{long(new Date(sub.lastDecline.at))}</span>
              <span className="text-error">Declined</span>
            </li>
          )}
        </ul>
      </section>

      {can(role, "reminders", card) && (
        <section>
          <SectionTitle className="mb-2">
            <span className="inline-flex items-center gap-2">
              <RiNotification3Line className="size-[18px] text-fg-2" aria-hidden /> Reminders
            </span>
          </SectionTitle>
          <div className="space-y-3 rounded-[16px] bg-subtle p-4">
            <ForenToggle size="sm" reverse className="w-full justify-between" label="Remind the account owner" checked={reminders.owner} onCheckedChange={(v) => saveReminders({ ...reminders, owner: v })} />
            <ForenToggle size="sm" reverse className="w-full justify-between" label={`Remind the cardholder (${personById(card.holderId)?.name.split(" ")[0]})`} checked={reminders.cardholder} onCheckedChange={(v) => saveReminders({ ...reminders, cardholder: v })} />
            {!off && (
              <div>
                <div className="mb-1.5 text-[13px] text-fg-2">When</div>
                <ForenSegmentedControl
                  size="sm"
                  ariaLabel="Days before"
                  value={String(reminders.daysBefore)}
                  onChange={(v) => saveReminders({ ...reminders, daysBefore: Number(v) })}
                  options={[
                    { value: "1", label: "1 day before" },
                    { value: "3", label: "3 days" },
                    { value: "7", label: "7 days" },
                  ]}
                />
              </div>
            )}
            <p className="text-[12px] text-fg-3">{off ? "Reminders are off for this subscription." : "Based on the estimated date, so a reminder may arrive early or late."}</p>
          </div>
        </section>
      )}

      {owner && (
        <section>
          <SectionTitle className="mb-1">Manage</SectionTitle>
          {!sub.blocked ? (
            <ActionRow
              icon={<RiForbidLine />}
              title="Block merchant on this card"
              body="Declines future charges from this merchant on this card only."
              action={<ForenButton size="xs" variant="outline" destructive onClick={() => setConfirm("block")}>Block</ForenButton>}
            />
          ) : (
            <ActionRow
              icon={<RiForbidLine />}
              title={sub.allowNextAttempt ? "Next attempt will be allowed" : "Blocked on this card"}
              body={sub.allowNextAttempt ? "The next charge goes through once, then the block applies again." : "You can unblock it, or let only the next charge through."}
              action={
                <div className="flex flex-col gap-1.5">
                  <ForenButton size="xs" variant="outline" disabled={unblock.pending} onClick={async () => { if ((await unblock.run(card.id, sub.merchantId)).ok) toast(`${m.name} unblocked`); }}>
                    Unblock
                  </ForenButton>
                  {!sub.allowNextAttempt && (
                    <ForenButton size="xs" variant="ghost" disabled={allowOnce.pending} onClick={async () => { if ((await allowOnce.run(sub.id)).ok) toast("Next charge will be allowed once"); }}>
                      Allow next only
                    </ForenButton>
                  )}
                </div>
              }
            />
          )}
          {!sub.movingToCardId && !card.lockedMerchantId && !sub.blocked && (
            <ActionRow
              icon={<RiBankCardLine />}
              title="Give it its own card"
              body={`Creates a card locked to ${m.name}, so you can manage it without affecting ${card.nickname}.`}
              action={<ForenButton size="xs" variant="outline" onClick={() => setConfirm("own")}>Create card</ForenButton>}
            />
          )}
          <ActionRow
            icon={<RiSearchEyeLine />}
            title="Check compatibility"
            body="See whether this merchant is likely to accept a card."
            action={<LinkButton size="xs" variant="outline" href={`/cards/check-merchant?card=${sub.movingToCardId ?? card.id}&merchant=${m.id}`}>Check</LinkButton>}
          />
          {(block.error || unblock.error || allowOnce.error || moved.error) && <p role="alert" className="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">{COPY.saveFailure}</p>}
        </section>
      )}

      <ConfirmDialog
        open={confirm === "block"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Block ${m.name} on ${card.nickname}?`}
        consequence={COPY.blockMerchantConfirm}
        confirmLabel="Block merchant"
        destructive
        pending={block.pending}
        error={block.error ? COPY.saveFailure : null}
        onConfirm={async () => {
          if ((await block.run(card.id, sub.merchantId)).ok) {
            toast(`${m.name} blocked on ${card.nickname}`);
            setConfirm(null);
          }
        }}
      />
      {confirm === "own" && <GiveOwnCardModal card={card} merchant={m} onClose={() => setConfirm(null)} />}
    </div>
  );
}

function ActionRow({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-fg-2 [&_svg]:size-[18px]" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-fg">{title}</div>
        <div className="text-[12px] leading-[16px] text-fg-3">{body}</div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
