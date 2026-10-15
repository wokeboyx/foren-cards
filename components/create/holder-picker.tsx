"use client";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { RiAddLine, RiArrowDownSLine, RiBuilding2Line, RiCheckLine, RiMailSendLine, RiSearchLine, RiUser3Line } from "@remixicon/react";
import { toast } from "sonner";
import { ForenAvatar } from "@/components/ui/foren-avatar";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenInput } from "@/components/ui/foren-input";
import type { Card, Person } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { invitePerson } from "@/lib/actions";
import { useAction } from "@/lib/api";
import { allPeople, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChoiceCard } from "./choice-card";

const ROLE: Record<Person["role"], string> = { owner: "Account owner", cardholder: "Team member", finance: "Finance lead" };
const MAX_CONTACTS = 5;
const initials = (n: string) => n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

/**
 * "Who's it for?" — a team member's card (in their name) or a company card (in the company's name,
 * Revolut's "virtual company card"), plus adding someone who isn't on Foren yet.
 */
export function HolderPicker({
  card,
  onChange,
  error,
  disabled,
  hideTitle,
}: {
  card: Pick<Card, "holderId" | "companyCard" | "contactIds">;
  onChange: (patch: Partial<Card>) => void;
  error?: string;
  disabled?: boolean;
  /** The step heading already asks "Who's this card for?" */
  hideTitle?: boolean;
}) {
  useStore((s) => s.invitedPeople); // re-render when someone is invited
  const people = allPeople();
  const company = !!card.companyCard;
  const [inviting, setInviting] = React.useState(false);
  const contacts = card.contactIds ?? (card.holderId ? [card.holderId] : []);

  const toggleContact = (id: string) => {
    const next = contacts.includes(id) ? contacts.filter((x) => x !== id) : contacts.length >= MAX_CONTACTS ? contacts : [...contacts, id];
    onChange({ contactIds: next, holderId: next[0] ?? "" });
  };

  return (
    <div className="space-y-4">
      <fieldset disabled={disabled}>
        <legend className={hideTitle ? "sr-only" : "mb-2 text-[14px] font-medium text-fg"}>Who’s it for?</legend>
        <div className="grid gap-2">
          <ChoiceCard
            name="card-for"
            value="member"
            checked={!company}
            onChange={() => onChange({ companyCard: false, contactIds: undefined, holderId: contacts[0] ?? "" })}
            icon={<RiUser3Line />}
            title="A team member"
            description="Issued in their name. Best for travel and day-to-day spending."
            disabled={disabled}
          />
          <ChoiceCard
            name="card-for"
            value="company"
            checked={company}
            onChange={() => onChange({ companyCard: true, contactIds: card.holderId ? [card.holderId] : [], holderId: card.holderId })}
            icon={<RiBuilding2Line />}
            title="The company"
            description={`Issued in ${COMPANY.name}’s name. Best for subscriptions and suppliers.`}
            disabled={disabled}
          />
        </div>
      </fieldset>

      <div>
        <div id="people-label" className="text-[14px] font-medium text-fg">
          {company ? "Who can use and manage it?" : "Who will use it?"}
        </div>
        <p className="mt-0.5 mb-2 text-[13px] text-fg-3">
          {company ? `Up to ${MAX_CONTACTS} people. They can see the card’s details and transactions. The card shows the company name.` : "The card is issued in this person’s name. Only they and the account owner can see its full details."}
        </p>
        <PersonSelect
          people={people}
          multiple={company}
          selected={company ? contacts : card.holderId ? [card.holderId] : []}
          onPick={(id) => (company ? toggleContact(id) : onChange({ holderId: id }))}
          onAddNew={() => setInviting(true)}
          disabled={disabled}
          invalid={!!error}
          max={MAX_CONTACTS}
        />
        {error && (
          <p id="holder-err" className="mt-1.5 text-[12px] text-error">
            {error}
          </p>
        )}
        {!disabled && inviting && (
          <InviteSomeone
            onClose={() => setInviting(false)}
            onAdded={(p) => {
              if (company) toggleContact(p.id);
              else onChange({ holderId: p.id });
              setInviting(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function InviteSomeone({ onAdded, onClose }: { onAdded: (p: Person) => void; onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [err, setErr] = React.useState<{ name?: string; email?: string }>({});
  const invite = useAction(invitePerson);

  return (
    <div className="mt-3 space-y-3 rounded-[16px] bg-subtle p-4">
      <div className="flex items-start gap-2.5 text-[13px] leading-[18px] text-fg-2">
        <RiMailSendLine className="mt-0.5 size-4 shrink-0 text-fg" aria-hidden />
        We’ll email them an invite to join {COMPANY.name} on Foren. Their card is created now and they can use it once they’ve joined.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ForenInput label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={err.name} placeholder="e.g. Bisi Adewale" autoComplete="off" />
        <ForenInput label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err.email} placeholder="bisi@company.com" autoComplete="off" />
      </div>
      {invite.error && <p role="alert" className="text-[13px] text-error">We couldn’t send the invite. Try again.</p>}
      <div className="flex justify-end gap-2">
        <ForenButton type="button" size="xs" variant="ghost" onClick={onClose}>
          Cancel
        </ForenButton>
        <ForenButton
          type="button"
          size="xs"
          disabled={invite.pending}
          onClick={async () => {
            const e: typeof err = {};
            if (name.trim().split(/\s+/).length < 2) e.name = "Enter their first and last name.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email address.";
            if (allPeople().some((p) => p.email.toLowerCase() === email.trim().toLowerCase())) e.email = "This person is already on the list.";
            setErr(e);
            if (e.name || e.email) return;
            const r = await invite.run(name.trim(), email.trim());
            if (r.ok) {
              toast(`${name.trim()} added. We’ve emailed ${email.trim()} an invite.`);
              onAdded(r.value);
            }
          }}
        >
          {invite.pending ? "Adding…" : "Add and select"}
        </ForenButton>
      </div>
    </div>
  );
}

/**
 * Searchable people dropdown (scales to large teams). Single choice for a team member's card,
 * multi-select (up to `max`) for a company card. "Add someone who isn't on Foren" lives in the list.
 */
function PersonSelect({
  people,
  multiple,
  selected,
  onPick,
  onAddNew,
  disabled,
  invalid,
  max,
}: {
  people: Person[];
  multiple: boolean;
  selected: string[];
  onPick: (id: string) => void;
  onAddNew: () => void;
  disabled?: boolean;
  invalid?: boolean;
  max: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const listId = React.useId();
  const chosen = selected.map((id) => people.find((p) => p.id === id)).filter(Boolean) as Person[];
  const shown = people.filter((p) => !q.trim() || `${p.name} ${p.email}`.toLowerCase().includes(q.trim().toLowerCase()));
  const full = multiple && selected.length >= max;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQ("");
      }}
    >
      <Popover.Trigger
        disabled={disabled}
        aria-labelledby="people-label"
        aria-invalid={invalid}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "flex min-h-12 w-full items-center gap-2.5 rounded-[16px] border bg-subtle py-2 pr-10 pl-3 text-left text-[14px] outline-none focus-visible:border-focus focus-visible:bg-surface disabled:cursor-not-allowed disabled:opacity-60 relative",
          invalid ? "border-error bg-surface" : "border-transparent"
        )}
      >
        {chosen.length === 0 ? (
          <span className="text-fg-3">{multiple ? "Choose people" : "Choose a team member"}</span>
        ) : multiple ? (
          <span className="flex flex-wrap gap-1.5">
            {chosen.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-surface py-0.5 pr-2.5 pl-0.5 text-[13px] font-medium text-fg ring-1 ring-line">
                <ForenAvatar size="xs" name={p.name} initials={initials(p.name)} fallback="initials" />
                {p.name}
              </span>
            ))}
          </span>
        ) : (
          <>
            <ForenAvatar size="sm" name={chosen[0].name} initials={initials(chosen[0].name)} fallback="initials" />
            <span className="min-w-0">
              <span className="block truncate font-medium text-fg">
                {chosen[0].name}
                {chosen[0].invited && <span className="ml-2 rounded-full bg-warning-subtle px-2 py-0.5 text-[11px] font-semibold text-warning">Invite pending</span>}
              </span>
              <span className="block truncate text-[12px] text-fg-3">
                {ROLE[chosen[0].role]} · {chosen[0].email}
              </span>
            </span>
          </>
        )}
        <RiArrowDownSLine className={cn("absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-fg-3 transition-transform", open && "rotate-180")} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-50 w-[var(--radix-popover-trigger-width)] rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none">
          <div className="relative p-1">
            <RiSearchLine className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-3" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search people"
              className="h-10 w-full rounded-[12px] bg-subtle pr-3 pl-9 text-[14px] text-fg outline-none focus:ring-2 focus:ring-focus"
            />
          </div>
          <div id={listId} role="listbox" aria-multiselectable={multiple || undefined} aria-label="People" className="max-h-[280px] overflow-y-auto py-1">
            {shown.length === 0 && <p className="px-3 py-3 text-[13px] text-fg-3">No one matches “{q}”.</p>}
            {shown.map((p) => {
              const isOn = selected.includes(p.id);
              const blocked = full && !isOn;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={isOn}
                  aria-disabled={blocked || undefined}
                  onClick={() => {
                    if (blocked) return;
                    onPick(p.id);
                    if (!multiple) setOpen(false);
                  }}
                  className={cn("flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left outline-none hover:bg-subtle focus-visible:bg-subtle", blocked && "cursor-not-allowed opacity-50")}
                >
                  <ForenAvatar size="sm" name={p.name} initials={initials(p.name)} fallback="initials" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[14px] font-medium text-fg">
                      {p.name}
                      {p.invited && <span className="rounded-full bg-warning-subtle px-2 py-0.5 text-[11px] font-semibold text-warning">Invite pending</span>}
                    </span>
                    <span className="block truncate text-[12px] text-fg-3">
                      {ROLE[p.role]} · {p.email}
                    </span>
                  </span>
                  {isOn && <RiCheckLine className="size-[18px] shrink-0 text-success" aria-hidden />}
                </button>
              );
            })}
          </div>
          {multiple && <p className="px-3 pb-1 text-[12px] text-fg-3">{selected.length} of {max} selected</p>}
          <div className="border-t border-line p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddNew();
              }}
              className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[14px] font-semibold text-fg outline-none hover:bg-subtle focus-visible:bg-subtle"
            >
              <RiAddLine className="size-4" aria-hidden />
              Add someone who isn’t on Foren
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
