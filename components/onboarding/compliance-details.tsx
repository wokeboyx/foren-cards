"use client";
import { useSignupGuard } from "./guard";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine } from "@remixicon/react";
import { useOnboarding, type Edd } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Field, FormCard, OnboardingFrame, fieldCls } from "./frame";

/**
 * Step 5, MTOs and PSPs only: "Regulatory & Compliance Details" (Figma 3035:75359–75690), the business
 * banking onboarding questionnaire from the requirements, split into three tabs.
 */

const TABS = [
  { key: "licensing", label: "Licensing & regulation" },
  { key: "activity", label: "Business activity & fund flow" },
  { key: "aml", label: "AML & financial-crime controls" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const COUNTRIES = ["Nigeria", "Kenya", "Ghana", "United Kingdom", "Canada", "United States", "South Africa", "India", "UAE", "European Union"];
const PRODUCTS = ["Money movement", "Payroll", "Remittances", "Merchant collections", "Bill payments", "FX", "Wallets", "Card issuing"];

const textareaCls =
  "min-h-[96px] w-full resize-y rounded-[16px] border border-line bg-subtle p-3 text-[14px] leading-[21px] font-medium text-fg outline-none placeholder:text-fg-3 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20";

export function ComplianceDetails() {
  const ready = useSignupGuard("/onboarding/compliance");
  const router = useRouter();
  const entity = useOnboarding((s) => s.entity);
  const saved = useOnboarding((s) => s.edd);
  const set = useOnboarding((s) => s.set);
  const [tab, setTab] = React.useState<TabKey>("licensing");
  const [a, setA] = React.useState<Edd>(saved);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    if (ready && entity && entity !== "mto") router.replace("/onboarding/review");
  }, [ready, entity, router]);

  if (!ready || entity !== "mto") return null;

  const str = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
  const list = (k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);
  const put = (k: string, v: string | string[]) => setA((p) => ({ ...p, [k]: v }));
  const filled = (...keys: string[]) => keys.every((k) => (Array.isArray(a[k]) ? (a[k] as string[]).length > 0 : !!str(k).trim()));

  const valid: Record<TabKey, boolean> = {
    licensing: filled("licensed") && (str("licensed") === "No" || list("licences").length > 0),
    activity: filled("countries", "products", "fundFlow", "incoming", "outgoing", "changes"),
    aml: filled("officerName", "officerEmail", "policyReviewed", "audit", "screening", "monitoring", "pep") && (str("pep") !== "Yes" || filled("pepDetail")),
  };
  const index = TABS.findIndex((t) => t.key === tab);

  const go = (next: TabKey) => {
    set({ edd: a });
    setTab(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  return (
    <OnboardingFrame
      step="edd"
      back={index === 0 ? "/onboarding/business/profile" : () => go(TABS[index - 1].key)}
      title="Regulatory & Compliance Details"
      description="Provide your licensing status, business activity, and AML policy details to complete your business risk assessment."
      footer={{
        primary: {
          label: index === TABS.length - 1 ? "Continue to review" : "Continue",
          disabled: !valid[tab],
          onClick: () => {
            if (index < TABS.length - 1) return go(TABS[index + 1].key);
            set({ edd: a, edd_done: true });
            router.push("/onboarding/review");
          },
        },
      }}
    >
      <nav aria-label="Questionnaire sections" className="mb-6">
        <ol className="grid grid-cols-3 gap-2">
          {TABS.map((t, i) => {
            const reachable = i <= index || TABS.slice(0, i).every((x) => valid[x.key]);
            return (
              <li key={t.key}>
                <button
                  type="button"
                  disabled={!reachable}
                  aria-current={t.key === tab ? "step" : undefined}
                  onClick={() => go(t.key)}
                  className="flex w-full flex-col gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
                >
                  <span className={cn("h-[3px] w-full rounded-full", i <= index ? "bg-fg" : "bg-line-2")} aria-hidden />
                  <span className={cn("text-[12px] leading-[18px] font-medium sm:text-[13px]", t.key === tab ? "text-fg" : i < index ? "text-fg-2" : "text-fg-3")}>{t.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <FormCard>
        <h2 ref={headingRef} tabIndex={-1} className="text-[16px] leading-6 font-semibold text-fg outline-none">
          {TABS[index].label}
        </h2>

        {tab === "licensing" && (
          <>
            <Field label="Are you registered and licensed to operate in your jurisdiction?" htmlFor="licensed">
              <select id="licensed" value={str("licensed")} onChange={(e) => put("licensed", e.target.value)} className={cn(fieldCls, !str("licensed") && "text-fg-3")}>
                <option value="">Select</option>
                <option>Yes</option>
                <option>Application in progress</option>
                <option>No</option>
              </select>
            </Field>
            {str("licensed") !== "No" && (
              <Field label="List the licences you have for your business" htmlFor="licences" hint="Type a licence and press Enter. For example: CBN IMTO licence, FCA EMI.">
                <TagInput id="licences" value={list("licences")} onChange={(v) => put("licences", v)} placeholder="Type your licence and press Enter" />
              </Field>
            )}
          </>
        )}

        {tab === "activity" && (
          <>
            <Field label="To which countries have you been remitting?" htmlFor="countries">
              <ChipSelect id="countries" options={COUNTRIES} value={list("countries")} onChange={(v) => put("countries", v)} placeholder="Add a country" />
            </Field>
            <Field label="Products / services you offer" htmlFor="products">
              <ChipSelect id="products" options={PRODUCTS} value={list("products")} onChange={(v) => put("products", v)} placeholder="Add a product" />
            </Field>
            <Field label="Use case(s) for our API (if applicable)" htmlFor="apiUse" hint="Tell us how you want to use our API.">
              <textarea id="apiUse" value={str("apiUse")} onChange={(e) => put("apiUse", e.target.value)} className={textareaCls} />
            </Field>
            <Field label="Expected fund flow and intended account use" htmlFor="fundFlow" description="Expected monthly volumes, fund direction and account purpose.">
              <textarea id="fundFlow" value={str("fundFlow")} onChange={(e) => put("fundFlow", e.target.value)} className={textareaCls} />
            </Field>
            <Field label="Top 5 counterparties / payees (incoming)" htmlFor="incoming" description="Name and country of your five largest incoming counterparties.">
              <textarea id="incoming" value={str("incoming")} onChange={(e) => put("incoming", e.target.value)} className={textareaCls} />
            </Field>
            <Field label="Top 5 counterparties / payees (outgoing)" htmlFor="outgoing" description="Name and country of your five largest outgoing counterparties.">
              <textarea id="outgoing" value={str("outgoing")} onChange={(e) => put("outgoing", e.target.value)} className={textareaCls} />
            </Field>
            <Field label="Recent or planned changes to transaction volumes, counterparties, or jurisdictions?" htmlFor="changes" hint="Write “None” if nothing has changed.">
              <textarea id="changes" value={str("changes")} onChange={(e) => put("changes", e.target.value)} className={textareaCls} />
            </Field>
          </>
        )}

        {tab === "aml" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Compliance officer (MLRO)" htmlFor="officerName">
                <input id="officerName" value={str("officerName")} onChange={(e) => put("officerName", e.target.value)} className={fieldCls} autoComplete="name" />
              </Field>
              <Field label="Their email" htmlFor="officerEmail">
                <input id="officerEmail" type="email" value={str("officerEmail")} onChange={(e) => put("officerEmail", e.target.value)} className={fieldCls} autoComplete="email" />
              </Field>
            </div>
            <Field label="When was your AML policy last reviewed?" htmlFor="policyReviewed">
              <input id="policyReviewed" type="date" max={new Date().toISOString().slice(0, 10)} value={str("policyReviewed")} onChange={(e) => put("policyReviewed", e.target.value)} className={fieldCls} />
            </Field>
            <YesNo id="audit" label="Have you had an external AML audit in the last 12 months?" value={str("audit")} onChange={(v) => put("audit", v)} />
            <Field label="Sanctions screening tool" htmlFor="screening" hint="For example: ComplyAdvantage, Refinitiv World-Check, or in-house.">
              <input id="screening" value={str("screening")} onChange={(e) => put("screening", e.target.value)} className={fieldCls} />
            </Field>
            <Field label="How do you monitor transactions?" htmlFor="monitoring">
              <select id="monitoring" value={str("monitoring")} onChange={(e) => put("monitoring", e.target.value)} className={cn(fieldCls, !str("monitoring") && "text-fg-3")}>
                <option value="">Select</option>
                <option>Automated</option>
                <option>Manual</option>
                <option>Both</option>
              </select>
            </Field>
            <YesNo id="pep" label="Do you serve politically exposed persons (PEPs)?" value={str("pep")} onChange={(v) => put("pep", v)} />
            {str("pep") === "Yes" && (
              <Field label="How do you apply enhanced due diligence to PEPs?" htmlFor="pepDetail">
                <textarea id="pepDetail" value={str("pepDetail")} onChange={(e) => put("pepDetail", e.target.value)} className={textareaCls} />
              </Field>
            )}
          </>
        )}
      </FormCard>
    </OnboardingFrame>
  );
}

function YesNo({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[14px] leading-[21px] font-medium text-fg">{label}</legend>
      <div className="flex gap-2">
        {["Yes", "No"].map((o) => (
          <label
            key={o}
            className={cn(
              "flex h-12 flex-1 cursor-pointer items-center gap-2 rounded-[16px] border px-3 text-[14px] font-medium text-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
              value === o ? "border-[var(--color-foren-brand-green)] bg-surface" : "border-line bg-subtle"
            )}
          >
            <input type="radio" name={id} value={o} checked={value === o} onChange={() => onChange(o)} className="accent-[var(--color-foren-brand-green)]" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-surface pr-1 pl-2.5 text-[12px] font-medium text-fg-2 ring-1 ring-line">
      {label}
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="grid size-5 place-items-center rounded-full outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus">
        <RiCloseLine className="size-3" aria-hidden />
      </button>
    </span>
  );
}

/** Figma multi-select: chosen values as chips inside the field, a picker to add more. */
function ChipSelect({ id, options, value, onChange, placeholder }: { id: string; options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const remaining = options.filter((o) => !value.includes(o));
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-[16px] border border-line bg-subtle p-2 has-[:focus-visible]:border-focus">
      {value.map((v) => (
        <Chip key={v} label={v} onRemove={() => onChange(value.filter((x) => x !== v))} />
      ))}
      {remaining.length > 0 && (
        <select
          id={id}
          value=""
          onChange={(e) => e.target.value && onChange([...value, e.target.value])}
          className="h-8 min-w-[140px] flex-1 rounded-full bg-transparent pl-2 text-[13px] font-medium text-fg-3 outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <option value="">{placeholder}</option>
          {remaining.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function TagInput({ id, value, onChange, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-[16px] border border-line bg-subtle p-2 has-[:focus-visible]:border-focus">
      {value.map((v) => (
        <Chip key={v} label={v} onRemove={() => onChange(value.filter((x) => x !== v))} />
      ))}
      <input
        id={id}
        value={draft}
        placeholder={value.length ? "Add another" : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        className="h-8 min-w-[160px] flex-1 bg-transparent px-1 text-[14px] font-medium text-fg outline-none placeholder:text-fg-3"
      />
    </div>
  );
}
