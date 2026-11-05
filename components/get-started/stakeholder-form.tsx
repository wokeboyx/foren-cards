"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenInput } from "@/components/ui/foren-input";
import { ForenSelect } from "@/components/ui/foren-select";
import { LinkButton } from "@/components/link-button";
import { Field } from "@/components/onboarding/frame";
import { CONTROL_TYPES, KRA_PIN_RE, hasStakeholders, nationalityOptions, sumPct, uboThreshold, type ControlType } from "@/domain/onboarding";
import { PERSON, useOnboarding, type Stakeholder } from "@/lib/onboarding-store";
import { uid } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Note, SetupColumn, SetupHeader, cardCls, fullName } from "./shared";

const LIST = "/get-started/stakeholders";

/** Link to the add/edit page. Query params rather than a dynamic segment, so the static export needs no generateStaticParams. */
export function stakeholderHref(to: { kind?: "person" | "company"; parent?: string; id?: string }) {
  const q = new URLSearchParams();
  if (to.id) q.set("id", to.id);
  else {
    q.set("kind", to.kind ?? "person");
    if (to.parent) q.set("parent", to.parent);
  }
  return `${LIST}/edit?${q.toString()}`;
}

/**
 * Add or edit a stakeholder on its own page: a person (`?kind=person`), a company that owns shares
 * (`?kind=company`), a person who owns one of those companies (`&parent=<id>`), or any of them by `?id=<id>`.
 */
export function StakeholderFormPage() {
  const s = useOnboarding();
  const params = useSearchParams();
  const id = params.get("id");
  const parentId = params.get("parent");

  if (!s.signedUpAt || !s.country || !s.entity || !hasStakeholders(s.entity, s.category))
    return <Unavailable title="Stakeholders" message="Finish sign-up first." />;
  if (s.stakeholdersSubmitted)
    return (
      <Unavailable
        title="Stakeholders are locked"
        message="You’ve confirmed the declaration and sent the invitations, so stakeholder details can’t be changed now."
        intent="info"
      />
    );

  const person = id ? s.stakeholders.find((p) => p.id === id) ?? null : null;
  if (id && !person) return <Unavailable title="Stakeholder not found" message="We couldn’t find this stakeholder. They may have been removed." />;
  const parentRef = person ? person.parentId : parentId;
  const parent = parentRef ? s.stakeholders.find((p) => p.id === parentRef && p.kind === "company") ?? null : null;
  if (parentRef && !parent) return <Unavailable title="Company not found" message="We couldn’t find the company this person owns. It may have been removed." />;
  const kind = person ? person.kind : params.get("kind") === "company" && !parent ? "company" : "person";

  return (
    <StakeholderForm
      key={person?.id ?? `new-${kind}-${parent?.id ?? ""}`}
      kind={kind}
      person={person}
      parent={parent}
      all={s.stakeholders}
      threshold={uboThreshold(s.country, s.entity, s.category)!}
      kra={s.country === "KE"}
    />
  );
}

