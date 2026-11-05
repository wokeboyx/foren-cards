"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenSelect } from "@/components/ui/foren-select";
import { SECTORS, TURNOVER_BANDS, countryInfo, isNewBusiness, isScumlCategory } from "@/domain/onboarding";
import { useOnboarding } from "@/lib/onboarding-store";
import { Field, FormCard, OnboardingFrame } from "./frame";
import { Note } from "./shared";
import { useSignupGuard } from "./guard";

/**
 * Step 4b "A few more things" (Figma 3035:73737–73923): turnover, sector and category. The website moved to the
 * onboarding questionnaires, which ask for it (or a social media link) anyway.
 */
export function BusinessProfile() {
  const ready = useSignupGuard("/onboarding/business/profile");
  const router = useRouter();
  const country = useOnboarding((s) => s.country);
  const entity = useOnboarding((s) => s.entity);
  const business = useOnboarding((s) => s.business);
  const saved = useOnboarding((s) => s.profile);
  const set = useOnboarding((s) => s.set);

  const [turnover, setTurnover] = React.useState(saved?.turnover ?? "");
  const [sector, setSector] = React.useState(saved?.sector ?? "");
  const [category, setCategory] = React.useState(saved?.category ?? "");
  const [notTrading, setNotTrading] = React.useState(saved?.notTrading ?? false);

  if (!ready || !country) return null;
  const currency = countryInfo(country)?.currency ?? "";
  const categories = SECTORS.find((s) => s.name === sector)?.categories ?? [];
  const scuml = country === "NG" && isScumlCategory(sector, category);
  const isNew = notTrading || isNewBusiness(business?.incorporatedOn);
  const complete = turnover && sector && category;

  return (
    <OnboardingFrame
      step="business"
      back="/onboarding/business"
      title="A few more things"
      description="Enter your official business information to complete KYB verification and activate your account."
      footer={{
        primary: {
          label: "Continue",
          disabled: !complete,
          onClick: () => {
            // A website saved before it moved to the questionnaire is kept: it prefills the questionnaire.
            set({ profile: { turnover, sector, category, notTrading, ...(saved?.website ? { website: saved.website } : {}) } });
            router.push(entity === "mto" ? "/onboarding/compliance" : "/onboarding/review");
          },
        },
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Figma "A few more things": 24px between fields. */}
        <FormCard className="gap-6">
          <Field label="Annual turnover" htmlFor="turnover">
            <ForenSelect id="turnover" value={turnover} onChange={setTurnover} placeholder="Select a range" options={TURNOVER_BANDS.map((b) => ({ value: b, label: `${currency} ${b}` }))} />
          </Field>
          <Field label="Business sector" htmlFor="sector">
            <ForenSelect
              id="sector"
              value={sector}
              onChange={(v) => {
                setSector(v);
                setCategory("");
              }}
              placeholder="Select a sector"
              options={SECTORS.map((s) => ({ value: s.name, label: s.name }))}
            />
          </Field>
          <Field label="Business category" htmlFor="category" hint={!sector ? "Choose a sector first." : undefined}>
            <ForenSelect
              id="category"
              value={category}
              disabled={!sector}
              onChange={setCategory}
              placeholder="Select a category"
              options={categories.map((c) => ({ value: c.name, label: c.name }))}
            />
          </Field>
          <ForenCheckbox
            checked={notTrading}
            onCheckedChange={(v) => setNotTrading(v === true)}
            label="We haven’t started trading yet"
            description="Tick this if the business has no sales or customers yet."
          />
        </FormCard>
        {scuml && <Note intent="info">You’ll need a SCUML certificate for this category. We’ll ask for it with your documents.</Note>}
        {isNew && <Note intent="info">New businesses also share the owner’s bank statement and a business plan or proof of funding.</Note>}
      </div>
    </OnboardingFrame>
  );
}
