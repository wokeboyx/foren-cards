"use client";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { RiAddLine, RiBuilding2Line, RiDeleteBinLine, RiMore2Fill, RiPencilLine, RiShieldCheckFill, RiUser3Fill } from "@remixicon/react";
import { toast } from "sonner";
import { ConfirmDialog, Modal } from "@/components/overlay";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenInput } from "@/components/ui/foren-input";
import { LinkButton } from "@/components/link-button";
import { Field, fieldCls } from "@/components/onboarding/frame";
import { formatDate } from "@/components/onboarding/shared";
import { CONTROL_TYPES, controlLabel, countryInfo, minDirectors, nationalityName, nationalityOptions, uboThreshold, type ControlType } from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { PERSON, effectiveOwnership, peopleOf, registryStakeholders, ubosOf, useOnboarding, type Stakeholder } from "@/lib/onboarding-store";
import { uid } from "@/lib/store";
import { cn } from "@/lib/utils";
import { GroupLabel, Note, PersonAvatar, SetupColumn, SetupHeader, fullName, roleLine, verificationLink } from "./shared";

export function StakeholdersPage() {
  const s = useOnboarding();
  const [started, setStarted] = React.useState(false);

  if (!s.signedUpAt || !s.country || !s.entity)
    return (
      <SetupColumn>
        <SetupHeader title="Stakeholders" description="Finish sign-up first." back="/get-started" />
      </SetupColumn>
    );
  if (s.entity === "sole_trader")
    return (
      <SetupColumn>
        <SetupHeader
          back="/get-started"
          title="No stakeholders needed"
          description="As a sole trader, you’re the only owner. You verified your identity when you signed up."
        />
      </SetupColumn>
    );

  if (!started && s.stakeholders.length === 0)
    return (
      <Intro
        threshold={uboThreshold(s.country, s.entity)!}
        onStart={() => {
          if (s.business?.source === "registry") s.set({ stakeholders: registryStakeholders() });
          setStarted(true);
        }}
      />
    );
  return <Controllers />;
}

function Intro({ threshold, onStart }: { threshold: number; onStart: () => void }) {
  const router = useRouter();
  return (
    <SetupColumn className="pt-4">
      <SetupHeader
        title="Corporate structure"
        description={`Add details for all company directors, ultimate beneficial owners (UBOs) holding ${threshold}% or more, and authorised signatories.`}
      />
      <div className="mb-8 flex justify-center">
        <Image src={asset("/onboarding/folder.png")} alt="" width={140} height={140} priority />
      </div>
      <Note intent="info" title="Why we ask this">
        Financial regulations require us to identify anyone with significant control over the business. This helps keep global transfers secure.
      </Note>
      <ul className="mt-6 flex flex-col gap-5">
        <li className="flex gap-3">
          <RiUser3Fill className="mt-0.5 size-4 shrink-0 text-[#3d6fb6]" aria-hidden />
          <div>
            <p className="text-[14px] leading-[21px] font-medium text-fg">Add directors, owners and signatories</p>
            <p className="text-[12px] leading-[18px] font-medium text-fg-2">
              Include anyone who is a director, owns {threshold}% or more, or can sign for the company.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <RiShieldCheckFill className="mt-0.5 size-4 shrink-0 text-[#c026d3]" aria-hidden />
          <div>
            <p className="text-[14px] leading-[21px] font-medium text-fg">They verify their identity</p>
            <p className="text-[12px] leading-[18px] font-medium text-fg-2">Each person gets an email link to upload their ID and proof of address, and take a quick selfie.</p>
          </div>
        </li>
      </ul>
      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row">
        <ForenButton variant="outline" size="md" className="flex-1" onClick={() => router.push("/get-started")}>
          Skip for now
        </ForenButton>
        <ForenButton size="md" className="flex-1" onClick={onStart}>
          Get started
        </ForenButton>
      </div>
    </SetupColumn>
  );
}

type Editing = { kind: "person" | "company"; person: Stakeholder | null; parent: Stakeholder | null };

