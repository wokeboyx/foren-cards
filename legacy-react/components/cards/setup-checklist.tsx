"use client";
import * as React from "react";
import {
  RiAlarmWarningLine,
  RiBuilding2Line,
  RiHistoryLine,
  RiLockLine,
  RiSearchEyeLine,
  RiRepeatLine,
  RiRouteLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import { CardArt } from "@/components/card/card-art";
import { LinkButton } from "@/components/link-button";
import { COMPANY } from "@/fixtures/seed";
import { can } from "@/lib/permissions";
import { useStore } from "@/lib/store";

const FEATURES: { icon: React.ReactNode; title: string; body: string }[] = [
  {
    icon: <RiBuilding2Line />,
    title: "Cards for people or the company",
    body: "Give a team member a card in their name, or create a company card for shared spend like subscriptions. You can add people who aren’t on Foren yet.",
  },
  {
    icon: <RiLockLine />,
    title: "Lock a card to one merchant",
    body: "The first merchant to charge it becomes the only one that can. If the details leak, nobody else can use them.",
  },
  {
    icon: <RiShieldCheckLine />,
    title: "Decide where and how much",
    body: "Set limits and allow only certain merchants or categories. Gambling, cash and crypto are blocked unless you allow them.",
  },
  {
    icon: <RiRouteLine />,
    title: "Pay from the cheapest balance",
    body: "Each charge comes from the balance that costs least to convert, and one charge can be split across balances.",
  },
  {
    icon: <RiHistoryLine />,
    title: "Freeze, cancel and see history",
    body: "Stop a card in one click. Every change is kept, with who made it and when.",
  },
  {
    icon: <RiRepeatLine />,
    title: "See subscriptions coming",
    body: "Spot recurring charges and when they’re likely to renew, and block a merchant on one card.",
  },
  {
    icon: <RiSearchEyeLine />,
    title: "Check a merchant first",
    body: "See whether a card is likely to work at a merchant before anyone pays, and fix the setting that would block it.",
  },
  {
    icon: <RiAlarmWarningLine />,
    title: "Help when a payment fails",
    body: "Your team sees why a payment was declined and can ask you for a one-time approval or an emergency card.",
  },
];

/** First visit (AC 1.1): what Foren cards can do, and one clear way to start. */
export function SetupChecklist() {
  const role = useStore((s) => s.role);
  const owner = can(role, "issue");

  if (!owner)
    return (
      <div className="rounded-[20px] bg-surface p-8 text-center">
        <h2 className="text-[20px] font-semibold text-fg">No cards yet</h2>
        <p className="mt-2 text-[14px] text-fg-2">Ask your account owner for a card. Your request shows here until they approve it.</p>
        <LinkButton href="/cards/request" className="mt-5">
          Request a card
        </LinkButton>
      </div>
    );

  return (
    <div className="space-y-8">
      <section className="grid items-center gap-8 overflow-hidden rounded-[20px] bg-surface p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <p className="text-[13px] font-medium text-fg-3">Foren Cards</p>
          <h2 className="mt-1 text-[28px] leading-[34px] font-semibold tracking-[-0.02em] text-fg">Virtual cards for every way your team spends</h2>
          <p className="mt-3 max-w-[520px] text-[15px] leading-[23px] text-fg-2">
            Create a card in seconds for a team member or for {COMPANY.name}. Every card pays from your Foren balances, and you decide where it works and how much it can spend.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <LinkButton href="/cards/new">Create your first card</LinkButton>
            <LinkButton href="/cards/check-merchant" variant="secondary">
              Check a merchant
            </LinkButton>
          </div>
        </div>
        <div className="relative mx-auto h-[210px] w-[280px]" aria-hidden>
          <div className="absolute top-0 left-6 rotate-[-8deg]">
            <CardArt card={{ design: "skyline", nickname: "Team travel", last4: "4821", kind: "standard", status: "active" }} size="md" holderName="Tunde Bello" className="w-[230px]" />
          </div>
          <div className="absolute top-16 left-0 rotate-[4deg]">
            <CardArt card={{ design: "lime", nickname: "Figma", last4: "9054", kind: "standard", status: "active" }} size="md" merchantName="Figma" holderName={COMPANY.name} className="w-[230px]" />
          </div>
        </div>
      </section>

      <section aria-labelledby="can-do">
        <h2 id="can-do" className="mb-3 text-[16px] font-semibold text-fg">
          What you can do with Foren cards
        </h2>
        <ul className="grid gap-px overflow-hidden rounded-[20px] bg-line sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="bg-surface p-5">
              <span className="grid size-9 place-items-center rounded-full bg-subtle text-fg [&_svg]:size-[18px]" aria-hidden>
                {f.icon}
              </span>
              <div className="mt-3 text-[14px] font-semibold text-fg">{f.title}</div>
              <p className="mt-1 text-[13px] leading-[19px] text-fg-2">{f.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-fg-3">
          <span className="font-medium">Coming later:</span>
          {["Treasury Mode", "Agent Cards"].map((x) => (
            <span key={x} aria-disabled="true" className="inline-flex h-7 items-center rounded-full border border-dashed border-line px-3 text-[12px] font-medium text-fg-3">
              {x}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
