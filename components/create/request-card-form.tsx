"use client";
import * as React from "react";
import Image from "next/image";
import { asset } from "@/lib/base-path";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { RiArrowLeftLine, RiArrowRightLine, RiCloseLine, RiTimeLine } from "@remixicon/react";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { cn } from "@/lib/utils";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import { ForenInput } from "@/components/ui/foren-input";
import { CardArt } from "@/components/card/card-art";
import { LinkButton } from "@/components/link-button";
import { POLICY } from "@/config/policy";
import { COPY } from "@/content/copy";
import { PERIOD_LABEL, PERIOD_PHRASE } from "@/domain/labels";
import { format, parseAmount } from "@/domain/money";
import type { CardRequest, Currency, LimitPeriod } from "@/domain/types";
import { COMPANY, PEOPLE } from "@/fixtures/seed";
import { requestNewCard } from "@/lib/actions";
import { useAction } from "@/lib/api";
import { can } from "@/lib/permissions";
import { currentUserId, personById, useStore } from "@/lib/store";
import { MerchantScope } from "./permissions-editor";
import { NotAllowed } from "./route-pages";

const STEPS = [
  { title: "What’s the card for?", desc: "Give it a name your team will recognise, and tell the account owner why you need it." },
  { title: "Where will you use it?", desc: "Choose whether it’s for one merchant or many. The account owner can change this when they approve." },
  { title: "How much will you spend?", desc: "Ask for the limit you expect to need. The account owner decides the final amount." },
];

/**
 * A team member asks for a card. Same focus layout as Create card (progress bar, live preview on the right),
 * so the request feels like the owner's create flow. Sending it adds a "Pending request" row to their card list.
 */