function Unavailable({ title, message, intent = "warning" }: { title: string; message: string; intent?: "info" | "warning" }) {
  return (
    <SetupColumn size="md">
      <SetupHeader back={LIST} title={title} />
      <Note intent={intent} className="mb-6">
        {message}
      </Note>
      <LinkButton href={LIST} variant="outline" size="md" className="w-full text-fg-2">
        Back to stakeholders
      </LinkButton>
    </SetupColumn>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NATIONALITIES = nationalityOptions();

function CountrySelect({ id, label, value, onChange, error }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <Field label={label} htmlFor={id} error={error}>
      <ForenSelect
        id={id}
        value={value}
        onChange={onChange}
        invalid={!!error}
        placeholder="Select a country"
        options={NATIONALITIES.map((n) => ({ value: n.code, label: n.name }))}
      />
    </Field>
  );
}

/** A white form card with a section heading. */
function Section({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  const headingId = React.useId();
  return (
    <section aria-labelledby={headingId} className={cn(cardCls, "flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6")}>
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-[16px] leading-[24px] font-semibold tracking-[0.01em] text-fg">
          {title}
        </h2>
        {description && <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-[12px] leading-[18px] font-medium text-error">
      {children}
    </p>
  );
}

function StakeholderForm({
  kind,
  person,
  parent,
  all,
  threshold,
  kra,
}: {
  kind: "person" | "company";
  person: Stakeholder | null;
  parent: Stakeholder | null;
  all: Stakeholder[];
  threshold: number;
  /** Kenya: ask for their KRA PIN, which isn't on Kenyan IDs. */
  kra: boolean;
}) {
  const router = useRouter();
  const upsertStakeholder = useOnboarding((st) => st.upsertStakeholder);
  const base: Stakeholder = person ?? { ...PERSON, kind, id: uid("sh"), firstName: "", lastName: "", email: "", position: "", parentId: parent?.id, source: "added", status: "not_sent" };
  const [v, setV] = React.useState({ ...base, ownershipText: base.ownership ? String(base.ownership) : "", kraPin: base.kraPin ?? "" });
  const [tried, setTried] = React.useState(false);
  const upd = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }));
  const company = kind === "company";
  const nested = !!parent;

  const pct = Number(v.ownershipText);
  const siblings = all.filter((p) => p.id !== v.id && (nested ? p.parentId === parent!.id : !p.parentId && (p.shareholder || p.kind === "company")));
  const siblingsTotal = sumPct(siblings.map((p) => p.ownership));
  const holdsShares = company || nested || v.shareholder;
  const effective = nested ? Math.round(((parent!.ownership * (pct || 0)) / 100) * 100) / 100 : holdsShares ? pct || 0 : 0;
  const needsControl = !company && (effective >= threshold || v.controller);
  const showControl = !company && (holdsShares || v.controller);

  const errors: Partial<Record<string, string>> = {};
  if (!v.firstName.trim()) errors.firstName = company ? "Enter the company name" : "Enter a first name";
  if (company) {
    if (!v.regNumber.trim()) errors.regNumber = "Enter the registration number";
    if (!v.regCountry) errors.regCountry = "Choose the country of registration";
  } else {
    if (!v.lastName.trim()) errors.lastName = "Enter a last name";
    if (!EMAIL.test(v.email.trim())) errors.email = "Enter a valid email address";
    else if (all.some((p) => p.id !== v.id && p.email && p.email.toLowerCase() === v.email.trim().toLowerCase())) errors.email = "Someone else already uses this email";
    if (!v.position.trim()) errors.position = nested ? "Enter their role, e.g. Owner" : "Enter their position, e.g. CEO";
    if (!v.nationality) errors.nationality = "Choose their nationality";
    if (kra && !KRA_PIN_RE.test(v.kraPin.trim())) errors.kraPin = v.kraPin.trim() ? "Enter a KRA PIN like A012345678Z: a letter, 9 digits and a letter" : "Enter their KRA PIN";
    if (!nested && !v.director && !v.shareholder && !v.signatory && !v.controller) errors.role = "Choose at least one role";
    if (needsControl && !v.control.length) errors.control = "Choose at least one";
    else if (v.control.includes("other") && !v.controlOther.trim()) errors.control = "Describe the other control";
  }
  if (holdsShares) {
    if (!v.ownershipText || !Number.isFinite(pct) || pct <= 0) errors.ownership = "Enter a percentage above 0";
    else if (pct > 100) errors.ownership = "Can’t be more than 100%";
    else if (sumPct([siblingsTotal, pct]) > 100) errors.ownership = `Only ${Math.max(0, sumPct([100, -siblingsTotal]))}% is left to assign`;
  }
  const show = (k: string) => (tried ? errors[k] : undefined);
  const toggleControl = (c: ControlType, on: boolean) => upd({ control: on ? [...v.control, c] : v.control.filter((x) => x !== c) });

  const title = company
    ? person
      ? "Edit company details"
      : "Add a company that owns shares"
    : nested
      ? person
        ? `Edit an owner of ${fullName(parent!)}`
        : `Add a person who owns ${fullName(parent!)}`
      : person
        ? "Edit stakeholder details"
        : "Add stakeholder details";
  const description = company
    ? "A company that holds shares in your business. After adding it, add the people who own it."
    : nested
      ? `${fullName(parent!)} owns ${parent!.ownership}% of your business. Add each person who owns or controls it.`
      : "We’ll email them a link to verify their identity once you confirm the declaration.";

  const shareInput = (label: string, desc?: string) => (
    <ForenInput
      label={label}
      inputMode="decimal"
      value={v.ownershipText}
      onChange={(e) => upd({ ownershipText: e.target.value.replace(/[^\d.]/g, "") })}
      error={show("ownership")}
      description={desc}
      trailingIcon={<span className="text-[14px] font-medium text-fg-3">%</span>}
    />
  );

  const control = showControl && (
    <fieldset className="flex flex-col gap-3" aria-describedby={show("control") ? "control-error" : undefined}>
      <legend className="mb-1 text-[14px] leading-[21px] font-medium text-fg">
        Nature of control{!needsControl && <span className="text-fg-3"> (optional)</span>}
      </legend>
      <p className="-mt-1 text-[12px] leading-[18px] font-medium text-fg-3">How they own or control {nested ? "it" : "the business"}. Tick all that apply.</p>
      {CONTROL_TYPES.map((t) => (
        <ForenCheckbox key={t.id} checked={v.control.includes(t.id)} onCheckedChange={(c) => toggleControl(t.id, c === true)} label={t.label} />
      ))}
      {v.control.includes("other") && (
        <ForenInput label="Describe their control" value={v.controlOther} onChange={(e) => upd({ controlOther: e.target.value })} placeholder="e.g. Veto over major decisions" />
      )}
      <FieldError id="control-error">{show("control")}</FieldError>
    </fieldset>
  );

  return (
    <SetupColumn size="md">
      <SetupHeader back={LIST} title={title} description={description} />
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (Object.keys(errors).length) {
            // The form is long: bring the first problem into view.
            requestAnimationFrame(() => document.querySelector('form [aria-invalid="true"], form [role="alert"]')?.scrollIntoView({ block: "center", behavior: "smooth" }));
            return;
          }
          const rest: Stakeholder & { ownershipText?: string } = { ...v };
          delete rest.ownershipText;
          const saved: Stakeholder = {
            ...rest,
            firstName: v.firstName.trim(),
            lastName: company ? "" : v.lastName.trim(),
            email: v.email.trim(),
            position: v.position.trim(),
            regNumber: v.regNumber.trim(),
            kraPin: !company && kra ? v.kraPin.trim().toUpperCase() : undefined,
            ownership: holdsShares ? pct : 0,
            shareholder: company || nested ? false : v.shareholder,
            control: showControl ? v.control : [],
            controlOther: showControl && v.control.includes("other") ? v.controlOther.trim() : "",
          };
          upsertStakeholder(saved);
          toast.success(person ? "Changes saved" : `${fullName(saved)} added`);
          router.push(LIST);
        }}
      >
        {company ? (
          <>
            <Section title="Company details">
              <ForenInput label="Company name" value={v.firstName} onChange={(e) => upd({ firstName: e.target.value })} error={show("firstName")} autoComplete="off" />
              <div className="grid gap-4 sm:grid-cols-2">
                <ForenInput label="Registration number" value={v.regNumber} onChange={(e) => upd({ regNumber: e.target.value })} error={show("regNumber")} />
                <CountrySelect id="sh-reg-country" label="Country of registration" value={v.regCountry} onChange={(c) => upd({ regCountry: c })} error={show("regCountry")} />
              </div>
            </Section>
            <Section title="Ownership" description="The share of your business this company holds.">
              {shareInput("Shareholding in your business")}
            </Section>
          </>
        ) : (
          <>
            <Section title="Personal details" description="As shown on their ID. Their ID check confirms these and gives us their date of birth.">
              <div className="grid gap-4 sm:grid-cols-2">
                <ForenInput label="First name" value={v.firstName} onChange={(e) => upd({ firstName: e.target.value })} error={show("firstName")} autoComplete="off" />
                <ForenInput label="Last name" value={v.lastName} onChange={(e) => upd({ lastName: e.target.value })} error={show("lastName")} autoComplete="off" />
              </div>
              <ForenInput
                label="Email address"
                type="email"
                value={v.email}
                onChange={(e) => upd({ email: e.target.value })}
                error={show("email")}
                description="Make sure this is an active email address — we’ll send a verification link for them to confirm their identity."
                autoComplete="off"
              />
              <CountrySelect id="sh-nationality" label="Nationality" value={v.nationality} onChange={(c) => upd({ nationality: c })} error={show("nationality")} />
              {kra && (
                <ForenInput
                  label="KRA PIN"
                  placeholder="A012345678Z"
                  description="From their KRA PIN certificate. It isn’t on Kenyan IDs."
                  autoComplete="off"
                  value={v.kraPin}
                  onChange={(e) => upd({ kraPin: e.target.value })}
                  error={show("kraPin")}
                />
              )}
            </Section>

            {nested ? (
              <Section title="Ownership and control" description={`Their role at ${fullName(parent!)} and how much of it they own.`}>
                <ForenInput label={`Role at ${fullName(parent!)}`} placeholder="e.g. Owner" value={v.position} onChange={(e) => upd({ position: e.target.value })} error={show("position")} />
                {shareInput(`Share of ${fullName(parent!)}`, pct > 0 ? `That’s ${effective}% of your business.` : undefined)}
                {control}
              </Section>
            ) : (
              <>
                <Section title="Role in the business" description="Tick every role that applies.">
                  <ForenInput label="Position" placeholder="e.g. CFO" value={v.position} onChange={(e) => upd({ position: e.target.value })} error={show("position")} />
                  <fieldset className="flex flex-col gap-3" aria-describedby={show("role") ? "role-error" : undefined}>
                    <legend className="sr-only">Their role</legend>
                    <ForenCheckbox
                      checked={v.director}
                      onCheckedChange={(c) => upd({ director: c === true })}
                      label="A director"
                      description="An executive with legal authority to act for the company."
                    />
                    <ForenCheckbox
                      checked={v.shareholder}
                      onCheckedChange={(c) => upd({ shareholder: c === true, control: c === true && !v.control.length ? ["shares"] : v.control })}
                      label="A shareholder"
                      description={`Owns shares. Everyone with ${threshold}% or more must be listed.`}
                    />
                    {v.shareholder && <div className="pl-8">{shareInput("Shareholding percentage")}</div>}
                    <ForenCheckbox
                      checked={v.signatory}
                      onCheckedChange={(c) => upd({ signatory: c === true })}
                      label="An authorised signatory"
                      description="Can sign documents and approve payments for the business."
                    />
                    <ForenCheckbox
                      checked={v.controller}
                      onCheckedChange={(c) => upd({ controller: c === true })}
                      label="Has significant control"
                      description={`Controls the business without owning ${threshold}% or more, e.g. the CEO or managing director.`}
                    />
                    <FieldError id="role-error">{show("role")}</FieldError>
                  </fieldset>
                </Section>
                {control && <Section title="Ownership and control">{control}</Section>}
              </>
            )}
          </>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <LinkButton href={LIST} variant="outline" size="md" className="text-fg-2">
            Cancel
          </LinkButton>
          <ForenButton type="submit" size="md">
            {person ? "Save changes" : company ? "Add company" : "Add stakeholder"}
          </ForenButton>
        </div>
      </form>
    </SetupColumn>
  );
}
