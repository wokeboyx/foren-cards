"use client";
import * as React from "react";
import { RiCheckLine, RiFileCopyLine, RiLockLine, RiStore2Line } from "@remixicon/react";
import { toast } from "sonner";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenToggle } from "@/components/ui/foren-toggle";
import { CardArt } from "@/components/card/card-art";
import { Modal } from "@/components/overlay";
import { format } from "@/domain/money";
import type { Card, Merchant } from "@/domain/types";
import { giveMerchantOwnCard } from "@/lib/actions";
import { useAction } from "@/lib/api";
import { personById } from "@/lib/store";
import { cn } from "@/lib/utils";

// Payments happen at the merchant's checkout, not in Foren, so moving a merchant to its own card needs the
// customer to update their card with that merchant.

/**
 * Guided move of one merchant off a shared card:
 * 1. create a card only this merchant can charge → 2. update your card with the merchant (off-app)
 * → Foren blocks the merchant on the old card once it charges the new one.
 */
export function GiveOwnCardModal({ card, merchant, onClose }: { card: Card; merchant: Merchant; onClose: () => void }) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [blockOld, setBlockOld] = React.useState(true);
  const [created, setCreated] = React.useState<Card | null>(null);
  const create = useAction(giveMerchantOwnCard);
  const holder = personById(card.holderId);
  const preview: Card = created ?? { ...card, nickname: merchant.name, lockedMerchantId: merchant.id, last4: "••••" };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={step === 1 ? `Give ${merchant.name} its own card` : `Update your card at ${merchant.name}`} className="max-w-[480px]">
      <Steps step={step} />
      {step === 1 ? (
        <div className="space-y-4">
          <div className="flex justify-center rounded-[16px] bg-subtle py-5">
            <CardArt card={preview} size="md" merchantName={merchant.name} holderName={holder?.name} />
          </div>
          <ul className="space-y-2 text-[14px] leading-[20px] text-fg">
            <Li icon={<RiLockLine />}>Only {merchant.name} can charge it. Every other merchant is declined.</Li>
            <Li icon={<RiStore2Line />}>
              Same cardholder, funding and limit as {card.nickname}
              {card.limit.amount.minor < 1_000_000_000 ? ` (${format(card.limit.amount)} ${card.limit.period === "per_txn" ? "per charge" : card.limit.period})` : ""}. You can change them later.
            </Li>
          </ul>
          <ForenToggle
            reverse
            className="w-full justify-between rounded-[16px] bg-subtle p-3.5"
            label={`Block ${merchant.name} on ${card.nickname} once it switches`}
            description={`When ${merchant.name} first charges its new card, we’ll stop it charging ${card.nickname}.`}
            checked={blockOld}
            onCheckedChange={setBlockOld}
          />
          {create.error && <p role="alert" className="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t create the card. Nothing was changed. Try again.</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <ForenButton variant="secondary" size="sm" onClick={onClose}>
              Not now
            </ForenButton>
            <ForenButton
              size="sm"
              disabled={create.pending}
              onClick={async () => {
                const r = await create.run(card.id, merchant.id, blockOld);
                if (r.ok) {
                  setCreated(r.value);
                  setStep(2);
                }
              }}
            >
              {create.pending ? "Creating…" : `Create ${merchant.name} card`}
            </ForenButton>
          </div>
        </div>
      ) : (
        created && <UpdateAtMerchant card={created} merchant={merchant} oldCard={card} blockOld={blockOld} onDone={onClose} />
      )}
    </Modal>
  );
}

function UpdateAtMerchant({ card, merchant, oldCard, blockOld, onDone }: { card: Card; merchant: Merchant; oldCard: Card; blockOld: boolean; onDone: () => void }) {
  const [copied, setCopied] = React.useState<string | null>(null);
  const pan = `4000 0012 3456 ${card.last4}`;
  const expiry = `${card.expiry.slice(5)}/${card.expiry.slice(2, 4)}`;
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(label);
    toast(`${label} copied`);
  };
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-[21px] text-fg-2">
        Card •• {card.last4} is ready. Foren can’t change your card at {merchant.name} for you: sign in to {merchant.name}, open your payment settings and replace the card with these details.
      </p>
      <ul className="divide-y divide-line rounded-[16px] ring-1 ring-line">
        {[
          ["Card number", pan, pan.replace(/\s/g, "")],
          ["Expiry date", expiry, expiry],
          ["Security code", "123", "123"],
        ].map(([label, value, raw]) => (
          <li key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div>
              <div className="text-[12px] text-fg-3">{label}</div>
              <div className="tnum text-[15px] font-semibold text-fg">{value}</div>
            </div>
            <button
              type="button"
              onClick={() => copy(label, raw)}
              aria-label={`Copy ${label.toLowerCase()}`}
              className={cn("grid size-8 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus", copied === label ? "bg-success-subtle text-success" : "text-fg-2 hover:bg-subtle")}
            >
              {copied === label ? <RiCheckLine className="size-4" aria-hidden /> : <RiFileCopyLine className="size-4" aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
      <p className="rounded-[14px] bg-subtle px-3.5 py-2.5 text-[13px] leading-[18px] text-fg-2">
        Until you do, {merchant.name} keeps charging {oldCard.nickname}, so nothing breaks.
        {blockOld ? ` When ${merchant.name} first charges •• ${card.last4}, we’ll block it on ${oldCard.nickname} and let you know.` : ""}
      </p>
      <div className="flex justify-end">
        <ForenButton
          size="sm"
          onClick={() => {
            toast(`We’ll let you know when ${merchant.name} switches`);
            onDone();
          }}
        >
          Done
        </ForenButton>
      </div>
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <ol className="-mt-2 mb-4 flex items-center gap-2 text-[12px] font-medium" aria-label="Steps">
      {["Create the card", "Update it at the merchant"].map((label, i) => (
        <li key={label} className={cn("flex items-center gap-2", i + 1 === step ? "text-fg" : "text-fg-3")} aria-current={i + 1 === step ? "step" : undefined}>
          <span className={cn("tnum grid size-5 place-items-center rounded-full text-[11px]", i + 1 < step ? "bg-success text-white" : i + 1 === step ? "bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]" : "bg-subtle")}>
            {i + 1 < step ? <RiCheckLine className="size-3" aria-hidden /> : i + 1}
          </span>
          {label}
          {i === 0 && <span className="h-px w-6 bg-line-2" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function Li({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-fg-2">
      {icon}
      <span>{children}</span>
    </li>
  );
}
