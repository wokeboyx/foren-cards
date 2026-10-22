"use client";
import * as React from "react";
import Link from "next/link";
import { RiArrowLeftLine, RiArrowRightLine, RiWhatsappLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { PAY_IN, RECEIVE_IN, defaultDialIso, whatsappLink } from "./data";
import { CurrencyPill, FieldLabel, Flag, GlassCard, Intro, Panel, PhoneField, StepList, inputCls, ink, linkBtn, muted, primaryBtn, validPhone } from "./shared";

type Step = "route" | "details" | "sent";
const LIST_INDEX: Record<Step, number> = { route: 0, details: 1, sent: 3 };

/** Get a quote on WhatsApp: pick both currencies, say who you are, continue in WhatsApp with the request typed. */
export function QuotePanel() {
  const [step, setStep] = React.useState<Step>("route");
  const [from, setFrom] = React.useState("NGN");
  const [to, setTo] = React.useState("USD");
  const [form, setForm] = React.useState({ first: "", last: "", company: "", dial: "ng", phone: "" });
  const [tried, setTried] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only default, after hydration
  React.useEffect(() => setForm((f) => ({ ...f, dial: defaultDialIso() })), []);

  const go = (next: Step) => {
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };
  const pickFrom = (v: string) => {
    setFrom(v);
    if (v === to) setTo(RECEIVE_IN.find((c) => c !== v)!);
  };

  const message = `Hi Foren, I’m ${form.first.trim()} ${form.last.trim()} from ${form.company.trim()}. I’d like a quote for ${from}/${to}.`;
  const missing = { first: !form.first.trim(), last: !form.last.trim(), company: !form.company.trim(), phone: !validPhone(form.phone) };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    const first = (Object.keys(missing) as (keyof typeof missing)[]).find((k) => missing[k]);
    if (first) return document.getElementById(`wa-${first}`)?.focus();
    window.open(whatsappLink(message), "_blank", "noopener");
    go("sent");
  };

  return (
    <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
      <Intro title={<>Get a quote on WhatsApp.</>} description="Pick your currencies. Our team sends your rate on WhatsApp.">
        <StepList steps={["Choose your currencies", "Tell us who you are", "Get your quote on WhatsApp"]} current={LIST_INDEX[step]} />
      </Intro>

      <GlassCard>
        {step === "route" && (
          <div className="flex flex-col gap-4">
            <h3 ref={headingRef} tabIndex={-1} className="sr-only">
              Choose your currencies
            </h3>
            <Panel className="flex items-center justify-between gap-4 py-3 pr-3 pl-5">
              <span className={cn("text-[14px] font-medium", muted)}>You pay</span>
              <CurrencyPill label="Currency you pay in" value={from} options={PAY_IN} onChange={pickFrom} />
            </Panel>
            <Panel className="flex items-center justify-between gap-4 py-3 pr-3 pl-5">
              <span className={cn("text-[14px] font-medium", muted)}>Your supplier receives</span>
              <CurrencyPill label="Your supplier’s currency" value={to} options={RECEIVE_IN.filter((c) => c !== from)} onChange={setTo} />
            </Panel>
            <Panel className="flex flex-col items-center px-6 py-8 text-center" aria-live="polite">
              <div className="flex -space-x-3">
                <Flag code={from} size={56} className="ring-4 ring-[#f3f3f3]" />
                <Flag code={to} size={56} className="ring-4 ring-[#f3f3f3]" />
              </div>
              <p className={cn("mt-4 inline-flex items-center gap-2 text-[22px] font-semibold tracking-[-0.3px]", ink)}>
                {from} <RiArrowRightLine className="size-5 text-[#95908b]" aria-label="to" /> {to}
              </p>
              <p className={cn("mt-1 text-[14px]", muted)}>
                You pay in {from}. Your supplier gets {to}.
              </p>
            </Panel>
            <button type="button" onClick={() => go("details")} className={cn(primaryBtn, "mt-4 w-full")}>
              Get a quote
            </button>
          </div>
        )}

        {step === "details" && (
          <form noValidate onSubmit={submit}>
            <Panel className="p-5 sm:p-6">
              <h3 ref={headingRef} tabIndex={-1} className={cn("text-[18px] font-semibold tracking-[-0.2px] outline-none", ink)}>
                Who should we send the {from}/{to} quote to?
              </h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField id="wa-first" label="First name" autoComplete="given-name" value={form.first} onChange={(v) => setForm({ ...form, first: v })} error={tried && missing.first} />
                <TextField id="wa-last" label="Last name" autoComplete="family-name" value={form.last} onChange={(v) => setForm({ ...form, last: v })} error={tried && missing.last} />
                <TextField className="sm:col-span-2" id="wa-company" label="Company" autoComplete="organization" value={form.company} onChange={(v) => setForm({ ...form, company: v })} error={tried && missing.company} />
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="wa-phone">WhatsApp number</FieldLabel>
                  <PhoneField id="wa-phone" dial={form.dial} onDial={(v) => setForm({ ...form, dial: v })} number={form.phone} onNumber={(v) => setForm({ ...form, phone: v })} invalid={tried && missing.phone} />
                  {tried && missing.phone && <Error>Enter your WhatsApp number</Error>}
                </div>
              </div>
            </Panel>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 px-2">
              <button type="button" onClick={() => go("route")} className={cn("inline-flex items-center gap-1", linkBtn)}>
                <RiArrowLeftLine className="size-4" aria-hidden /> Back
              </button>
              <button type="submit" className={primaryBtn}>
                <RiWhatsappLine className="size-5" aria-hidden /> Continue on WhatsApp
              </button>
            </div>
          </form>
        )}

        {step === "sent" && (
          <div>
            <Panel className="flex flex-col items-center px-6 py-10 text-center">
              <RiWhatsappLine className="size-10 text-[#1da851]" aria-hidden />
              <h3 ref={headingRef} tabIndex={-1} className={cn("mt-4 text-[22px] font-semibold tracking-[-0.3px] outline-none", ink)}>
                Check WhatsApp
              </h3>
              <p className={cn("mt-2 max-w-[320px] text-[14px] leading-[21px]", muted)}>
                Send the message and we’ll reply with your {from}/{to} quote.
              </p>
              <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className={cn("mt-3", linkBtn)}>
                Didn’t open? Try again
              </a>
            </Panel>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-6 px-2">
              <button type="button" onClick={() => go("route")} className={linkBtn}>
                Start over
              </button>
              <Link href="/onboarding" className={primaryBtn}>
                Open business account
              </Link>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input id={id} value={value} autoComplete={autoComplete} aria-invalid={error} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      {error && <Error>Enter your {label.toLowerCase()}</Error>}
    </div>
  );
}

function Error({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-[12px] font-medium text-[#d92d20]">
      {children}
    </p>
  );
}
