"use client";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { RiAddLine, RiDeleteBinLine, RiMore2Fill, RiPencilLine, RiShieldCheckFill, RiUser3Fill } from "@remixicon/react";
import { toast } from "sonner";
import { ConfirmDialog, Modal } from "@/components/overlay";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenInput } from "@/components/ui/foren-input";
import { LinkButton } from "@/components/link-button";
import { countryInfo, minDirectors, uboThreshold } from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { registryStakeholders, useOnboarding, type Stakeholder } from "@/lib/onboarding-store";
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
        description={`Add details for all company directors and ultimate beneficial owners (UBOs) holding ${threshold}% or more.`}
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
            <p className="text-[14px] leading-[21px] font-medium text-fg">Add directors and major shareholders</p>
            <p className="text-[12px] leading-[18px] font-medium text-fg-2">
              Include anyone who is a director, owns {threshold}% or more, or can sign for the company.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <RiShieldCheckFill className="mt-0.5 size-4 shrink-0 text-[#c026d3]" aria-hidden />
          <div>
            <p className="text-[14px] leading-[21px] font-medium text-fg">They verify their identity</p>
            <p className="text-[12px] leading-[18px] font-medium text-fg-2">Each person gets an email link to upload their ID and take a quick selfie.</p>
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

function Controllers() {
  const s = useOnboarding();
  const router = useRouter();
  const country = s.country!;
  const entity = s.entity!;
  const threshold = uboThreshold(country, entity)!;
  const needDirectors = minDirectors(entity);
  const registry = countryInfo(country)?.registry ?? "registry";

  const [editing, setEditing] = React.useState<Stakeholder | "new" | null>(null);
  const [removing, setRemoving] = React.useState<Stakeholder | null>(null);
  const [sent, setSent] = React.useState(false);
  const [tried, setTried] = React.useState(false);

  const people = s.stakeholders;
  const fromRegistry = people.filter((p) => p.source === "registry");
  const added = people.filter((p) => p.source === "added");
  const total = people.filter((p) => p.shareholder).reduce((a, p) => a + p.ownership, 0);
  const directors = people.filter((p) => p.director).length;
  const missingOwnership = people.filter((p) => p.shareholder && !p.ownership);
  const locked = s.stakeholdersSubmitted;

  const problems: string[] = [];
  if (people.length === 0) problems.push("Add at least one person.");
  if (directors < needDirectors) problems.push(`Add at least ${needDirectors} directors. You have ${directors}.`);
  if (missingOwnership.length) problems.push(`Add the ownership percentage for ${missingOwnership.map(fullName).join(" and ")}.`);
  if (total > 100) problems.push(`Ownership adds up to ${total}%. It can’t be more than 100%.`);

  const confirm = () => {
    setTried(true);
    if (problems.length) return;
    const now = new Date().toISOString();
    s.set({
      stakeholdersSubmitted: true,
      invitesSentAt: now,
      stakeholders: people.map((p) => (p.status === "verified" ? p : { ...p, status: "pending" as const })),
    });
    setSent(true);
  };

  return (
    <SetupColumn>
      <SetupHeader
        back="/get-started"
        title="Add key business controllers"
        description={`List everyone who is a director, owns ${threshold}% or more, or can sign for the business.`}
      />

      {!locked && (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="mb-8 flex h-12 w-full items-center gap-3 rounded-[16px] px-2 text-left text-[14px] font-medium text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
        >
          <span className="grid size-7 place-items-center rounded-full border border-line-2 text-fg-2">
            <RiAddLine className="size-4" aria-hidden />
          </span>
          Add new stakeholder
        </button>
      )}
      {locked && (
        <Note intent="success" className="mb-8" title="Invitations sent">
          You can follow each person’s progress on the verification page.{" "}
          <LinkButton href="/get-started/verification" variant="link" size="xs" className="text-success underline">
            View verification
          </LinkButton>
        </Note>
      )}

      {added.length > 0 && (
        <section className="mb-6">
          <GroupLabel>Newly added</GroupLabel>
          <PeopleList people={added} locked={locked} onEdit={setEditing} onRemove={setRemoving} />
        </section>
      )}
      {fromRegistry.length > 0 && (
        <section className="mb-6">
          <GroupLabel>From {registry}</GroupLabel>
          <PeopleList people={fromRegistry} locked={locked} onEdit={setEditing} onRemove={setRemoving} />
        </section>
      )}

      {people.length > 0 && missingOwnership.length === 0 && (
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

      {!locked && (
        <>
          <Note intent="info" className="mb-6">
            Each person gets a unique link to verify their ID and take a liveness check
            {country === "NG" ? ", and to upload proof of address" : ""}. Links expire in 72 hours.
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
          <ForenButton size="md" className="w-full" onClick={confirm}>
            Confirm and send invitations
          </ForenButton>
        </>
      )}

      {editing && (
        <StakeholderDialog
          key={editing === "new" ? "new" : editing.id}
          person={editing === "new" ? null : editing}
          others={people.filter((p) => editing === "new" || p.id !== editing.id)}
          threshold={threshold}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            s.upsertStakeholder(p);
            setEditing(null);
            toast.success(editing === "new" ? `${fullName(p)} added` : "Changes saved");
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
            : "They won’t get a verification link."
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (removing) s.removeStakeholder(removing.id);
          setRemoving(null);
        }}
      />

      <SentDialog
        open={sent}
        people={s.stakeholders}
        onDone={() => {
          setSent(false);
          router.push("/get-started");
        }}
      />
    </SetupColumn>
  );
}

function PeopleList({
  people,
  locked,
  onEdit,
  onRemove,
}: {
  people: Stakeholder[];
  locked: boolean;
  onEdit: (p: Stakeholder) => void;
  onRemove: (p: Stakeholder) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {people.map((p) => {
        const missing = p.shareholder && !p.ownership;
        return (
          <li key={p.id} className="flex items-center gap-3 rounded-[16px] bg-surface px-4 py-3.5">
            <PersonAvatar person={p} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] leading-[21px] font-semibold text-fg">{fullName(p)}</p>
              {missing ? (
                <p className="text-[12px] leading-[18px] font-medium text-error">Ownership percentage missing. It’s required for shareholders.</p>
              ) : (
                <p className="truncate text-[12px] leading-[18px] font-medium text-fg-2">{roleLine(p)}</p>
              )}
            </div>
            {!locked && <RowMenu person={p} onEdit={() => onEdit(p)} onRemove={() => onRemove(p)} />}
          </li>
        );
      })}
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

function StakeholderDialog({
  person,
  others,
  threshold,
  onClose,
  onSave,
}: {
  person: Stakeholder | null;
  others: Stakeholder[];
  threshold: number;
  onClose: () => void;
  onSave: (p: Stakeholder) => void;
}) {
  const [v, setV] = React.useState({
    firstName: person?.firstName ?? "",
    lastName: person?.lastName ?? "",
    email: person?.email ?? "",
    position: person?.position ?? "",
    director: person?.director ?? false,
    shareholder: person?.shareholder ?? false,
    signatory: person?.signatory ?? false,
    ownership: person?.ownership ? String(person.ownership) : "",
  });
  const [tried, setTried] = React.useState(false);
  const upd = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }));

  const pct = Number(v.ownership);
  const othersTotal = others.filter((p) => p.shareholder).reduce((a, p) => a + p.ownership, 0);
  const errors: Partial<Record<keyof typeof v | "role", string>> = {};
  if (!v.firstName.trim()) errors.firstName = "Enter a first name";
  if (!v.lastName.trim()) errors.lastName = "Enter a last name";
  if (!EMAIL.test(v.email.trim())) errors.email = "Enter a valid email address";
  else if (others.some((p) => p.email.toLowerCase() === v.email.trim().toLowerCase())) errors.email = "Someone else already uses this email";
  if (!v.position.trim()) errors.position = "Enter their position, e.g. CEO";
  if (!v.director && !v.shareholder && !v.signatory) errors.role = "Choose at least one role";
  if (v.shareholder) {
    if (!v.ownership || !Number.isFinite(pct) || pct <= 0) errors.ownership = "Enter a percentage above 0";
    else if (pct > 100) errors.ownership = "Can’t be more than 100%";
    else if (othersTotal + pct > 100) errors.ownership = `Only ${Math.max(0, 100 - othersTotal)}% is left to assign`;
  }
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={person ? "Edit stakeholder details" : "Add stakeholder details"} className="sm:max-w-[480px]">
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (Object.keys(errors).length) return;
          onSave({
            id: person?.id ?? uid("sh"),
            firstName: v.firstName.trim(),
            lastName: v.lastName.trim(),
            email: v.email.trim(),
            position: v.position.trim(),
            director: v.director,
            shareholder: v.shareholder,
            signatory: v.signatory,
            ownership: v.shareholder ? pct : 0,
            source: person?.source ?? "added",
            status: person?.status ?? "not_sent",
          });
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <ForenInput
            label="First name"
            value={v.firstName}
            onChange={(e) => upd({ firstName: e.target.value })}
            error={show("firstName")}
            autoComplete="off"
          />
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
            onCheckedChange={(c) => upd({ shareholder: c === true })}
            label="A shareholder"
            description={`Owns shares. Everyone with ${threshold}% or more must be listed.`}
          />
          {v.shareholder && (
            <div className="pl-8">
              <ForenInput
                label="Shareholding percentage"
                inputMode="decimal"
                value={v.ownership}
                onChange={(e) => upd({ ownership: e.target.value.replace(/[^\d.]/g, "") })}
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
          {show("role") && (
            <p id="role-error" role="alert" className="text-[12px] leading-[18px] font-medium text-error">
              {errors.role}
            </p>
          )}
        </fieldset>
        <div className="mt-1 grid grid-cols-2 gap-3 border-t border-line pt-5">
          <ForenButton type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </ForenButton>
          <ForenButton type="submit" size="sm">
            {person ? "Save changes" : "Add stakeholder"}
          </ForenButton>
        </div>
      </form>
    </Modal>
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
