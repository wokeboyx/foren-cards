"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, fieldCls } from "@/components/onboarding/frame";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenRadio, ForenRadioGroup } from "@/components/ui/foren-radio";
import { countryInfo } from "@/domain/onboarding";
import { useOnboarding, useRequirementContext } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Note, SetupColumn, SetupHeader } from "./shared";

const PURPOSES = ["Pay suppliers abroad", "Collect payments from customers", "Pay staff and contractors", "Hold and convert currencies", "Spend with company cards", "Other"];
const VOLUMES = ["Under 10,000", "10,000 – 50,000", "50,000 – 250,000", "250,000 – 1M", "Above 1M"];
const TX_COUNTS = ["1 – 100", "101 – 500", "501 – 1,000", "Above 1,000"];
const SOURCES = ["Revenue from sales", "Investment or loans", "Owner’s own funds", "Grants or donations", "Other"];
const CURRENCIES = ["NGN", "USD", "GBP", "EUR", "CAD", "KES"];
const TIMELINES = ["Within a month", "1–3 months", "3–6 months", "Not sure yet"];

type Q = Record<string, string>;

/** Keys that must be answered, given what's shown. */
function requiredKeys(q: Q, banking: boolean, api: boolean) {
  const keys: string[] = [];
  if (banking) {
    keys.push("purpose", "inflow", "outflow", "txCount", "currencies", "countries", "source", "thirdParty", "pep");
    if (q.purpose === "Other") keys.push("purposeOther");
    if (q.pep === "yes") keys.push("pepDetails");
  }
  if (api) keys.push("apiProducts", "apiUseCase", "apiVolume", "apiTxCount", "apiTimeline");
  return keys;
}

const MESSAGES: Record<string, string> = {
  purpose: "Choose the main purpose",
  purposeOther: "Tell us the purpose",
  inflow: "Choose how much you’ll receive",
  outflow: "Choose how much you’ll send",
  txCount: "Choose how many transactions",
  currencies: "Choose at least one currency",
  countries: "List at least one country",
  source: "Choose where your funds come from",
  thirdParty: "Choose yes or no",
  pep: "Choose yes or no",
  pepDetails: "Tell us who and their role",
  apiProducts: "Choose Payouts, Collections or both",
  apiUseCase: "Describe what you’ll build",
  apiVolume: "Choose an expected volume",
  apiTxCount: "Choose how many transactions",
  apiTimeline: "Choose a timeline",
};

