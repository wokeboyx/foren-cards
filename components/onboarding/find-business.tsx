"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenSpinner } from "@/components/ui/foren-spinner";
import { countryInfo, registrationTypes, type CountryCode } from "@/domain/onboarding";
import { registryBusiness, useOnboarding, type Business } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Field, FormCard, OnboardingFrame, fieldCls } from "./frame";
import { DetailGrid, Note, RadioCard, formatDate } from "./shared";
import { useSignupGuard } from "./guard";

/**
 * Step 4a "Find your business" (Figma 3035:74092 RC, 74778 IT, 74451 Looking up, 74530 Found, 74588 Manual,
 * 70515 UK search result, 6476:79576 Kenya). Nigeria and Kenya look up a registration number;
 * the UK and Canada search by name or number. Manual entry is always one link away.
 */

const REGIONS: Record<CountryCode, { label: string; options: string[] }> = {
  NG: { label: "State", options: ["Abuja (FCT)", "Lagos", "Ogun", "Oyo", "Rivers", "Kano", "Kaduna", "Enugu", "Anambra", "Delta", "Edo", "Other"] },
  GB: { label: "Nation", options: ["England", "Scotland", "Wales", "Northern Ireland"] },
  CA: { label: "Province or territory", options: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"] },
  KE: { label: "County", options: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Uasin Gishu", "Other"] },
};

const POSTCODE_LABEL: Record<CountryCode, string> = { NG: "Postal code", GB: "Postcode", CA: "Postal code", KE: "Postal code" };

type Manual = { name: string; incorporatedOn: string; streetNo: string; street: string; city: string; region: string; area: string; postcode: string };
const EMPTY_MANUAL: Manual = { name: "", incorporatedOn: "", streetNo: "", street: "", city: "", region: "", area: "", postcode: "" };

export function FindBusiness() {
  const ready = useSignupGuard("/onboarding/business");
  const country = useOnboarding((s) => s.country);
  const entity = useOnboarding((s) => s.entity);
  if (!ready || !country || !entity) return null;
  return <FindBusinessForm country={country} key={`${country}-${entity}`} />;
}

function FindBusinessForm({ country }: { country: CountryCode }) {
  const router = useRouter();
  const entity = useOnboarding((s) => s.entity)!;
  const saved = useOnboarding((s) => s.business);
  const lookupOutcome = useOnboarding((s) => s.demo.lookup);
  const set = useOnboarding((s) => s.set);
  const info = countryInfo(country)!;
  const types = registrationTypes(country, entity);
  const searchCountry = types.length === 0;

  const [mode, setMode] = React.useState<"lookup" | "manual">(saved?.source === "manual" ? "manual" : "lookup");
  const [regType, setRegType] = React.useState(saved?.regType ?? types[0]?.code ?? "");
  const [regNumber, setRegNumber] = React.useState(saved?.source === "registry" ? saved.regNumber : "");
  const [status, setStatus] = React.useState<"idle" | "loading" | "found" | "not_found">(saved?.source === "registry" ? "found" : "idle");
  const [result, setResult] = React.useState<Business | null>(saved?.source === "registry" ? saved : null);
  const [manual, setManual] = React.useState<Manual>(() => (saved?.source === "manual" ? fromBusiness(saved) : EMPTY_MANUAL));
  const [touched, setTouched] = React.useState(false);

  const lookup = (number: string, type = regType) => {
    setStatus("loading");
    setResult(null);
    window.setTimeout(() => {
      if (lookupOutcome === "not_found") return setStatus("not_found");
      setResult(registryBusiness(country, type || undefined, number));
      setStatus("found");
    }, 1200);
  };

  const manualComplete = manual.name.trim() && manual.incorporatedOn && manual.street.trim() && manual.city.trim() && manual.region;
  const canContinue = mode === "lookup" ? status === "found" && !!result : !!manualComplete;

  const onContinue = () => {
    if (mode === "manual") {
      setTouched(true);
      if (!manualComplete) return;
      set({ business: toBusiness(manual, regType, regNumber) });
    } else if (result) set({ business: result });
    router.push("/onboarding/business/profile");
  };

  const description = searchCountry
    ? `Enter your official company name or registration number. We’ll match your details with ${info.registry}.`
    : `Select your registration type and enter your number. We’ll pull your official records from the ${info.registry} registry.`;

  return (
    <OnboardingFrame
      step="business"
      back="/onboarding/identity"
      title="Find your business"
      description={description}
      footer={{ primary: { label: "Continue", onClick: onContinue, disabled: !canContinue } }}
    >
      {mode === "manual" ? (
        <ManualEntry
          country={country}
          types={types}
          regType={regType}
          setRegType={setRegType}
          regNumber={regNumber}
          setRegNumber={setRegNumber}
          value={manual}
          onChange={setManual}
          touched={touched}
          onBack={() => {
            setMode("lookup");
            setStatus("idle");
          }}
        />
      ) : searchCountry ? (
        <RegistrySearch
          country={country}
          result={result}
          onPick={(b) => {
            setResult(b);
            setStatus("found");
          }}
          onClear={() => {
            setResult(null);
            setStatus("idle");
          }}
          onManual={() => setMode("manual")}
        />
      ) : status === "found" && result ? (
        <RegistryCard business={result} registry={info.registry} onSearchAgain={() => setStatus("idle")} />
      ) : (
        <div className="flex flex-col gap-6">
          <RegTypePicker types={types} value={regType} onChange={(v) => { setRegType(v); setStatus("idle"); }} />
          <Field label="Registration number" htmlFor="reg-number" hint={`Enter the number exactly as it appears on your ${info.registry} certificate.`}>
            <div className="flex gap-2">
              <span className="grid h-12 min-w-12 shrink-0 place-items-center rounded-[16px] border border-line bg-subtle px-3 text-[14px] font-medium text-fg-2">{regType}-</span>
              <div className="relative min-w-0 flex-1">
                <input
                  id="reg-number"
                  inputMode="numeric"
                  autoComplete="off"
                  value={regNumber}
                  aria-invalid={status === "not_found" || undefined}
                  aria-describedby="lookup-status"
                  onChange={(e) => {
                    setRegNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ""));
                    if (status === "not_found") setStatus("idle");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && regNumber.length >= 4 && lookup(regNumber)}
                  className={cn(fieldCls, "pr-28")}
                />
                <button
                  type="button"
                  disabled={regNumber.length < 4 || status === "loading"}
                  onClick={() => lookup(regNumber)}
                  className={cn(
                    "absolute top-1/2 right-2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus",
                    status === "loading"
                      ? "bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]"
                      : "bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)] disabled:bg-[var(--color-foren-bg-button-disabled)] disabled:text-fg-disabled"
                  )}
                >
                  {status === "loading" ? (
                    <>
                      <ForenSpinner size="sm" className="text-current" />
                      Looking up…
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
            </div>
          </Field>
          <div id="lookup-status" aria-live="polite">
            {status === "not_found" && (
              <Note intent="error" title="We couldn’t find a business with that number">
                Check the number on your certificate, or enter your details manually.
              </Note>
            )}
          </div>
          <ManualLink onClick={() => setMode("manual")} />
        </div>
      )}
    </OnboardingFrame>
  );
}

function RegTypePicker({ types, value, onChange }: { types: { code: string; label: string; hint: string }[]; value: string; onChange: (v: string) => void }) {
  if (types.length <= 1) return null;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[14px] leading-[21px] font-medium text-fg">Registration type</legend>
      <div className="flex gap-2">
        {types.map((t) => (
          <RadioCard key={t.code} name="reg-type" value={t.code} checked={value === t.code} onChange={onChange} label={t.label} hint={t.hint} />
        ))}
      </div>
    </fieldset>
  );
}

function ManualLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-fit text-[12px] leading-[18px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus">
      Can’t find it? Enter your details manually
    </button>
  );
}

export function RegistryCard({ business, registry, onSearchAgain }: { business: Business; registry: string; onSearchAgain: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-[12px] bg-surface p-4 animate-[rise-in_200ms_ease-out]" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[16px] leading-6 font-medium text-fg">{business.name}</p>
        <ForenBadge color="success" size="sm" dot>
          {registry} verified
        </ForenBadge>
      </div>
      <DetailGrid
        items={[
          { label: "Reg. number", value: [business.regType, business.regNumber].filter(Boolean).join("-") },
          { label: "Incorporated", value: formatDate(business.incorporatedOn) },
          { label: "Type", value: business.companyType },
          { label: "Address", value: business.address },
        ]}
      />
      <p className="text-[12px] leading-[18px] font-medium text-fg-3">
        Wrong business?{" "}
        <button type="button" onClick={onSearchAgain} className="text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus">
          Search again
        </button>
      </p>
    </div>
  );
}

function RegistrySearch({
  country,
  result,
  onPick,
  onClear,
  onManual,
}: {
  country: CountryCode;
  result: Business | null;
  onPick: (b: Business) => void;
  onClear: () => void;
  onManual: () => void;
}) {
  const info = countryInfo(country)!;
  const lookupOutcome = useOnboarding((s) => s.demo.lookup);
  const [query, setQuery] = React.useState(result?.regNumber ?? "");
  const [results, setResults] = React.useState<Business[] | null>(null);
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    if (result || query.trim().length < 3) return;
    const t = window.setTimeout(() => {
      setSearching(true);
      window.setTimeout(() => {
        setSearching(false);
        setResults(lookupOutcome === "not_found" ? [] : sampleMatches(country, query));
      }, 700);
    }, 300);
    return () => window.clearTimeout(t);
  }, [query, result, country, lookupOutcome]);

  const showList = !result && query.trim().length >= 3;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label htmlFor="company-search" className="sr-only">
          Company name or registration number
        </label>
        <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-fg-3" aria-hidden />
        <input
          id="company-search"
          type="search"
          autoComplete="off"
          placeholder="Company name or registration number"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setResults(null);
            if (result) onClear();
          }}
          className={cn(fieldCls, "bg-surface pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden")}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults(null);
              onClear();
            }}
            className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center rounded-full text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
          >
            <RiCloseLine className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div aria-live="polite">
        {result ? (
          <RegistryCard business={result} registry={info.registry} onSearchAgain={() => { setQuery(""); onClear(); }} />
        ) : showList && (searching || !results) ? (
          <p className="flex items-center gap-2 text-[12px] font-medium text-fg-3">
            <ForenSpinner size="sm" /> Searching {info.registry}…
          </p>
        ) : showList && results && results.length === 0 ? (
          <Note intent="error" title={`No matches in ${info.registry}`}>
            Try the exact registered name or number, or enter your details manually.
          </Note>
        ) : showList && results ? (
          <ul className="overflow-hidden rounded-[12px] bg-surface" aria-label="Matching companies">
            {results.map((b) => (
              <li key={b.regNumber} className="border-b border-line last:border-0">
                <button type="button" onClick={() => onPick(b)} className="flex w-full flex-col gap-0.5 px-4 py-3 text-left outline-none hover:bg-sunken focus-visible:bg-sunken focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset">
                  <span className="text-[14px] leading-[21px] font-medium text-fg">{b.name}</span>
                  <span className="text-[12px] leading-[18px] font-medium text-fg-3">
                    {b.regNumber} · {b.companyType} · {b.address}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {!result && <ManualLink onClick={onManual} />}
    </div>
  );
}

function sampleMatches(country: CountryCode, q: string): Business[] {
  const base = registryBusiness(country, undefined, /^\d+$/.test(q.trim()) ? q.trim() : country === "GB" ? "12345678" : "1234567-8");
  const first = { ...base, name: /^\d+$/.test(q.trim()) ? base.name : titleCase(q.trim()) + (country === "GB" ? " Ltd" : " Inc.") };
  return [
    first,
    { ...base, name: `${first.name.replace(/ (Ltd|Inc\.)$/, "")} Holdings ${country === "GB" ? "Ltd" : "Inc."}`, regNumber: country === "GB" ? "09876543" : "7654321-0", incorporatedOn: "2016-07-04" },
    { ...base, name: `${first.name.replace(/ (Ltd|Inc\.)$/, "")} Trading ${country === "GB" ? "Ltd" : "Inc."}`, regNumber: country === "GB" ? "11223344" : "1122334-5", incorporatedOn: "2022-01-18", companyType: country === "GB" ? "Private Limited Company" : "Provincial corporation" },
  ];
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function ManualEntry({
  country,
  types,
  regType,
  setRegType,
  regNumber,
  setRegNumber,
  value,
  onChange,
  touched,
  onBack,
}: {
  country: CountryCode;
  types: { code: string; label: string; hint: string }[];
  regType: string;
  setRegType: (v: string) => void;
  regNumber: string;
  setRegNumber: (v: string) => void;
  value: Manual;
  onChange: (v: Manual) => void;
  touched: boolean;
  onBack: () => void;
}) {
  const info = countryInfo(country)!;
  const region = REGIONS[country];
  const up = (k: keyof Manual) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  const err = (k: keyof Manual) => (touched && !value[k] ? "Required" : undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] leading-6 font-semibold text-fg">Enter your business manually</h2>
        <button type="button" onClick={onBack} className="shrink-0 text-[12px] font-medium text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus">
          Back to auto-lookup
        </button>
      </div>

      <RegTypePicker types={types} value={regType} onChange={setRegType} />

      <Field label="Registration number" htmlFor="m-reg" hint={`Enter the number exactly as it appears on your ${info.registry} certificate.`}>
        <div className="flex gap-2">
          {regType && <span className="grid h-12 min-w-12 shrink-0 place-items-center rounded-[16px] border border-line bg-subtle px-3 text-[14px] font-medium text-fg-2">{regType}-</span>}
          <input id="m-reg" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} className={fieldCls} autoComplete="off" />
        </div>
      </Field>

      <FormCard>
        <Field label="Registered business name" htmlFor="m-name" error={err("name")}>
          <input id="m-name" value={value.name} onChange={up("name")} aria-invalid={!!err("name") || undefined} className={fieldCls} autoComplete="organization" />
        </Field>
        <Field label="Date incorporated" htmlFor="m-date" error={err("incorporatedOn")}>
          <input id="m-date" type="date" max={today} value={value.incorporatedOn} onChange={up("incorporatedOn")} aria-invalid={!!err("incorporatedOn") || undefined} className={fieldCls} />
        </Field>
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-[16px] leading-6 font-semibold text-fg">Business address</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Street no." htmlFor="m-no">
              <input id="m-no" value={value.streetNo} onChange={up("streetNo")} className={fieldCls} autoComplete="address-line1" />
            </Field>
            <Field label="Street name" htmlFor="m-street" error={err("street")}>
              <input id="m-street" value={value.street} onChange={up("street")} aria-invalid={!!err("street") || undefined} className={fieldCls} autoComplete="address-line2" />
            </Field>
            <Field label="City" htmlFor="m-city" error={err("city")}>
              <input id="m-city" value={value.city} onChange={up("city")} aria-invalid={!!err("city") || undefined} className={fieldCls} autoComplete="address-level2" />
            </Field>
            <Field label={region.label} htmlFor="m-region" error={err("region")}>
              <select id="m-region" value={value.region} onChange={up("region")} aria-invalid={!!err("region") || undefined} className={cn(fieldCls, !value.region && "text-fg-3")}>
                <option value="">Select {region.label.toLowerCase()}</option>
                {region.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Area" htmlFor="m-area">
              <input id="m-area" value={value.area} onChange={up("area")} className={fieldCls} />
            </Field>
            <Field label={POSTCODE_LABEL[country]} htmlFor="m-post">
              <input id="m-post" value={value.postcode} onChange={up("postcode")} className={fieldCls} autoComplete="postal-code" />
            </Field>
          </div>
        </fieldset>
      </FormCard>
      <Note intent="info">Our compliance team checks details entered by hand against your documents, so make sure they match your certificate.</Note>
    </div>
  );
}

function toBusiness(m: Manual, regType: string, regNumber: string): Business {
  const address = [[m.streetNo, m.street].filter(Boolean).join(" "), m.area, m.city, m.region, m.postcode].filter(Boolean).join(", ");
  return { name: m.name.trim(), regType: regType || undefined, regNumber: regNumber.trim(), incorporatedOn: m.incorporatedOn, companyType: "Entered manually", address, source: "manual" };
}

function fromBusiness(b: Business): Manual {
  return { ...EMPTY_MANUAL, name: b.name, incorporatedOn: b.incorporatedOn, street: b.address };
}