export function RequestCardForm() {
  const role = useStore((s) => s.role);
  const me = personById(currentUserId(role));
  const owner = PEOPLE.find((p) => p.role === "owner");
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(0);
  const [pane, setPane] = React.useState<"form" | "preview">("form");
  const [nickname, setNickname] = React.useState("");
  const [note, setNote] = React.useState("");
  const [oneMerchant, setOneMerchant] = React.useState(false);
  const [period, setPeriod] = React.useState<LimitPeriod>("monthly");
  const [currency, setCurrency] = React.useState<Currency>("USD");
  const [amountText, setAmountText] = React.useState("500");
  const [errors, setErrors] = React.useState<{ nickname?: string; limit?: string }>({});
  const [sent, setSent] = React.useState<CardRequest | null>(null);
  const send = useAction(requestNewCard);
  const amount = parseAmount(amountText, currency);

  if (can(role, "issue") || role === "individual")
    return (
      <div className="mx-auto max-w-[640px] p-6">
        <NotAllowed body="Account owners create cards directly. Use Create card instead." />
      </div>
    );

  const preview = { design: "midnight" as const, nickname: nickname.trim() || "Card nickname", last4: "", kind: "standard" as const, status: "active" as const, permissions: { mode: oneMerchant ? ("first_merchant" as const) : ("anywhere" as const) } };

  const check = (n: number) => {
    const e: typeof errors = {};
    if (n === 0) {
      if (!nickname.trim()) e.nickname = "Give the card a name, like “Team travel”.";
      else if (nickname.trim().length > 40) e.nickname = "Use 40 characters or fewer.";
    }
    if (n === 2) {
      const max = POLICY.maxLimitMajor[currency];
      if (!amount || amount.minor <= 0) e.limit = "Enter an amount above zero, using numbers only.";
      else if (amount.minor > max * 100) e.limit = `The most you can ask for is ${format({ minor: max * 100, currency })}.`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // The primary action stays disabled until this step is complete.
  const ready =
    step === 0
      ? nickname.trim().length > 0 && nickname.trim().length <= 40
      : step === 2
        ? !!amount && amount.minor > 0 && amount.minor <= POLICY.maxLimitMajor[currency] * 100
        : true;

  const submit = async () => {
    if (!check(step)) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    const r = await send.run({ nickname: nickname.trim(), note: note.trim() || undefined, oneMerchant, design: "midnight", limit: { period, amount: amount! } });
    if (r.ok) setSent(r.value);
  };

  if (sent)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-subtle px-5 py-16 text-center">
        <Link href="/cards" aria-label="Close" className="fixed top-5 right-5 grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus">
          <RiCloseLine className="size-5" aria-hidden />
        </Link>
        <motion.div initial={reduce ? false : { opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative">
          <CardArt card={preview} size="md" holderName={me?.name} className="opacity-70" />
          <span className="absolute -top-2.5 -left-2">
            <ForenBadge color="orange" leadingIcon={<RiTimeLine aria-hidden />}>
              Pending request
            </ForenBadge>
          </span>
        </motion.div>
        <h1 className="mt-6 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg">Request sent</h1>
        <p className="mt-2 max-w-sm text-[14px] leading-[22px] text-fg-2">
          {owner?.name.split(" ")[0]} will review it. It shows in your cards as a pending request, and we’ll let you know when it’s approved.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <LinkButton href={`/cards?request=${sent.id}`}>View request</LinkButton>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className={cn("flex min-w-0 flex-col lg:flex-1", pane === "form" && "flex-1")}>
        <header className="flex h-16 items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5 text-[14px] font-medium text-fg">
            <Image src={asset("/foren-logo.svg")} alt="" width={22} height={22} />
            {COMPANY.name}
          </div>
          <Link href="/cards" aria-label="Close" className="grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus lg:hidden">
            <RiCloseLine className="size-5" aria-hidden />
          </Link>
        </header>
        {/* Phones/tablets: switch between the form and the live preview (desktop shows both side by side). */}
        <div className="px-5 pb-2 sm:px-8 lg:hidden">
          <ForenSegmentedControl
            size="lg"
            fullWidth
            ariaLabel="Show"
            options={[
              { value: "form", label: "Details" },
              { value: "preview", label: "Preview" },
            ]}
            value={pane}
            onChange={(v) => setPane(v as "form" | "preview")}
          />
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className={cn("w-full flex-1 flex-col lg:flex", pane === "form" ? "flex" : "hidden")}
        >
          <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 pb-8 sm:px-8">
          <div role="progressbar" aria-label="Request card progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${STEPS.length}`} className="mt-2 h-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-[var(--color-foren-bg-button-primary)] transition-[width] duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <p className="mt-6 text-[13px] font-medium text-fg-3">
            Request a card · Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="mt-1 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg">{STEPS[step].title}</h1>
          <p className="mt-1 mb-2 text-[14px] leading-[21px] text-fg-2">{STEPS[step].desc}</p>

          <div className="space-y-4 py-4">
            {step === 0 && (
              <>
                <ForenInput label="Card name" placeholder="e.g. Team travel" value={nickname} maxLength={40} onChange={(e) => setNickname(e.target.value)} error={errors.nickname} description="Shown on the card and in your card list." />
                <div className="flex flex-col gap-2">
                  <label htmlFor="req-note" className="text-[14px] font-medium text-fg">
                    Why do you need it? <span className="font-normal text-fg-3">(optional)</span>
                  </label>
                  <textarea id="req-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Flights and hotels for the Abuja client visit." className="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus" />
                  <span className="tnum text-right text-[12px] text-fg-3">{note.length}/500</span>
                </div>
              </>
            )}
            {step === 1 && <MerchantScope value={oneMerchant ? "one" : "many"} onChange={(v) => setOneMerchant(v === "one")} />}
            {step === 2 && (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="req-period" className="text-[14px] font-medium text-fg">
                    Limit type
                  </label>
                  <select id="req-period" value={period} onChange={(e) => setPeriod(e.target.value as LimitPeriod)} className="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
                    {(Object.keys(PERIOD_LABEL) as LimitPeriod[]).map((p) => (
                      <option key={p} value={p}>
                        {PERIOD_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-[1fr_120px] gap-3">
                  <ForenInput label={`${PERIOD_LABEL[period]} limit`} inputMode="decimal" value={amountText} onChange={(e) => setAmountText(e.target.value)} error={errors.limit} className="tnum" description={!errors.limit && amount ? `Up to ${format(amount)} ${PERIOD_PHRASE[period]}.` : undefined} />
                  <div className="flex flex-col gap-2">
                    <label htmlFor="req-cur" className="text-[14px] font-medium text-fg">
                      Currency
                    </label>
                    <select id="req-cur" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
                      {POLICY.launchCurrencies.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          </div>

          {/* Floating action bar (Figma "Floating button"): full content width, pinned to the bottom. */}
          <div className="sticky bottom-0 z-20 border-t border-line bg-surface px-5 py-3 sm:min-h-[84px] sm:px-8 sm:py-5">
            {send.error && <p role="alert" className="mb-3 rounded-[14px] bg-error-subtle px-4 py-2.5 text-[13px] text-error">We couldn’t send your request. Nothing was sent. Try again.</p>}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              {step < STEPS.length - 1 ? (
                <ForenButton type="submit" size="sm" className="w-full sm:order-last sm:flex-1" disabled={!ready} trailingIcon={<RiArrowRightLine />}>
                  Continue
                </ForenButton>
              ) : (
                <ForenButton type="submit" size="sm" className="w-full sm:order-last sm:flex-1" disabled={send.pending || !ready}>
                  {send.pending ? "Sending…" : send.error ? "Try again" : "Send request"}
                </ForenButton>
              )}
              {step > 0 ? (
                <ForenButton type="button" variant="outline" size="sm" className="w-full sm:flex-1" leadingIcon={<RiArrowLeftLine />} onClick={() => { setErrors({}); setStep(step - 1); }}>
                  Back
                </ForenButton>
              ) : (
                <LinkButton href="/cards" variant="outline" size="sm" className="w-full sm:flex-1">
                  Cancel
                </LinkButton>
              )}
            </div>
          </div>
        </form>
      </div>

      <aside aria-label="Request summary" className={cn("mx-5 mt-2 mb-5 flex-1 rounded-[20px] bg-subtle sm:mx-8 lg:sticky lg:top-2 lg:m-2 lg:block lg:h-[calc(100dvh-16px)] lg:w-[44%] lg:max-w-[600px] lg:flex-none lg:overflow-y-auto", pane === "preview" ? "block" : "hidden")}>
        <div className="hidden h-16 items-center justify-end px-6 lg:flex">
          <Link href="/cards" aria-label="Close" className="grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus">
            <RiCloseLine className="size-5" aria-hidden />
          </Link>
        </div>
        <div className="mx-auto flex max-w-[380px] flex-col items-center gap-5 px-6 py-8 lg:py-6">
          <CardArt card={preview} size="lg" holderName={me?.name} lockText={oneMerchant ? "Locks to its first merchant" : undefined} />
          <dl className="w-full divide-y divide-line rounded-[20px] bg-surface px-4 text-[13px] ring-1 ring-line">
            <Row label="Card name">{nickname.trim() || "—"}</Row>
            <Row label="For">{me?.name}</Row>
            <Row label="Merchants">{oneMerchant ? "One merchant" : "Many merchants"}</Row>
            <Row label="Limit asked for">{amount && amount.minor > 0 ? `Up to ${format(amount)} ${PERIOD_PHRASE[period]}` : "—"}</Row>
            <Row label="Goes to">{owner?.name} (account owner)</Row>
          </dl>
          <p className="text-center text-[12px] leading-[17px] text-fg-3">{COPY.cardsEmpty.value}</p>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-fg-3">{label}</dt>
      <dd className="tnum text-right text-fg">{children}</dd>
    </div>
  );
}
