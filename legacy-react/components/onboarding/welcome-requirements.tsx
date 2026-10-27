"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RiCheckLine, RiErrorWarningLine, RiInformationFill, RiMailCheckLine } from "@remixicon/react";
import { Modal } from "@/components/overlay";
import { ForenButton } from "@/components/ui/foren-button";
import {
  ENTITY_HINT,
  ENTITY_LABEL,
  ONBOARDING_COUNTRIES,
  WAITLIST_COUNTRIES,
  countryInfo,
  requirementsFor,
  type CountryCode,
  type EntityType,
} from "@/domain/onboarding";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Field, FormCard, OnboardingFrame, fieldCls } from "./frame";

const FLAG: Record<CountryCode, string> = { NG: "🇳🇬", GB: "🇬🇧", CA: "🇨🇦", KE: "🇰🇪" };
const WAIT_PREFIX = "wait:";
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** What each entity type can do once verified. */
function capabilities(entity: EntityType): string[] {
  if (entity === "mto")
    return ["Pay out to your customers in many currencies", "Hold NGN, USD, GBP, CAD and more", "Collect and settle through our API"];
  return [
    "Send and receive domestically and internationally",
    "Hold NGN, USD, GBP, CAD and more",
    entity === "company" ? "Collect and settle in multiple currencies" : "Collect and pay in multiple currencies",
  ];
}

