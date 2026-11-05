"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChatsIcon, CheckBoldIcon, FileTextIcon, IdentificationCardIcon, InfoFillIcon, InfoIcon, UsersThreeIcon } from "@/components/icons";
import { Modal } from "@/components/overlay";
import { CountryFlag } from "@/components/country-flag";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenSelect } from "@/components/ui/foren-select";
import {
  ENTITY_HINT,
  ENTITY_LABEL,
  ONBOARDING_COUNTRIES,
  WAITLIST_COUNTRIES,
  businessCategories,
  categoryChosen,
  categoryUnsupported,
  categoryLabel,
  countryInfo,
  hasStakeholders,
  requirementsFor,
  type CountryCode,
  type EntityType,
  type Requirement,
} from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Field, FormCard, OnboardingFrame, fieldCls } from "./frame";
import { Note } from "./shared";

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
  const category = useOnboarding((s) => s.category);
  const waitlist = useOnboarding((s) => s.waitlist);
  const set = useOnboarding((s) => s.set);
  // A waitlist country isn't stored as `country` (we can't onboard it); keep the pick locally.
  const [waitCountry, setWaitCountry] = React.useState<string | null>(null);
  const [whyOpen, setWhyOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const info = countryInfo(country);
  const allowed = info?.entities ?? [];
  const validEntity = entity && allowed.includes(entity) ? entity : null;
  const categories = info && validEntity ? businessCategories(info.code, validEntity) : [];
  const validCategory = categories.some((c) => c.id === category) ? category : null;
  const ready = !waitCountry && !!info && !!validEntity && categoryChosen(info.code, validEntity, validCategory);
  const unsupported = !waitCountry && !!info && !!validEntity && categoryUnsupported(info.code, validEntity, validCategory);

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
    set({ country: next, entity: entity && nextAllowed.includes(entity) ? entity : null, category: null });
    setExpanded(false);
  };

  return (
    <OnboardingFrame
      headerGap={32}
      step="welcome"
      title="Let’s get your business set up"
      description="Answer two quick questions to see a custom document checklist for streamlined verification."
      footer={{ primary: { label: "Continue", disabled: !ready, onClick: () => router.push("/onboarding/use") } }}
    >
      {/* Figma: the white form card overlaps the grey documents panel by 40px. */}
      <div className="isolate flex flex-col">
        <FormCard className={cn("relative z-[2] gap-10", ready && "-mb-10")}>
          <Field required label="Country of incorporation or residence" description="This controls which documents and ID types we’ll ask for." htmlFor="ob-country">
            <div>
              <ForenSelect
                id="ob-country"
                value={selectValue}
                onChange={onCountry}
                placeholder="Select your country"
                options={[
                  ...ONBOARDING_COUNTRIES.map((c) => ({ value: c.code, label: c.name, leading: <CountryFlag country={c.code} /> })),
                  { label: "Coming soon", options: WAITLIST_COUNTRIES.map((c) => ({ value: WAIT_PREFIX + c, label: c, leading: <CountryFlag country={c} /> })) },
                ]}
              />
            </div>
          </Field>

          <div className="flex flex-col gap-6">
          {waitCountry ? (
            <Waitlist country={waitCountry} joined={waitlist?.country === waitCountry ? waitlist.email : null} />
          ) : (
            <Field
              required
              label="Entity type"
              description="This determines your account limits and what features you can access."
              htmlFor="ob-entity"
              hint={validEntity && !validCategory ? ENTITY_HINT[validEntity] : undefined}
            >
              <ForenSelect
                id="ob-entity"
                value={validEntity}
                disabled={!info}
                onChange={(v) => {
                  set({ entity: v as EntityType, category: null });
                  setExpanded(false);
                }}
                placeholder="Select your entity type"
                options={allowed.map((e) => ({ value: e, label: ENTITY_LABEL[e] }))}
              />
            </Field>
          )}

          {!waitCountry && categories.length > 0 && (
            <Field
              required
              label="Business type"
              description="Each type has its own documents."
              htmlFor="ob-category"
              hint={categories.find((c) => c.id === validCategory)?.hint}
            >
              <ForenSelect
                id="ob-category"
                value={validCategory}
                onChange={(v) => {
                  set({ category: v });
                  setExpanded(false);
                }}
                placeholder="Select your business type"
                options={categories.map((c) => ({ value: c.id, label: c.label }))}
              />
            </Field>
          )}

          {unsupported && (
            <Note intent="warning" title="We don’t support this business type yet">
              Foren can’t open accounts for an {categoryLabel(info!.code, validEntity!, validCategory)} in {info!.name} at the moment, so you can’t continue with sign-up.
              Choose another business type if this one doesn’t describe you.
            </Note>
          )}

          {ready && (
            <div className="flex flex-col gap-3 animate-[rise-in_200ms_ease-out]">
              <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">
                As a{" "}
                <span className="font-semibold text-fg">
                  {validEntity === "mto" ? "licensed MTO or PSP" : (categoryLabel(info!.code, validEntity!, validCategory) ?? ENTITY_LABEL[validEntity!])}
                </span>{" "}
                in <span className="font-semibold text-fg">{info!.name}</span> you can
              </p>
              <ul className="flex flex-col gap-3">
                {capabilities(validEntity!).map((c) => (
                  <li key={c} className="flex items-center gap-2 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg">
                    <CheckBoldIcon className="size-4 shrink-0 text-success" aria-hidden />
                    {c}
                  </li>
                ))}
                {hasStakeholders(validEntity!, validCategory) && (
                  <li className="flex items-center gap-2 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-warning">
                    <InfoIcon className="size-4 shrink-0" aria-hidden />
                    {validCategory === "partnership" ? "You’ll need to add your partners" : "You’ll need to add directors and beneficial owners"}
                  </li>
                )}
              </ul>
            </div>
          )}
          </div>
        </FormCard>

        {ready && (
          <DocumentsPanel
            country={info!.code}
            entity={validEntity!}
            category={validCategory}
            expanded={expanded}
            onToggle={() => setExpanded((x) => !x)}
            onWhy={() => setWhyOpen(true)}
          />
        )}
      </div>

      {ready && (
        <WhyModal
          open={whyOpen}
          onOpenChange={setWhyOpen}
          subtitle={`${categoryLabel(info!.code, validEntity!, validCategory) ?? ENTITY_LABEL[validEntity!]} in ${info!.name}`}
        />
      )}
    </OnboardingFrame>
  );
}

