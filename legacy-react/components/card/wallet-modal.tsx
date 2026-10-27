"use client";
import * as React from "react";
import { RiAppleFill, RiGoogleFill } from "@remixicon/react";
import { toast } from "sonner";
import { ForenButton } from "@/components/ui/foren-button";
import { Modal } from "@/components/overlay";
import { nameOnCard } from "@/components/card/holder";
import type { Card } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { addToWallet } from "@/lib/actions";
import { useAction } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DESIGNS } from "./designs";

export type Wallet = "apple" | "google";

const WALLET = {
  apple: {
    name: "Apple Pay",
    app: "Wallet",
    icon: <RiAppleFill />,
    steps: ["On your iPhone, open Wallet and tap +.", "Choose Debit or Credit Card and scan the front.", "Scan the back when asked, then confirm."],
  },
  google: {
    name: "Google Pay",
    app: "Google Wallet",
    icon: <RiGoogleFill />,
    steps: ["On your phone, open Google Wallet and tap Add to Wallet.", "Choose Payment card and scan the front.", "Scan the back when asked, then confirm."],
  },
} as const;

const phoneQuery = "(max-width: 767px)";
function useIsPhone() {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(phoneQuery);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(phoneQuery).matches,
    () => false
  );
}

/**
 * Add a card to Apple Pay / Google Pay. Businesses mostly work on desktop, so the modal shows the
 * card's front and back for the phone's Wallet camera to scan. On a phone it adds the card directly.
 * Simulated: real provisioning depends on the card processor.
 */
export function WalletModal({ card, wallet, open, onOpenChange }: { card: Card; wallet: Wallet; open: boolean; onOpenChange: (o: boolean) => void }) {
  const phone = useIsPhone();
  const w = WALLET[wallet];
  const add = useAction(addToWallet);

  const done = async () => {
    const r = await add.run(card.id, wallet);
    if (r.ok) {
      toast(`Added to ${w.name}`);
      onOpenChange(false);
    } else toast("We couldn’t add the card. Try again.");
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Add to ${w.name}`}
      description={phone ? `Add this card to ${w.app} on this phone.` : `Scan this card with ${w.app} on your phone.`}
      className={phone ? undefined : "sm:max-w-[680px]"}
    >
      <div className="flex items-center justify-between gap-3 rounded-[16px] bg-subtle px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-fg">{COMPANY.name}</div>
          <div className="truncate text-[13px] text-fg-3">
            {card.nickname} •• {card.last4}
          </div>
        </div>
        <span className="text-[12px] font-medium text-fg-3">Virtual card</span>
      </div>

      {phone ? (
        <div className="mt-5 space-y-4">
          <CardFront card={card} masked />
          <p className="text-[14px] leading-[21px] text-fg-2">{w.app} opens with this card ready. Confirm there to finish.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <figure>
              <CardFront card={card} />
              <figcaption className="mt-2 text-center text-[12px] font-medium text-fg-3">Front</figcaption>
            </figure>
            <figure>
              <CardBack card={card} />
              <figcaption className="mt-2 text-center text-[12px] font-medium text-fg-3">Back</figcaption>
            </figure>
          </div>
          <ol className="mt-5 space-y-2">
            {w.steps.map((s, i) => (
              <li key={s} className="flex items-start gap-3 text-[14px] leading-[21px] text-fg-2">
                <span className="tnum grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-[12px] font-semibold text-fg">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[12px] text-fg-3">Test card. Only show these details to the cardholder.</p>
        </>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="secondary" size="sm" onClick={() => onOpenChange(false)} disabled={add.pending}>
          Cancel
        </ForenButton>
        {phone ? (
          <button
            type="button"
            onClick={done}
            disabled={add.pending}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60 [&_svg]:size-4",
              wallet === "apple" ? "bg-[#0b0b0b] text-white" : "bg-surface text-fg ring-1 ring-line"
            )}
          >
            {w.icon}
            {add.pending ? "Adding…" : `Add to ${w.name}`}
          </button>
        ) : (
          <ForenButton size="sm" onClick={done} disabled={add.pending}>
            {add.pending ? "Saving…" : "I’ve added it"}
          </ForenButton>
        )}
      </div>
    </Modal>
  );
}

const face = "relative isolate aspect-[1.586] w-full overflow-hidden rounded-[16px] shadow-[var(--shadow-foren-sm)]";

/** Card front with the full number, large enough for a phone camera to read. Test number only. */
function CardFront({ card, masked }: { card: Card; masked?: boolean }) {
  const d = DESIGNS[card.design];
  // On a phone nothing is scanned, so the number stays masked.
  const pan = masked ? `•••• •••• •••• ${card.last4}` : `4000 0012 3456 ${card.last4}`;
  return (
    <div role="img" aria-label={`Front of ${card.nickname}: ${pan}, expires ${card.expiry.slice(5)}/${card.expiry.slice(2, 4)}`} className={face} style={{ background: `linear-gradient(135deg, ${d.stops.join(", ")})`, color: d.text }}>
      <div className="flex h-full flex-col justify-between p-[7%]">
        <div className="flex items-start justify-between">
          <span className="text-[13px] font-semibold">{COMPANY.name}</span>
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: d.muted }}>
            Virtual
          </span>
        </div>
        <div>
          <div className="tnum font-mono text-[19px] font-semibold tracking-[0.08em]">{pan}</div>
          <div className="mt-2 flex items-end justify-between gap-2 text-[12px] font-medium uppercase tracking-[0.06em]" style={{ color: d.muted }}>
            <span className="truncate">{nameOnCard(card)}</span>
            <span className="tnum shrink-0">
              {card.expiry.slice(5)}/{card.expiry.slice(2, 4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardBack({ card }: { card: Card }) {
  const d = DESIGNS[card.design];
  return (
    <div role="img" aria-label={`Back of ${card.nickname}: security code 123`} className={face} style={{ background: `linear-gradient(135deg, ${d.stops.join(", ")})`, color: d.text }}>
      <div className="mt-[9%] h-[18%] bg-[#17120d]" />
      <div className="mt-[7%] flex items-center gap-3 px-[7%]">
        <div className="h-8 flex-1 rounded-[4px] bg-white/85" />
        <div className="tnum rounded-[4px] bg-white px-2.5 py-1 font-mono text-[16px] font-semibold text-[#241c15]">123</div>
      </div>
      <div className="absolute bottom-[8%] left-[7%] text-[11px] font-medium" style={{ color: d.muted }}>
        Security code
      </div>
    </div>
  );
}