export function QuestionnairePage() {
  const ctx = useRequirementContext();
  const s = useOnboarding();
  const router = useRouter();
  const [tried, setTried] = React.useState(false);

  if (!ctx || !s.signedUpAt)
    return (
      <SetupColumn>
        <SetupHeader back="/get-started" title="Onboarding questionnaire" description="Finish sign-up first." />
      </SetupColumn>
    );

  const q = s.questionnaire;
  const banking = ctx.entity !== "mto" && ctx.banking !== false;
  const api = !!ctx.api;
  const currency = countryInfo(ctx.country)?.currency ?? "USD";
  const locked = s.questionnaireSubmitted;

  const upd = (patch: Q) => s.set({ questionnaire: { ...q, ...patch } });
  const list = (k: string) => (q[k] ? q[k].split(",") : []);
  const toggle = (k: string, v: string) => {
    const cur = list(k);
    upd({ [k]: (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(",") });
  };
  const missing = requiredKeys(q, banking, api).filter((k) => !q[k]?.trim());
  const err = (k: string) => (tried && missing.includes(k) ? MESSAGES[k] : undefined);

  const submit = () => {
    setTried(true);
    if (missing.length) {
      document.getElementById(`q-${missing[0]}`)?.focus();
      return;
    }
    s.set({ questionnaireSubmitted: true });
    toast.success("Questionnaire submitted");
    router.push("/get-started");
  };

  return (
    <SetupColumn>
      <SetupHeader
        back="/get-started"
        title={banking ? "Onboarding questionnaire" : "API onboarding"}
        description={banking ? "A few questions about how you’ll use your account. Your answers save as you go." : "Tell us what you’ll build with our API. Your answers save as you go."}
      />
      {locked && (
        <Note intent="success" className="mb-6">
          Submitted. You can’t change these answers while we review them.
        </Note>
      )}
      <fieldset disabled={locked} className="flex flex-col gap-6">
        {banking && (
          <section className="flex flex-col gap-8 rounded-[24px] bg-surface px-4 py-6">
            <Field label="What’s the main purpose of this account?" htmlFor="q-purpose" error={err("purpose")}>
              <select id="q-purpose" className={fieldCls} value={q.purpose ?? ""} aria-invalid={!!err("purpose")} onChange={(e) => upd({ purpose: e.target.value })}>
                <option value="">Select a purpose</option>
                {PURPOSES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            {q.purpose === "Other" && (
              <Field label="Tell us more" htmlFor="q-purposeOther" error={err("purposeOther")}>
                <input id="q-purposeOther" className={fieldCls} value={q.purposeOther ?? ""} aria-invalid={!!err("purposeOther")} onChange={(e) => upd({ purposeOther: e.target.value })} />
              </Field>
            )}
            <RangeSelect id="q-inflow" label="How much do you expect to receive each month?" description={`In ${currency}.`} placeholder="Select a range" options={VOLUMES} prefix={currency} value={q.inflow} onChange={(v) => upd({ inflow: v })} error={err("inflow")} />
            <RangeSelect id="q-outflow" label="How much do you expect to send each month?" description={`In ${currency}.`} placeholder="Select a range" options={VOLUMES} prefix={currency} value={q.outflow} onChange={(v) => upd({ outflow: v })} error={err("outflow")} />
            <RangeSelect id="q-txCount" label="About how many transactions will you make each month?" description="Count both payments in and out." placeholder="Select a range" options={TX_COUNTS} value={q.txCount} onChange={(v) => upd({ txCount: v })} error={err("txCount")} />
            <Chips id="q-currencies" label="Which currencies will you use most?" options={CURRENCIES} value={list("currencies")} onToggle={(v) => toggle("currencies", v)} error={err("currencies")} />
            <Field label="Which countries will you send money to or receive from?" description="Separate countries with commas." htmlFor="q-countries" error={err("countries")}>
              <input id="q-countries" className={fieldCls} placeholder="e.g. United Kingdom, Ghana, China" value={q.countries ?? ""} aria-invalid={!!err("countries")} onChange={(e) => upd({ countries: e.target.value })} />
            </Field>
            <Field label="Where does the money in this account come from?" htmlFor="q-source" error={err("source")}>
              <select id="q-source" className={fieldCls} value={q.source ?? ""} aria-invalid={!!err("source")} onChange={(e) => upd({ source: e.target.value })}>
                <option value="">Select a source</option>
                {SOURCES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <YesNo id="q-thirdParty" label="Will you hold or move money on behalf of other people or businesses?" value={q.thirdParty} onChange={(v) => upd({ thirdParty: v })} error={err("thirdParty")} />
            <YesNo
              id="q-pep"
              label="Is any director, owner or signatory a politically exposed person?"
              description="Someone who holds, or recently held, a prominent public role, or their close family."
              value={q.pep}
              onChange={(v) => upd({ pep: v })}
              error={err("pep")}
            />
            {q.pep === "yes" && (
              <Field label="Who, and what role?" htmlFor="q-pepDetails" error={err("pepDetails")}>
                <textarea
                  id="q-pepDetails"
                  rows={3}
                  className={cn(fieldCls, "h-auto py-3")}
                  value={q.pepDetails ?? ""}
                  aria-invalid={!!err("pepDetails")}
                  onChange={(e) => upd({ pepDetails: e.target.value })}
                />
              </Field>
            )}
          </section>
        )}

        {api && (
          <section className="flex flex-col gap-8 rounded-[24px] bg-surface px-4 py-6">
            {banking && <h2 className="text-[16px] leading-[24px] font-semibold text-fg">API onboarding</h2>}
            <Chips
              id="q-apiProducts"
              label="Which APIs will you use?"
              options={["Payouts", "Collections"]}
              value={list("apiProducts")}
              onToggle={(v) => toggle("apiProducts", v)}
              error={err("apiProducts")}
            />
            <Field label="What will you build?" description="For example: paying out to sellers in Kenya, or collecting school fees." htmlFor="q-apiUseCase" error={err("apiUseCase")}>
              <textarea
                id="q-apiUseCase"
                rows={4}
                className={cn(fieldCls, "h-auto py-3")}
                value={q.apiUseCase ?? ""}
                aria-invalid={!!err("apiUseCase")}
                onChange={(e) => upd({ apiUseCase: e.target.value })}
              />
            </Field>
            <Field label="Expected monthly API volume" description={`In ${currency}.`} htmlFor="q-apiVolume" error={err("apiVolume")}>
              <select id="q-apiVolume" className={fieldCls} value={q.apiVolume ?? ""} aria-invalid={!!err("apiVolume")} onChange={(e) => upd({ apiVolume: e.target.value })}>
                <option value="">Select a range</option>
                {VOLUMES.map((v) => (
                  <option key={v} value={v}>
                    {currency} {v}
                  </option>
                ))}
              </select>
            </Field>
            <RangeSelect id="q-apiTxCount" label="About how many API transactions each month?" description="Count both payouts and collections." placeholder="Select a range" options={TX_COUNTS} value={q.apiTxCount} onChange={(v) => upd({ apiTxCount: v })} error={err("apiTxCount")} />
            <Field label="When do you plan to go live?" htmlFor="q-apiTimeline" error={err("apiTimeline")}>
              <select id="q-apiTimeline" className={fieldCls} value={q.apiTimeline ?? ""} aria-invalid={!!err("apiTimeline")} onChange={(e) => upd({ apiTimeline: e.target.value })}>
                <option value="">Select a timeline</option>
                {TIMELINES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Webhook URL (optional)" hint="Where we send payment events. You can add it later." htmlFor="q-webhook">
              <input id="q-webhook" type="url" className={fieldCls} placeholder="https://" value={q.webhook ?? ""} onChange={(e) => upd({ webhook: e.target.value })} />
            </Field>
          </section>
        )}
      </fieldset>

      {tried && missing.length > 0 && (
        <Note intent="error" className="mt-6">
          Answer the {missing.length === 1 ? "question" : `${missing.length} questions`} marked above to continue.
        </Note>
      )}
      {!locked && (
        <ForenButton size="md" className="mt-6 w-full" onClick={submit}>
          Submit answers
        </ForenButton>
      )}
    </SetupColumn>
  );
}

function RangeSelect({ id, label, description, placeholder, options, prefix, value, onChange, error }: { id: string; label: string; description?: string; placeholder: string; options: string[]; prefix?: string; value?: string; onChange: (v: string) => void; error?: string }) {
  return (
    <Field label={label} description={description} htmlFor={id} error={error}>
      <select id={id} className={fieldCls} value={value ?? ""} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {prefix ? `${prefix} ${o}` : o}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Chips({ id, label, options, value, onToggle, error }: { id: string; label: string; options: string[]; value: string[]; onToggle: (v: string) => void; error?: string }) {
  return (
    <fieldset className="flex flex-col gap-2" aria-invalid={!!error}>
      <legend className="mb-2 text-[14px] leading-[21px] font-medium text-fg">{label}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-3">
        {options.map((o, i) => (
          <ForenCheckbox key={o} id={i === 0 ? id : undefined} checked={value.includes(o)} onCheckedChange={() => onToggle(o)} label={o} />
        ))}
      </div>
      {error && (
        <p role="alert" className="text-[12px] leading-[18px] font-medium text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function YesNo({ id, label, description, value, onChange, error }: { id: string; label: string; description?: string; value?: string; onChange: (v: string) => void; error?: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[14px] leading-[21px] font-medium text-fg">{label}</legend>
      {description && <p className="-mt-1 text-[12px] leading-[18px] font-medium text-fg-2">{description}</p>}
      <ForenRadioGroup value={value ?? ""} onChange={onChange} className="flex-row gap-6" ariaLabel={label}>
        <ForenRadio id={id} value="yes" label="Yes" />
        <ForenRadio value="no" label="No" />
      </ForenRadioGroup>
      {error && (
        <p role="alert" className="text-[12px] leading-[18px] font-medium text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
