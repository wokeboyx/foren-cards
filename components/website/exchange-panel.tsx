"use client";
import * as React from "react";
import Link from "next/link";
import { RiArrowUpDownLine, RiCheckLine, RiWhatsappLine } from "@remixicon/react";
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { CALCULATOR, DIAL_CODES, defaultDialIso, dialFor, formatAmount, rate } from "./data";
import { CurrencyPill, GlassCard, Intro, Panel, ink, linkBtn, muted, primaryBtn, secondaryBtn, validPhone } from "./shared";

/** "See it before you commit to it." (website Figma 3011:4362), plus a daily rate on WhatsApp. */
export function ExchangePanel() {
  const [from, setFrom] = React.useState("NGN");
  const [to, setTo] = React.useState("USD");
  const [amount, setAmount] = React.useState("200,000");

  const send = Number(amount.replace(/,/g, "")) || 0;
  const receive = send * rate(from, to);
  // Quote the rate the way the website does: 1 unit of the stronger currency.
  const [base, quote] = rate(from, to) < 1 ? [to, from] : [from, to];
  // Picking the other side's currency swaps the two.
  const pick = (side: "from" | "to", v: string) => {
    if (side === "from") {
      if (v === to) setTo(from);
      setFrom(v);
    } else {
      if (v === from) setFrom(to);
      setTo(v);
    }
  };
  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
      <Intro title={
          <>
            See it before
            <br />
            you commit to it.
          </>
        } description="The rate you see is the rate you get. Every time">
        <DailyRate />
      </Intro>

      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/website/dollar-coin.png")} alt="" width={320} height={320} className="pointer-events-none absolute -right-28 -bottom-24 hidden size-[320px] select-none sm:block" />
        <GlassCard>
          <div className="relative flex flex-col gap-4">
            <AmountRow label="You send" currency={from} onCurrency={(v) => pick("from", v)}>
              <input
                aria-label="Amount you send"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
                onBlur={() => send && setAmount(send.toLocaleString("en-GB", { maximumFractionDigits: 2 }))}
                className={cn("w-full bg-transparent text-right text-[30px] leading-[36px] font-semibold tracking-[-0.75px] outline-none", ink)}
              />
            </AmountRow>
            <button
              type="button"
              onClick={swap}
              aria-label="Swap currencies"
              className="absolute top-[76px] left-1/2 z-10 grid size-10 -translate-x-1/2 place-items-center rounded-full border border-[rgba(198,178,187,0.3)] bg-white text-[#2f2d2b] shadow-sm outline-none hover:bg-[#fafaf9] focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30"
            >
              <RiArrowUpDownLine className="size-5" aria-hidden />
            </button>
            <AmountRow label="They receive" currency={to} onCurrency={(v) => pick("to", v)}>
              <p className={cn("text-right text-[30px] leading-[36px] font-semibold tracking-[-0.75px]", ink)} aria-live="polite">
                {formatAmount(receive)}
              </p>
            </AmountRow>
            <Panel className="flex flex-col gap-4 p-6">
              <Row label="Exchange rate">
                <span className={cn("text-[14px]", ink)}>
                  1 {base} ≈ {formatAmount(rate(base, quote))} {quote}
                </span>
              </Row>
              <Row label="Our fee">
                <Badge icon="/website/confetti.svg">Free</Badge>
              </Row>
              <Row label="Arrives">
                <Badge icon="/website/lightning.svg">Instantly</Badge>
              </Row>
            </Panel>
          </div>
          <Link href="/onboarding" className={cn(primaryBtn, "mt-8 w-full")}>
            Send money
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}

/** Opt in to daily rates on WhatsApp. Prototype only: nothing is sent. */
function DailyRate() {
  const [dial, setDial] = React.useState("ng");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only default, after hydration
  React.useEffect(() => setDial(defaultDialIso()), []);
  const [phone, setPhone] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);

  const dialInfo = dialFor(dial);
  const invalid = tried && !validPhone(phone);

  if (done)
    return (
      <p className={cn("flex max-w-[440px] items-center gap-2 text-[14px]", muted)} role="status">
        <RiCheckLine className="size-4 shrink-0 text-[#1da851]" aria-hidden />
        <span>
          Daily rates go to {done} every morning.{" "}
          <button type="button" onClick={() => setDone(null)} className={linkBtn}>
            Change
          </button>
        </span>
      </p>
    );

  return (
    <form
      noValidate
      className="max-w-[440px]"
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (!validPhone(phone)) return document.getElementById("daily-phone")?.focus();
        setDone(`${dialInfo.code} ${phone.trim()}`);
      }}
    >
      <label htmlFor="daily-phone" className={cn("flex items-center gap-2 text-[14px] font-medium", ink)}>
        <RiWhatsappLine className="size-4 text-[#1da851]" aria-hidden /> Get daily rates on WhatsApp
      </label>
      <div
        className={cn(
          "mt-3 flex h-12 items-center rounded-full border bg-white py-1 pr-1 pl-1.5 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#2f2d2b]/15",
          invalid ? "border-[#d92d20]" : "border-[#e6e4e2] has-[input:focus-visible]:border-[#2f2d2b]"
        )}
      >
        <span className="relative flex h-full shrink-0 items-center gap-1.5 rounded-full px-2 hover:bg-[#f6f5f2] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dialInfo.flag} alt="" width={18} height={18} className="size-[18px] rounded-full" />
          <span className={cn("text-[14px] font-medium", ink)}>{dialInfo.code}</span>
          <select aria-label="Country code" value={dial} onChange={(e) => setDial(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
            {DIAL_CODES.map((d) => (
              <option key={d.iso} value={d.iso}>
                {d.country} ({d.code})
              </option>
            ))}
          </select>
        </span>
        <span className="mx-1 h-5 w-px shrink-0 bg-[#e6e4e2]" aria-hidden />
        <input
          id="daily-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="WhatsApp number"
          value={phone}
          aria-invalid={invalid}
          aria-describedby={invalid ? "daily-phone-error" : undefined}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ""))}
          className={cn("h-full min-w-0 flex-1 bg-transparent px-2 text-[14px] font-medium outline-none placeholder:text-[#b5b0ab]", ink)}
        />
        <button type="submit" className={cn(secondaryBtn, "h-10 shrink-0 px-4")}>
          Subscribe
        </button>
      </div>
      {invalid && (
        <p id="daily-phone-error" role="alert" className="mt-1.5 px-3 text-[12px] font-medium text-[#d92d20]">
          Enter your WhatsApp number
        </p>
      )}
    </form>
  );
}

function AmountRow({ label, currency, onCurrency, children }: { label: string; currency: string; onCurrency: (v: string) => void; children: React.ReactNode }) {
  return (
    <Panel className="flex items-end gap-2 py-2 pr-6 pl-2">
      <div className="flex flex-1 flex-col gap-1">
        <p className={cn("px-2 py-1 text-[12px] font-medium tracking-[0.12px]", muted)}>{label}</p>
        <div>
          <CurrencyPill label={`${label} currency`} value={currency} options={CALCULATOR} onChange={onCurrency} />
        </div>
      </div>
      <div className="flex-1 pb-1">{children}</div>
    </Panel>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={cn("text-[14px] font-medium tracking-[0.14px]", muted)}>{label}</span>
      {children}
    </div>
  );
}

function Badge({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-[16px] bg-[#f8f8f8] px-2 text-[12px] font-medium mix-blend-multiply", ink)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(icon)} alt="" width={14} height={14} className="size-3.5" />
      {children}
    </span>
  );
}
