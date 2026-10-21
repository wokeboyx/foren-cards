"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { SECTORS, TURNOVER_BANDS, countryInfo, isNewBusiness, isScumlCategory } from "@/domain/onboarding";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Field, FormCard, OnboardingFrame, fieldCls } from "./frame";
import { Note } from "./shared";
import { useSignupGuard } from "./guard";

/** Step 4b "A few more things" (Figma 3035:73737–73923): turnover, sector, category, website. */
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
  const [website, setWebsite] = React.useState(saved?.website ?? "");
  const [notTrading, setNotTrading] = React.useState(saved?.notTrading ?? false);
  const [websiteTouched, setWebsiteTouched] = React.useState(false);

  if (!ready || !country) return null;
  const currency = countryInfo(country)?.currency ?? "";
  const categories = SECTORS.find((s) => s.name === sector)?.categories ?? [];
  const websiteError = website && !/^https:\/\/[^\s.]+\.[^\s]+$/.test(website.trim()) ? "Enter a full address starting with https://" : undefined;
  const scuml = country === "NG" && isScumlCategory(sector, category);
  const isNew = notTrading || isNewBusiness(business?.incorporatedOn);
  const complete = turnover && sector && category && !websiteError;

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
            set({ profile: { turnover, sector, category, website: website.trim(), notTrading } });
            router.push(entity === "mto" ? "/onboarding/compliance" : "/onboarding/review");
          },
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <FormCard>
          <Field label="Annual turnover" htmlFor="turnover">
            <select id="turnover" value={turnover} onChange={(e) => setTurnover(e.target.value)} className={cn(fieldCls, !turnover && "text-fg-3")}>
              <option value="">Select a range</option>
              {TURNOVER_BANDS.map((b) => (
                <option key={b} value={b}>
                  {currency} {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Business sector" htmlFor="sector">
            <select
              id="sector"
              value={sector}
              onChange={(e) => {
                setSector(e.target.value);
                setCategory("");
              }}
              className={cn(fieldCls, !sector && "text-fg-3")}
            >
              <option value="">Select a sector</option>
              {SECTORS.map((s) => (
                <option key={s.name}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Business category" htmlFor="category" hint={!sector ? "Choose a sector first." : undefined}>
            <select id="category" value={category} disabled={!sector} onChange={(e) => setCategory(e.target.value)} className={cn(fieldCls, !category && "text-fg-3")}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Website/Socials (optional)" htmlFor="website" error={websiteTouched ? websiteError : undefined}>
            <input
              id="website"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={website}
              onFocus={() => !website && setWebsite("https://")}
              onBlur={() => {
                if (website === "https://") setWebsite("");
                setWebsiteTouched(true);
              }}
              onChange={(e) => setWebsite(e.target.value)}
              aria-invalid={(websiteTouched && !!websiteError) || undefined}
              className={fieldCls}
              autoComplete="url"
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
