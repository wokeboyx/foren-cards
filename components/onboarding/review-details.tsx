"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ENTITY_LABEL, USE_CASES, categoryLabel, countryInfo } from "@/domain/onboarding";
import { useOnboarding } from "@/lib/onboarding-store";
import { OnboardingFrame } from "./frame";
import { DetailGrid, Note, formatDate } from "./shared";
import { useSignupGuard } from "./guard";

/** "Review your details" (Figma 3035:74859 / 75756): everything from sign-up, each section editable. */
export function ReviewDetails() {
  const ready = useSignupGuard("/onboarding/review");
  const router = useRouter();
  const s = useOnboarding();
  const [submitting, setSubmitting] = React.useState(false);

  const missingProfile = ready && !s.profile;
  const missingEdd = ready && s.entity === "mto" && !s.edd_done;
  React.useEffect(() => {
    if (missingProfile) router.replace("/onboarding/business/profile");
    else if (missingEdd) router.replace("/onboarding/compliance");
  }, [missingProfile, missingEdd, router]);

  if (!ready || !s.business || !s.profile || !s.country || !s.entity || missingEdd) return null;
  const b = s.business;
  const p = s.profile;
  const useFor = USE_CASES.filter((u) => s.useCases.includes(u.id)).map((u) => u.title).join(", ");

  return (
    <OnboardingFrame
      headerGap={40}
      step={s.entity === "mto" ? "edd" : "business"}
      completed
      back={s.entity === "mto" ? "/onboarding/compliance" : "/onboarding/business/profile"}
      title="Review your details"
      description="Review your business and account information before submitting. If something is wrong, go back and fix it."
      footer={{
        primary: {
          label: "Submit",
          loading: submitting,
          onClick: () => {
            setSubmitting(true);
            window.setTimeout(() => {
              s.set({ signedUpAt: new Date().toISOString() });
              router.push("/onboarding/welcome");
            }, 700);
          },
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <Section title="Business and entity">
          <DetailGrid
            items={[
              { label: "Country", value: countryInfo(s.country)?.name },
              { label: "Entity type", value: ENTITY_LABEL[s.entity] },
              ...(categoryLabel(s.country, s.entity, s.category) ? [{ label: "Business type", value: categoryLabel(s.country, s.entity, s.category)! }] : []),
              { label: "Type", value: b.companyType },
              { label: "Incorporated", value: formatDate(b.incorporatedOn) },
              { label: "Address", value: b.address, wide: true },
            ]}
          />
        </Section>
        <Section title="Business" edit="/onboarding/business">
          <DetailGrid
            items={[
              { label: "Registered name", value: b.name },
              { label: "Reg. number", value: [b.regType, b.regNumber].filter(Boolean).join("-") },
              { label: "Using Foren for", value: useFor, wide: true },
            ]}
          />
        </Section>
        <Section title="Profile" edit="/onboarding/business/profile">
          <DetailGrid
            items={[
              { label: "Annual turnover", value: `${countryInfo(s.country)?.currency} ${p.turnover}` },
              { label: "Sector", value: `${p.sector} · ${p.category}` },
              { label: "Trading", value: p.notTrading ? "Not trading yet" : "Trading" },
            ]}
          />
        </Section>
        <Section title="Primary contact">
          <DetailGrid
            items={[
              { label: "First name", value: s.firstName },
              { label: "Last name", value: s.lastName },
              { label: "Job title", value: s.position },
              { label: "Phone number", value: s.phone },
              { label: "Email address", value: s.email, wide: true },
              ...(s.ownerAddress ? [{ label: "Proof of address", value: s.ownerAddress.fileName, wide: true }] : []),
            ]}
          />
        </Section>
        {s.entity === "mto" && (
          <Section title="Enhanced due diligence" edit="/onboarding/compliance">
            <DetailGrid items={[{ label: "Questionnaire", value: "Completed" }]} />
          </Section>
        )}
        <Note intent="info" className="items-center rounded-[16px] py-2 pr-3.5 pl-2.5">
          Verify that your information is correct before submitting. You can update your business details anytime from your settings.
        </Note>
      </div>
    </OnboardingFrame>
  );
}

/** No `edit` link on sections that can't be changed from here: country and entity type set the whole flow, and the primary contact owns the verified email and ID check. */
function Section({ title, edit, children }: { title: string; edit?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[20px] bg-surface px-3 pt-4 pb-5" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] leading-[26px] font-semibold tracking-[0.005em] text-fg">{title}</h2>
        {edit && (
          <Link href={edit} className="text-[12px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus">
            Edit<span className="sr-only"> {title.toLowerCase()}</span>
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