function DocumentsPanel({
  country,
  entity,
  category,
  expanded,
  onToggle,
  onWhy,
}: {
  country: CountryCode;
  entity: EntityType;
  category: string | null;
  expanded: boolean;
  onToggle: () => void;
  onWhy: () => void;
}) {
  const reqs = requirementsFor({ country, entity, category });
  // Group by how each item is collected, so people can see what they need to find versus what happens with them.
  const ordered = GROUPS.flatMap((g) => reqs.filter((r) => g.sources.includes(r.source)));
  const visibleIds = new Set((expanded ? ordered : ordered.slice(0, COLLAPSED)).map((r) => r.id));
  const uploads = reqs.filter((r) => r.source === "upload").length;
  const listId = React.useId();
  return (
    <section
      aria-labelledby={`${listId}-h`}
      className="relative z-[1] flex flex-col gap-5 rounded-[24px] border-[1.5px] border-surface bg-subtle px-4 pt-16 pb-6 tracking-[0.01em]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id={`${listId}-h`} className="text-[12px] leading-[18px] font-semibold text-fg-3 uppercase">
            What you’ll need
          </h2>
          <p className="text-[12px] leading-[18px] font-medium text-fg-2">
            {uploads} {uploads === 1 ? "document" : "documents"} to upload, the rest happens as you go.
          </p>
        </div>
        <button type="button" onClick={onWhy} className="shrink-0 text-[12px] leading-[18px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus">
          Why we need this?
        </button>
      </div>

      <div id={listId} className="flex flex-col gap-4">
        {GROUPS.map((g) => {
          const items = reqs.filter((r) => g.sources.includes(r.source) && visibleIds.has(r.id));
          if (!items.length) return null;
          const Icon = g.icon;
          return (
            <div key={g.key} className="flex flex-col gap-2">
              <h3 className="text-[12px] leading-[18px] font-medium text-fg-3">{g.label}</h3>
              <ul className="flex flex-col overflow-hidden rounded-[16px] bg-surface">
                {items.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 border-b border-line px-3 py-3 last:border-b-0">
                    <span aria-hidden className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px]", g.tile)}>
                      <Icon className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-[20px] font-medium text-fg">
                        {r.title}
                        {r.optional && <span className="rounded-full bg-subtle px-2 text-[11px] leading-[18px] font-medium text-fg-2">If applicable</span>}
                      </span>
                      <span className="text-[12px] leading-[18px] font-medium text-fg-2">{r.summary ?? r.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {ordered.length > COLLAPSED && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={onToggle}
          className="w-fit text-[12px] leading-[18px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus"
        >
          {expanded ? "Show less" : `Show all ${ordered.length}`}
        </button>
      )}
    </section>
  );
}

const COLLAPSED = 4;

/** How each requirement is collected, in the order people meet them. */
const GROUPS: { key: string; label: string; sources: Requirement["source"][]; icon: React.ComponentType<{ className?: string }>; tile: string }[] = [
  { key: "upload", label: "You’ll upload", sources: ["upload"], icon: FileTextIcon, tile: "bg-info-subtle text-info" },
  { key: "identity", label: "Done in your identity check", sources: ["identity"], icon: IdentificationCardIcon, tile: "bg-success-subtle text-success" },
  { key: "stakeholders", label: "From your directors and owners", sources: ["stakeholders"], icon: UsersThreeIcon, tile: "bg-warning-subtle text-warning" },
  { key: "questions", label: "A few questions", sources: ["questionnaire", "edd"], icon: ChatsIcon, tile: "bg-subtle text-fg-2" },
];

/** Figma "Non supported country" / "Invalid email" / "Joined Waitlist": a bordered card inside the form card. */
function Waitlist({ country, joined }: { country: string; joined: string | null }) {
  const set = useOnboarding((s) => s.set);
  const [email, setEmail] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const invalid = touched && !EMAIL_RE.test(email.trim());
  const where = country === "Other country" ? "your country" : country;

  if (joined)
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-[24px] border border-line p-6 tracking-[0.01em] animate-[rise-in_200ms_ease-out]">
        <span className="relative size-10 shrink-0 overflow-hidden" aria-hidden>
          <Image src={asset("/onboarding/check.png")} alt="" width={48} height={48} className="absolute -top-1 -left-1 size-12 max-w-none" />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-[18px] leading-[26px] font-medium text-fg">You’re on the waitlist!</p>
          <p className="text-[12px] leading-[18px] font-medium text-fg-2">
            Thank you for registering your interest. Every sign-up helps us measure regional demand and prioritise where we launch next.
          </p>
          <p className="text-[12px] leading-[18px] font-medium text-fg-2">
            We’ll email {joined} the moment Foren goes live in {where}.
          </p>
        </div>
      </div>
    );

  return (
    <form
      noValidate
      className="flex flex-col gap-6 rounded-[24px] border border-line p-6 tracking-[0.01em] animate-[rise-in_200ms_ease-out]"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (EMAIL_RE.test(email.trim())) set({ waitlist: { country, email: email.trim() } });
      }}
    >
      <div className="flex flex-col gap-3">
        <Image src={asset("/onboarding/waitlist-coins.png")} alt="" width={49} height={49} />
        <div className="flex flex-col gap-2">
          <p className="text-[14px] leading-[21px] font-medium text-fg">Thanks for your interest</p>
          <p className="text-[12px] leading-[18px] font-medium text-fg-2">We are expanding our global network and haven’t launched in {where} yet.</p>
          <p className="text-[12px] leading-[18px] font-medium text-fg-2">
            Leave your business email to get notified when we launch in your region and help us prioritise new markets.
          </p>
        </div>
        <Field label="Business email" htmlFor="ob-wait-email" error={invalid ? "Invalid email. Enter a valid email address." : undefined}>
          <input
            id="ob-wait-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Enter a valid email address"
            value={email}
            aria-invalid={invalid || undefined}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => email && setTouched(true)}
            className={fieldCls}
          />
        </Field>
      </div>
      <ForenButton type="submit" size="xs" variant="primary" className="w-full" disabled={!email.trim()}>
        Join Waitlist
      </ForenButton>
    </form>
  );
}

const WHY: [string, string][] = [
  [
    "We’re required to know who you are",
    "Regulators require us to verify the businesses we onboard, and the people behind them. This is called Know Your Business (KYB), and it applies no matter your entity type or where you’re based.",
  ],
  [
    "What you share shapes what you can do",
    "The information and documents you provide determine which features are available to you right away. More verified detail unlocks more of Foren immediately; there’s no separate “upgrade later” step.",
  ],
  [
    "We confirm it all automatically where we can",
    "Wherever a registry or database can confirm a detail for us, we use that instead of asking you to upload it. That way we keep the list of requirements as short as possible.",
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
          <InfoFillIcon className="size-5 shrink-0 text-[#f0b232]" aria-hidden />
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