function Controllers() {
  const s = useOnboarding();
  const router = useRouter();
  const country = s.country!;
  const entity = s.entity!;
  const threshold = uboThreshold(country, entity)!;
  const needDirectors = minDirectors(entity);
  const registry = countryInfo(country)?.registry ?? "registry";

  const [editing, setEditing] = React.useState<Editing | null>(null);
  const [removing, setRemoving] = React.useState<Stakeholder | null>(null);
  const [sent, setSent] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const [declaring, setDeclaring] = React.useState(false);
  const [viewing, setViewing] = React.useState(false);

  const all = s.stakeholders;
  const people = peopleOf(all);
  const top = all.filter((p) => !p.parentId);
  const fromRegistry = top.filter((p) => p.source === "registry");
  const added = top.filter((p) => p.source === "added");
  const companies = all.filter((p) => p.kind === "company");
  const ubos = ubosOf(all, threshold);
  const controllers = people.filter((p) => p.controller);
  const total = top.filter((p) => p.shareholder || p.kind === "company").reduce((a, p) => a + p.ownership, 0);
  const directors = people.filter((p) => p.director).length;
  const signatories = people.filter((p) => p.signatory).length;
  const missingOwnership = all.filter((p) => (p.shareholder || p.kind === "company" || p.parentId) && !p.ownership);
  const missingDetails = people.filter((p) => !p.dob || !p.nationality);
  const missingControl = people.filter((p) => (ubos.includes(p) || p.controller) && !p.control.length);
  const locked = s.stakeholdersSubmitted;

  const problems: string[] = [];
  if (people.length === 0) problems.push("Add at least one person.");
  if (directors < needDirectors) problems.push(`Add at least ${needDirectors} directors. You have ${directors}.`);
  if (people.length && signatories === 0) problems.push("Add at least one authorised signatory.");
  if (missingOwnership.length) problems.push(`Add the ownership percentage for ${missingOwnership.map(fullName).join(" and ")}.`);
  if (missingDetails.length) problems.push(`Add the date of birth and nationality for ${missingDetails.map(fullName).join(" and ")}.`);
  if (missingControl.length) problems.push(`Add the nature of control for ${missingControl.map(fullName).join(" and ")}.`);
  if (total > 100) problems.push(`Ownership adds up to ${total}%. It can’t be more than 100%.`);
  for (const c of companies) {
    const owners = all.filter((p) => p.parentId === c.id);
    const held = owners.reduce((a, p) => a + p.ownership, 0);
    if (c.ownership >= threshold && owners.length === 0) problems.push(`Add the people who own ${fullName(c)}.`);
    if (held > 100) problems.push(`Owners of ${fullName(c)} add up to ${held}%. It can’t be more than 100%.`);
  }
  if (people.length && !ubos.length && !s.noMajorOwner)
    problems.push(`No individual owns ${threshold}% or more. Tick the box below and add the person with significant control.`);
  if (s.noMajorOwner && ubos.length) problems.push(`${ubos.map(fullName).join(" and ")} own ${threshold}% or more. Untick “No individual owns ${threshold}% or more”.`);
  if (s.noMajorOwner && !ubos.length && !controllers.length) problems.push("Add the person with significant control, and tick “Has significant control” for them.");

  // Checks first, then the declaration, built from this list. Confirming it sends the invitations.
  const review = () => {
    setTried(true);
    if (problems.length) return;
    setDeclaring(true);
  };
  const confirm = () => {
    const now = new Date().toISOString();
    setDeclaring(false);
    s.set({
      stakeholdersSubmitted: true,
      declaration: { confirmedAt: now, name: `${s.firstName} ${s.lastName}`.trim(), email: s.email, position: s.position, phone: s.phone },
      invitesSentAt: now,
      stakeholders: all.map((p) => (p.kind === "company" || p.status === "verified" ? p : { ...p, status: "pending" as const })),
    });
    setSent(true);
  };

  const list = (items: Stakeholder[]) => (
    <PeopleList
      items={items}
      all={all}
      threshold={threshold}
      locked={locked}
      onEdit={(p) => setEditing({ kind: p.kind, person: p, parent: all.find((x) => x.id === p.parentId) ?? null })}
      onRemove={setRemoving}
      onAddOwner={(c) => setEditing({ kind: "person", person: null, parent: c })}
    />
  );

  return (
    <SetupColumn>
      <SetupHeader
        back="/get-started"
        title="Add key business controllers"
        description={`List everyone who is a director, owns ${threshold}% or more (directly or through another company), or can sign for the business.`}
      />

      {!locked && (
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:gap-3">
          <AddButton onClick={() => setEditing({ kind: "person", person: null, parent: null })}>Add a person</AddButton>
          <AddButton onClick={() => setEditing({ kind: "company", person: null, parent: null })}>Add a company that owns shares</AddButton>
        </div>
      )}
      {locked && (
        <Note intent="success" className="mb-8" title="Declaration confirmed and invitations sent">
          {s.declaration && (
            <>
              {s.declaration.name} confirmed the declaration on {formatDate(s.declaration.confirmedAt)}.{" "}
              <button type="button" onClick={() => setViewing(true)} className="font-semibold underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus">
                View declaration
              </button>
              <br />
            </>
          )}
          You can follow each person’s progress on the verification page.{" "}
          <LinkButton href="/get-started/verification" variant="link" size="xs" className="text-success underline">
            View verification
          </LinkButton>
        </Note>
      )}

      {added.length > 0 && (
        <section className="mb-6">
          <GroupLabel>Newly added</GroupLabel>
          {list(added)}
        </section>
      )}
      {fromRegistry.length > 0 && (
        <section className="mb-6">
          <GroupLabel>From {registry}</GroupLabel>
          {list(fromRegistry)}
        </section>
      )}

      {top.length > 0 && missingOwnership.length === 0 && (
        <div className="mb-3" aria-live="polite">
          {total === 100 ? (
            <Note intent="success">Total ownership: 100% — fully allocated</Note>
          ) : total > 100 ? (
            <Note intent="error">
              Total allocated: {total}% — {total - 100}% too much
            </Note>
          ) : (
            <Note intent="warning">
              Total allocated: {total}% — {100 - total}% unassigned. That’s fine if the rest is held by people who own less than {threshold}%.
            </Note>
          )}
        </div>
      )}

      {people.length > 0 && (
        <div className="mb-6 rounded-[16px] bg-surface px-4 py-3.5">
          <ForenCheckbox
            checked={s.noMajorOwner}
            disabled={locked}
            onCheckedChange={(c) => s.set({ noMajorOwner: c === true })}
            label={`No individual owns ${threshold}% or more`}
            description="Then add the person with significant management control, such as the CEO or managing director, and tick “Has significant control” for them."
          />
        </div>
      )}

      {!locked && (
        <>
          <Note intent="info" className="mb-6">
            Each person gets a unique link to verify their ID, upload proof of address and take a liveness check. Links expire in 72 hours. Companies don’t get a
            link: their owners do.
          </Note>
          {tried && problems.length > 0 && (
            <div role="alert" className="mb-4 rounded-[12px] bg-error-subtle px-3 py-2.5 text-[13px] leading-[19px] font-medium text-error">
              <ul className="list-disc space-y-0.5 pl-4">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          <ForenButton size="md" className="w-full" onClick={review}>
            Review declaration
          </ForenButton>
        </>
      )}

      {editing && (
        <StakeholderDialog
          key={editing.person?.id ?? `new-${editing.kind}-${editing.parent?.id ?? ""}`}
          kind={editing.kind}
          person={editing.person}
          parent={editing.parent}
          all={all}
          threshold={threshold}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            s.upsertStakeholder(p);
            setEditing(null);
            toast.success(editing.person ? "Changes saved" : `${fullName(p)} added`);
          }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing ? fullName(removing) : ""}?`}
        consequence={
          removing?.source === "registry"
            ? `They’re listed in the ${registry} record. Only remove them if they’ve left the business.`
            : removing?.kind === "company"
              ? "The people listed as its owners are removed too."
              : "They won’t get a verification link."
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (removing) s.removeStakeholder(removing.id);
          setRemoving(null);
        }}
      />

      {(declaring || viewing) && (
        <DeclarationDialog
          threshold={threshold}
          readOnly={viewing}
          onClose={() => {
            setDeclaring(false);
            setViewing(false);
          }}
          onConfirm={confirm}
        />
      )}

      <SentDialog
        open={sent}
        people={peopleOf(s.stakeholders)}
        onDone={() => {
          setSent(false);
          router.push("/get-started");
        }}
      />
    </SetupColumn>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 items-center gap-3 rounded-[16px] px-2 text-left text-[14px] font-medium text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line-2 text-fg-2">
        <RiAddLine className="size-4" aria-hidden />
      </span>
      {children}
    </button>
  );
}

/** What's still missing on a row, if anything. */
function missingOf(p: Stakeholder, all: Stakeholder[], threshold: number): string | null {
  if ((p.shareholder || p.kind === "company" || p.parentId) && !p.ownership) return "Ownership percentage missing.";
  if (p.kind === "company") return null;
  if (!p.dob || !p.nationality) return "Date of birth and nationality missing.";
  if ((effectiveOwnership(p, all) >= threshold || p.controller) && !p.control.length) return "Nature of control missing.";
  return null;
}

function PeopleList({
  items,
  all,
  threshold,
  locked,
  onEdit,
  onRemove,
  onAddOwner,
}: {
  items: Stakeholder[];
  all: Stakeholder[];
  threshold: number;
  locked: boolean;
  onEdit: (p: Stakeholder) => void;
  onRemove: (p: Stakeholder) => void;
  onAddOwner: (company: Stakeholder) => void;
}) {
  const row = (p: Stakeholder, nested: boolean) => {
    const missing = missingOf(p, all, threshold);
    const parent = all.find((x) => x.id === p.parentId);
    const line =
      p.kind === "company"
        ? `Company · ${p.ownership}% ownership`
        : parent
          ? `Owns ${p.ownership}% of ${fullName(parent)} · ${effectiveOwnership(p, all)}% of this business`
          : roleLine(p);
    return (
      <div className={cn("flex items-center gap-3 rounded-[16px] bg-surface px-4 py-3.5", nested && "ml-6 sm:ml-10")}>
        {p.kind === "company" ? (
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-fg-2">
            <RiBuilding2Line className="size-4" />
          </span>
        ) : (
          <PersonAvatar person={p} />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] leading-[21px] font-semibold text-fg">{fullName(p)}</p>
          {missing ? (
            <p className="text-[12px] leading-[18px] font-medium text-error">{missing}</p>
          ) : (
            <p className="text-[12px] leading-[18px] font-medium text-fg-2">{line}</p>
          )}
        </div>
        {!locked && <RowMenu person={p} onEdit={() => onEdit(p)} onRemove={() => onRemove(p)} />}
      </div>
    );
  };
  return (
    <ul className="flex flex-col gap-3">
      {items.map((p) => (
        <li key={p.id} className="flex flex-col gap-2">
          {row(p, false)}
          {p.kind === "company" && (
            <>
              {all
                .filter((o) => o.parentId === p.id)
                .map((o) => (
                  <React.Fragment key={o.id}>{row(o, true)}</React.Fragment>
                ))}
              {!locked && (
                <button
                  type="button"
                  onClick={() => onAddOwner(p)}
                  className="ml-6 flex h-10 w-fit items-center gap-2 rounded-[12px] px-2 text-[13px] font-medium text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus sm:ml-10"
                >
                  <RiAddLine className="size-4 text-fg-2" aria-hidden />
                  Add a person who owns {fullName(p)}
                </button>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function RowMenu({ person, onEdit, onRemove }: { person: Stakeholder; onEdit: () => void; onRemove: () => void }) {
  const [open, setOpen] = React.useState(false);
  const item =
    "flex h-9 w-full items-center gap-2 rounded-[10px] px-2.5 text-left text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus [&_svg]:size-4";
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${fullName(person)}`}
          className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-line text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
        >
          <RiMore2Fill className="size-4" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-[150px] rounded-[14px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
        >
          <button
            type="button"
            className={cn(item, "text-fg hover:bg-subtle")}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <RiPencilLine aria-hidden />
            Edit
          </button>
          <button
            type="button"
            className={cn(item, "text-error hover:bg-error-subtle")}
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            <RiDeleteBinLine aria-hidden />
            Delete
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NATIONALITIES = nationalityOptions();

/** ISO date 18 years ago today: anyone born after it is under 18. */
function adultCutoff() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

function CountrySelect({ id, label, value, onChange, error }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <Field label={label} htmlFor={id} error={error}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error || undefined} className={cn(fieldCls, !value && "text-fg-3")}>
        <option value="">Choose…</option>
        {NATIONALITIES.map((n) => (
          <option key={n.code} value={n.code}>
            {n.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

/**
 * Add or edit a stakeholder: a person, a company that owns shares, or a person who owns the business
 * through one of those companies (`parent`).
 */
function StakeholderDialog({
  kind,
  person,
  parent,
  all,
  threshold,
  onClose,
  onSave,
}: {
  kind: "person" | "company";
  person: Stakeholder | null;
  parent: Stakeholder | null;
  all: Stakeholder[];
  threshold: number;
  onClose: () => void;
  onSave: (p: Stakeholder) => void;
}) {
  const base: Stakeholder = person ?? { ...PERSON, kind, id: uid("sh"), firstName: "", lastName: "", email: "", position: "", parentId: parent?.id, source: "added", status: "not_sent" };
  const [v, setV] = React.useState({ ...base, ownershipText: base.ownership ? String(base.ownership) : "" });
  const [tried, setTried] = React.useState(false);
  const upd = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }));
  const company = kind === "company";
  const nested = !!parent;

  const pct = Number(v.ownershipText);
  const siblings = all.filter((p) => p.id !== v.id && (nested ? p.parentId === parent!.id : !p.parentId && (p.shareholder || p.kind === "company")));
  const siblingsTotal = siblings.reduce((a, p) => a + p.ownership, 0);
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
    const today = new Date().toISOString().slice(0, 10);
    if (!v.dob) errors.dob = "Enter their date of birth";
    else if (v.dob >= today) errors.dob = "Date of birth must be in the past";
    else if ((v.director || v.signatory || v.controller) && v.dob > adultCutoff()) errors.dob = "Directors, signatories and controllers must be 18 or older";
    if (!v.nationality) errors.nationality = "Choose their nationality";
    if (!nested && !v.director && !v.shareholder && !v.signatory && !v.controller) errors.role = "Choose at least one role";
    if (needsControl && !v.control.length) errors.control = "Choose at least one";
    else if (v.control.includes("other") && !v.controlOther.trim()) errors.control = "Describe the other control";
  }
  if (holdsShares) {
    if (!v.ownershipText || !Number.isFinite(pct) || pct <= 0) errors.ownership = "Enter a percentage above 0";
    else if (pct > 100) errors.ownership = "Can’t be more than 100%";
    else if (siblingsTotal + pct > 100) errors.ownership = `Only ${Math.max(0, 100 - siblingsTotal)}% is left to assign`;
  }
  const show = (k: string) => (tried ? errors[k] : undefined);
  const toggleControl = (c: ControlType, on: boolean) => upd({ control: on ? [...v.control, c] : v.control.filter((x) => x !== c) });

  const title = company
    ? person
      ? "Edit company details"
      : "Add a company that owns shares"
    : nested
      ? `${person ? "Edit" : "Add"} an owner of ${fullName(parent!)}`
      : person
        ? "Edit stakeholder details"
        : "Add stakeholder details";

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={title} className="sm:max-w-[480px]">
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (Object.keys(errors).length) return;
          const rest: Stakeholder & { ownershipText?: string } = { ...v };
          delete rest.ownershipText;
          onSave({
            ...rest,
            firstName: v.firstName.trim(),
            lastName: company ? "" : v.lastName.trim(),
            email: v.email.trim(),
            position: v.position.trim(),
            regNumber: v.regNumber.trim(),
            ownership: holdsShares ? pct : 0,
            shareholder: company || nested ? false : v.shareholder,
            control: showControl ? v.control : [],
            controlOther: showControl && v.control.includes("other") ? v.controlOther.trim() : "",
          });
        }}
      >
        {company ? (
          <>
            <p className="-mt-2 text-[13px] leading-[19px] font-medium text-fg-2">
              A company that holds shares in your business. After adding it, add the people who own it.
            </p>
            <ForenInput label="Company name" value={v.firstName} onChange={(e) => upd({ firstName: e.target.value })} error={show("firstName")} autoComplete="off" />
            <div className="grid gap-3 sm:grid-cols-2">
              <ForenInput label="Registration number" value={v.regNumber} onChange={(e) => upd({ regNumber: e.target.value })} error={show("regNumber")} />
              <CountrySelect id="sh-reg-country" label="Country of registration" value={v.regCountry} onChange={(c) => upd({ regCountry: c })} error={show("regCountry")} />
            </div>
          </>
        ) : (
          <>
            {nested && (
              <p className="-mt-2 text-[13px] leading-[19px] font-medium text-fg-2">
                {fullName(parent!)} owns {parent!.ownership}% of your business. Add each person who owns or controls it.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <ForenInput label="First name" value={v.firstName} onChange={(e) => upd({ firstName: e.target.value })} error={show("firstName")} autoComplete="off" />
              <ForenInput label="Last name" value={v.lastName} onChange={(e) => upd({ lastName: e.target.value })} error={show("lastName")} autoComplete="off" />
            </div>
            <ForenInput
              label="Email address"
              type="email"
              value={v.email}
              onChange={(e) => upd({ email: e.target.value })}
              error={show("email")}
              description="Use an inbox they check. We’ll send their verification link here."
              autoComplete="off"
            />
            <ForenInput
              label={nested ? `Role at ${fullName(parent!)}` : "Position"}
              placeholder={nested ? "e.g. Owner" : "e.g. CFO"}
              value={v.position}
              onChange={(e) => upd({ position: e.target.value })}
              error={show("position")}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <ForenInput label="Date of birth" type="date" max={new Date().toISOString().slice(0, 10)} value={v.dob} onChange={(e) => upd({ dob: e.target.value })} error={show("dob")} />
              <CountrySelect id="sh-nationality" label="Nationality" value={v.nationality} onChange={(c) => upd({ nationality: c })} error={show("nationality")} />
            </div>
            <p className="-mt-3 text-[12px] leading-[18px] font-medium text-fg-3">As shown on their ID. Their ID check confirms these.</p>
          </>
        )}

        {company || nested ? (
          <ForenInput
            label={nested ? `Share of ${fullName(parent!)}` : "Shareholding in your business"}
            inputMode="decimal"
            value={v.ownershipText}
            onChange={(e) => upd({ ownershipText: e.target.value.replace(/[^\d.]/g, "") })}
            error={show("ownership")}
            description={nested && pct > 0 ? `That’s ${effective}% of your business.` : undefined}
            trailingIcon={<span className="text-[14px] font-medium text-fg-3">%</span>}
          />
        ) : (
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
            {v.shareholder && (
              <div className="pl-8">
                <ForenInput
                  label="Shareholding percentage"
                  inputMode="decimal"
                  value={v.ownershipText}
                  onChange={(e) => upd({ ownershipText: e.target.value.replace(/[^\d.]/g, "") })}
                  error={show("ownership")}
                  trailingIcon={<span className="text-[14px] font-medium text-fg-3">%</span>}
                />
              </div>
            )}
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
            {show("role") && (
              <p id="role-error" role="alert" className="text-[12px] leading-[18px] font-medium text-error">
                {errors.role}
              </p>
            )}
          </fieldset>
        )}

        {showControl && (
          <fieldset className="flex flex-col gap-3 rounded-[16px] border border-line p-4" aria-describedby={show("control") ? "control-error" : undefined}>
            <legend className="px-1 text-[14px] leading-[21px] font-medium text-fg">
              Nature of control{!needsControl && <span className="text-fg-3"> (optional)</span>}
            </legend>
            <p className="-mt-1 text-[12px] leading-[18px] font-medium text-fg-3">How they own or control {nested ? "it" : "the business"}. Tick all that apply.</p>
            {CONTROL_TYPES.map((t) => (
              <ForenCheckbox key={t.id} checked={v.control.includes(t.id)} onCheckedChange={(c) => toggleControl(t.id, c === true)} label={t.label} />
            ))}
            {v.control.includes("other") && (
              <ForenInput label="Describe their control" value={v.controlOther} onChange={(e) => upd({ controlOther: e.target.value })} placeholder="e.g. Veto over major decisions" />
            )}
            {show("control") && (
              <p id="control-error" role="alert" className="text-[12px] leading-[18px] font-medium text-error">
                {errors.control}
              </p>
            )}
          </fieldset>
        )}

        <div className="mt-1 grid grid-cols-2 gap-3 border-t border-line pt-5">
          <ForenButton type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </ForenButton>
          <ForenButton type="submit" size="sm">
            {person ? "Save changes" : company ? "Add company" : "Add person"}
          </ForenButton>
        </div>
      </form>
    </Modal>
  );
}

/**
 * The Director and UBO self-declaration, digital only. Sections 1–4 are filled in from sign-up and the
 * stakeholder list; Section 5 is the form's statement, confirmed with a tick instead of a signature.
 */
function DeclarationDialog({
  threshold,
  readOnly,
  onClose,
  onConfirm,
}: {
  threshold: number;
  readOnly: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const s = useOnboarding();
  const [agreed, setAgreed] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const all = s.stakeholders;
  const people = peopleOf(all);
  const ubos = ubosOf(all, threshold);
  const controllers = people.filter((p) => p.controller && !ubos.includes(p));
  const companies = all.filter((p) => p.kind === "company");
  const directors = people.filter((p) => p.director);
  const signatories = people.filter((p) => p.signatory);
  const b = s.business;
  const by =
    readOnly && s.declaration
      ? s.declaration
      : { name: `${s.firstName} ${s.lastName}`.trim(), email: s.email, position: s.position, phone: s.phone, confirmedAt: new Date().toISOString() };
  const personLine = (p: Stakeholder) => [formatDate(p.dob), nationalityName(p.nationality), controlLabel(p.control, p.controlOther)].filter(Boolean).join(" · ");

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="Director and UBO declaration"
      description={readOnly ? undefined : "We filled this in from your details. Check it, then confirm it on behalf of the business."}
      className="sm:max-w-[560px]"
    >
      <div className="flex flex-col gap-6">
        <DeclSection title="Company information">
          <DeclRow primary={b?.name ?? ""} secondary={[b?.regType && b.regNumber ? `${b.regType}-${b.regNumber}` : b?.regNumber, countryInfo(s.country)?.name].filter(Boolean).join(" · ")} />
        </DeclSection>
        <DeclSection title={`Beneficial owners (${threshold}% or more)`}>
          {ubos.length ? (
            ubos.map((p) => {
              const via = all.find((x) => x.id === p.parentId);
              return (
                <DeclRow
                  key={p.id}
                  primary={`${fullName(p)} · ${effectiveOwnership(p, all)}%${via ? ` through ${fullName(via)}` : ""}`}
                  secondary={personLine(p)}
                />
              );
            })
          ) : (
            <p className="text-[13px] leading-[19px] font-medium text-fg-2">No individual owns {threshold}% or more.</p>
          )}
        </DeclSection>
        {controllers.length > 0 && (
          <DeclSection title="Significant management control">
            {controllers.map((p) => (
              <DeclRow key={p.id} primary={`${fullName(p)} · ${p.position}`} secondary={personLine(p)} />
            ))}
          </DeclSection>
        )}
        {companies.length > 0 && (
          <DeclSection title="Companies that own shares">
            {companies.map((c) => (
              <DeclRow key={c.id} primary={`${fullName(c)} · ${c.ownership}%`} secondary={[c.regNumber, nationalityName(c.regCountry)].filter(Boolean).join(" · ")} />
            ))}
          </DeclSection>
        )}
        <DeclSection title="Directors">
          {directors.map((p) => (
            <DeclRow key={p.id} primary={fullName(p)} secondary={`${p.position} · ${p.email}`} />
          ))}
        </DeclSection>
        <DeclSection title="Authorised signatories">
          {signatories.map((p) => (
            <DeclRow key={p.id} primary={fullName(p)} secondary={`${p.position} · ${p.email}`} />
          ))}
        </DeclSection>
        <DeclSection title="Statement of accuracy and compliance">
          <div className="flex flex-col gap-2 rounded-[12px] bg-subtle px-3 py-3 text-[13px] leading-[19px] font-medium text-fg-2">
            <p>
              I hereby declare that the information provided above is accurate, complete, and up-to-date to the best of my knowledge. I understand that failure to
              disclose accurate Director and UBO details may result in regulatory and/or operational consequences.
            </p>
            <p>
              Furthermore, I confirm that the Company complies with all applicable Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) regulations.
              Any changes to the UBO structure will be communicated to Foren promptly.
            </p>
          </div>
        </DeclSection>
        <DeclSection title="Authorised representative">
          <DeclRow
            primary={[by.name, by.position].filter(Boolean).join(" · ")}
            secondary={[by.email, by.phone, formatDate(by.confirmedAt)].filter(Boolean).join(" · ")}
          />
        </DeclSection>

        {readOnly ? (
          <Note intent="success">
            Confirmed by {by.name} on {formatDate(by.confirmedAt)}.
          </Note>
        ) : (
          <>
            <div>
              <ForenCheckbox
                checked={agreed}
                onCheckedChange={(c) => setAgreed(c === true)}
                label={`I confirm this declaration on behalf of ${b?.name ?? "the business"}`}
                description="Ticking this box takes the place of a signature."
              />
              {tried && !agreed && (
                <p role="alert" className="mt-2 pl-8 text-[12px] leading-[18px] font-medium text-error">
                  Tick the box to confirm the declaration
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-line pt-5">
              <ForenButton type="button" variant="outline" size="sm" onClick={onClose}>
                Back to edit
              </ForenButton>
              <ForenButton
                type="button"
                size="sm"
                onClick={() => {
                  setTried(true);
                  if (agreed) onConfirm();
                }}
              >
                Confirm and send invitations
              </ForenButton>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function DeclSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <GroupLabel className="mb-2">{title}</GroupLabel>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function DeclRow({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="rounded-[12px] border border-line px-3 py-2.5">
      <p className="text-[13px] leading-[19px] font-semibold text-fg">{primary}</p>
      {secondary && <p className="text-[12px] leading-[18px] font-medium break-words text-fg-2">{secondary}</p>}
    </div>
  );
}

export function SentDialog({ open, people, onDone }: { open: boolean; people: Stakeholder[]; onDone: () => void }) {
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onDone()}
      title={
        <span className="flex flex-col items-center gap-3 pl-10 text-center">
          <Image src={asset("/onboarding/envelope.png")} alt="" width={104} height={104} />
          <span className="font-display text-[22px] leading-[30px] [font-synthesis:none]">Verification emails sent</span>
        </span>
      }
      className="sm:max-w-[460px]"
    >
      <p className="-mt-3 mb-5 text-center text-[13px] leading-[19px] font-medium text-fg-2">
        We’ve emailed everyone. You can also copy their links to share privately.
      </p>
      <GroupLabel>Stakeholders ({people.length})</GroupLabel>
      <ul className="mb-6 flex flex-col gap-2">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-[14px] border border-line px-3 py-2.5">
            <PersonAvatar person={p} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] leading-[19px] font-semibold text-fg">{fullName(p)}</p>
              <p className="text-[12px] leading-[18px] font-medium text-fg-2">{roleLine(p)}</p>
            </div>
            <CopyLink person={p} />
          </li>
        ))}
      </ul>
      <ForenButton size="md" className="w-full" onClick={onDone}>
        Done
      </ForenButton>
    </Modal>
  );
}

export function CopyLink({ person }: { person: Stakeholder }) {
  return (
    <ForenButton
      variant="outline"
      size="xxs"
      className="shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(verificationLink(person));
        } catch {
          // Clipboard can be blocked (e.g. insecure context); the toast still confirms the action in the prototype.
        }
        toast.success(`Link for ${person.firstName} copied`);
      }}
    >
      Copy link
    </ForenButton>
  );
}