export function WelcomeRequirements() {
  const router = useRouter();
  const country = useOnboarding((s) => s.country);
  const entity = useOnboarding((s) => s.entity);
  const waitlist = useOnboarding((s) => s.waitlist);
  const set = useOnboarding((s) => s.set);
  // A waitlist country isn't stored as `country` (we can't onboard it); keep the pick locally.
  const [waitCountry, setWaitCountry] = React.useState<string | null>(null);
  const [whyOpen, setWhyOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const info = countryInfo(country);
  const allowed = info?.entities ?? [];
  const validEntity = entity && allowed.includes(entity) ? entity : null;
  const ready = !waitCountry && !!info && !!validEntity;

  const selectValue = waitCountry ? WAIT_PREFIX + waitCountry : (country ?? "");
  const onCountry = (v: string) => {
    if (v.startsWith(WAIT_PREFIX)) {
      setWaitCountry(v.slice(WAIT_PREFIX.length));
      set({ country: null });
      return;
    }
    setWaitCountry(null);
    const next = v as CountryCode;
    const nextAllowed = countryInfo(next)?.entities ?? [];
    set({ country: next, entity: entity && nextAllowed.includes(entity) ? entity : null });
    setExpanded(false);
  };

  return (
    <OnboardingFrame
      step="welcome"
      title="Let’s get your business set up"
      description="Answer two quick questions and we’ll show you exactly what to prepare. No surprises later."
      footer={{ primary: { label: "Continue", disabled: !ready, onClick: () => router.push("/onboarding/use") } }}
    >
      <div className="overflow-hidden rounded-[24px] bg-subtle">
        <FormCard className="gap-8">
          <Field label="Country of incorporation or residence" description="This decides which documents and IDs we’ll ask for." htmlFor="ob-country">
            <div>
              <select id="ob-country" value={selectValue} onChange={(e) => onCountry(e.target.value)} className={cn(fieldCls, !selectValue && "text-fg-3")}>
                <option value="" disabled>
                  Select your country
                </option>
                {ONBOARDING_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {FLAG[c.code]} {c.name}
                  </option>
                ))}
                <optgroup label="Coming soon">
                  {WAITLIST_COUNTRIES.map((c) => (
                    <option key={c} value={WAIT_PREFIX + c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </Field>

          {waitCountry ? (
            <Waitlist country={waitCountry} joined={waitlist?.country === waitCountry ? waitlist.email : null} />
          ) : (
            <Field
              label="Entity type"
              description="This decides your account limits and what you can use."
              htmlFor="ob-entity"
              hint={validEntity ? ENTITY_HINT[validEntity] : country === "KE" ? "In Kenya we can onboard companies and licensed MTOs/PSPs for now." : undefined}
            >
              <select
                id="ob-entity"
                value={validEntity ?? ""}
                disabled={!info}
                onChange={(e) => {
                  set({ entity: e.target.value as EntityType });
                  setExpanded(false);
                }}
                className={cn(fieldCls, !validEntity && "text-fg-3")}
              >
                <option value="" disabled>
                  Select your entity type
                </option>
                {allowed.map((e) => (
                  <option key={e} value={e}>
                    {ENTITY_LABEL[e]}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {ready && (
            <div className="flex flex-col gap-3 animate-[rise-in_200ms_ease-out]">
              <p className="text-[12px] leading-[18px] font-medium text-fg-2">
                As a <span className="text-fg">{validEntity === "mto" ? "licensed MTO or PSP" : ENTITY_LABEL[validEntity!].toLowerCase()}</span> in{" "}
                <span className="text-fg">{info!.name}</span> you can
              </p>
              <ul className="flex flex-col gap-3">
                {capabilities(validEntity!).map((c) => (
                  <li key={c} className="flex items-center gap-2 text-[12px] leading-[18px] font-medium text-fg">
                    <RiCheckLine className="size-4 shrink-0 text-success" aria-hidden />
                    {c}
                  </li>
                ))}
                {validEntity !== "sole_trader" && (
                  <li className="flex items-center gap-2 text-[12px] leading-[18px] font-medium text-warning">
                    <RiErrorWarningLine className="size-4 shrink-0" aria-hidden />
                    You’ll need to add directors and beneficial owners
                  </li>
                )}
              </ul>
            </div>
          )}
        </FormCard>

        {ready && (
          <DocumentsPanel
            country={info!.code}
            entity={validEntity!}
            expanded={expanded}
            onToggle={() => setExpanded((x) => !x)}
            onWhy={() => setWhyOpen(true)}
          />
        )}
      </div>

      {ready && <WhyModal open={whyOpen} onOpenChange={setWhyOpen} subtitle={`${ENTITY_LABEL[validEntity!]} in ${info!.name}`} />}
    </OnboardingFrame>
  );
}

function DocumentsPanel({
  country,
  entity,
  expanded,
  onToggle,
  onWhy,
}: {
  country: CountryCode;
  entity: EntityType;
  expanded: boolean;
  onToggle: () => void;
  onWhy: () => void;
}) {
  const reqs = requirementsFor({ country, entity });
  const shown = expanded ? reqs : reqs.slice(0, 3);
  const listId = React.useId();
  return (
    <section aria-labelledby={`${listId}-h`} className="flex flex-col gap-4 px-4 pt-5 pb-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${listId}-h`} className="text-[12px] leading-[18px] font-medium tracking-[0.02em] text-fg-3 uppercase">
          Documents you’ll need
        </h2>
        <button type="button" onClick={onWhy} className="text-[12px] leading-[18px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus">
          Why we need this?
        </button>
      </div>
      <ul id={listId} className="flex flex-col gap-3">
        {shown.map((r) => (
          <li key={r.id} className="flex flex-col gap-0.5">
            <span className="text-[12px] leading-[18px] font-medium text-fg">
              {r.title}
              {r.optional && <span className="text-fg-3"> (if applicable)</span>}
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-fg-2">{r.description}</span>
          </li>
        ))}
      </ul>
      {reqs.length > 3 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={onToggle}
          className="w-fit text-[12px] leading-[18px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus"
        >
          {expanded ? "See less" : `See all ${reqs.length}`}
        </button>
      )}
    </section>
  );
}

function Waitlist({ country, joined }: { country: string; joined: string | null }) {
  const set = useOnboarding((s) => s.set);
  const [email, setEmail] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const invalid = touched && !EMAIL_RE.test(email.trim());

  if (joined)
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-[16px] bg-success-subtle p-4 animate-[rise-in_200ms_ease-out]">
        <span className="grid size-8 place-items-center rounded-full bg-surface text-success">
          <RiMailCheckLine className="size-4" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-[14px] leading-[21px] font-medium text-fg">You’re on the list</p>
          <p className="text-[12px] leading-[18px] font-medium text-fg-2">
            We’ll email {joined} when Foren launches in {country === "Other country" ? "your country" : country}.
          </p>
        </div>
      </div>
    );

  return (
    <form
      noValidate
      className="flex flex-col gap-4 animate-[rise-in_200ms_ease-out]"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (EMAIL_RE.test(email.trim())) set({ waitlist: { country, email: email.trim() } });
      }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-[14px] leading-[21px] font-medium text-fg">We’re not in {country === "Other country" ? "your country" : country} yet</p>
        <p className="text-[12px] leading-[18px] font-medium text-fg-2">Join the waitlist and we’ll email you when we launch there.</p>
      </div>
      <Field label="Email" htmlFor="ob-wait-email" error={invalid ? "Enter a valid email, like name@company.com" : undefined}>
        <input
          id="ob-wait-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@company.com"
          value={email}
          aria-invalid={invalid || undefined}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => email && setTouched(true)}
          className={fieldCls}
        />
      </Field>
      <ForenButton type="submit" size="sm" variant="primary" className="w-fit" disabled={!email.trim()}>
        Join the waitlist
      </ForenButton>
    </form>
  );
}

const WHY: [string, string][] = [
  [
    "We’re required to know who you are",
    "Regulators require us to verify the businesses we onboard, and the people behind them. This is called Know Your Business (KYB), and it applies whatever your entity type or location.",
  ],
  [
    "What you share shapes what you can do",
    "The information and documents you provide decide which features you can use straight away. More verified detail unlocks more of Foren, with no separate “upgrade later” step.",
  ],
  [
    "We confirm it automatically where we can",
    "When a registry or database can confirm a detail for us, we use that instead of asking you to upload it. That keeps your list as short as possible.",
  ],
];

function WhyModal({ open, onOpenChange, subtitle }: { open: boolean; onOpenChange: (o: boolean) => void; subtitle: string }) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[476px]"
      title={
        <span className="flex items-center gap-2">
          <RiInformationFill className="size-5 shrink-0 text-[#f0b232]" aria-hidden />
          Why we need this
        </span>
      }
      description={<span className="text-[12px] leading-[18px] font-medium text-fg-2">{subtitle}</span>}
    >
      <div className="flex flex-col gap-8 rounded-[16px] bg-sunken px-3 py-5">
        {WHY.map(([h, b]) => (
          <div key={h} className="flex flex-col gap-2">
            <h3 className="text-[14px] leading-[21px] font-medium text-fg">{h}</h3>
            <p className="text-[12px] leading-[18px] font-medium text-fg-2">{b}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
