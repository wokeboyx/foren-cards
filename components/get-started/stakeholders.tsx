"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { BuildingsIcon, DotsThreeVerticalBoldIcon, PencilSimpleIcon, PlusBoldIcon, PlusIcon, ShieldCheckFillIcon, TrashIcon, UsersThreeFillIcon, XIcon } from "@/components/icons";
import { toast } from "sonner";
import { ConfirmDialog, Modal } from "@/components/overlay";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenBadge } from "@/components/ui/foren-badge";
import { LinkButton } from "@/components/link-button";
import { formatDate } from "@/components/onboarding/shared";
import { countryInfo, hasStakeholders, sumPct, uboThreshold } from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { effectiveOwnership, peopleOf, registryStakeholders, useOnboarding, type Stakeholder } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { DECLARATION_HREF, stakeholderProblems, type Problem } from "./declaration";
import { stakeholderHref } from "./stakeholder-form";
import { GroupLabel, Note, PersonAvatar, SetupColumn, SetupHeader, cardCls, fullName, roleLine, rowButtonCls, verificationLink } from "./shared";

/** Past the intro in this visit, so coming back from the add/edit page doesn't show it again. */
let startedThisVisit = false;

export function StakeholdersPage() {
  const s = useOnboarding();
  const [started, setStarted] = React.useState(startedThisVisit);

  if (!s.signedUpAt || !s.country || !s.entity)
    return (
      <SetupColumn>
        <SetupHeader title="Stakeholders" description="Finish sign-up first." back="/get-started" />
      </SetupColumn>
    );
  if (!hasStakeholders(s.entity, s.category))
    return (
      <SetupColumn>
        <SetupHeader
          back="/get-started"
          title="No stakeholders needed"
          description="As a sole trader, you’re the only owner. You verified your identity when you signed up."
        />
      </SetupColumn>
    );

  // Once the declaration is confirmed the list is locked, so this page becomes the "Invitations sent" screen.
  if (s.stakeholdersSubmitted) return <InvitationsSent />;
  if (!started && s.stakeholders.length === 0)
    return (
      <Intro
        threshold={uboThreshold(s.country, s.entity, s.category)!}
        partnership={s.category === "partnership"}
        onStart={() => {
          if (s.business?.source === "registry") s.set({ stakeholders: registryStakeholders() });
          startedThisVisit = true;
          setStarted(true);
        }}
      />
    );
  return <Controllers />;
}

function Intro({ threshold, partnership, onStart }: { threshold: number; partnership: boolean; onStart: () => void }) {
  const router = useRouter();
  return (
    <SetupColumn>
      <SetupHeader
        title={partnership ? "Partners" : "Corporate structure"}
        description={
          partnership
            ? "Add every partner with their share of the business, and anyone else who can sign for it."
            : `Add details for all company directors, ultimate beneficial owners (UBOs) holding ${threshold}% or more, and authorised signatories.`
        }
      />
      <div className="mb-8 flex justify-center">
        <Image src={asset("/onboarding/folder.png")} alt="" width={194} height={194} priority />
      </div>
      <Note intent="info" title="Why we ask this">
        Financial regulations require us to identify anyone with significant control over the business. This helps keep global transfers secure.
      </Note>
      <ul className="mt-4 flex flex-col gap-2">
        <li className={introItemCls}>
          <UsersThreeFillIcon className="size-4 shrink-0 text-[#0052b4]" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">{partnership ? "Add your partners" : "Add directors, owners and signatories"}</p>
            <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">
              {partnership ? "Mark each partner as a shareholder with their share." : `Include anyone who is a director, owns ${threshold}% or more, or can sign for the company.`}
            </p>
          </div>
        </li>
        <li className={introItemCls}>
          <ShieldCheckFillIcon className="size-4 shrink-0 text-[#dc4ad8]" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">They verify their identity</p>
            <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">Each person gets an email link to upload their ID and proof of address, and take a quick selfie.</p>
          </div>
        </li>
      </ul>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
        <ForenButton variant="outline" size="md" className="flex-1 text-fg-2" onClick={() => router.push("/get-started")}>
          Skip for now
        </ForenButton>
        <ForenButton size="md" className="flex-1" onClick={onStart}>
          Get started
        </ForenButton>
      </div>
    </SetupColumn>
  );
}

/** Figma intro rows: sunken cards (12px / 16px padding, 16px radius) with a 16px icon. */
const introItemCls = "flex items-center gap-3 rounded-[16px] bg-sunken px-3 py-4";

function Controllers() {
  const s = useOnboarding();
  const router = useRouter();
  const country = s.country!;
  const entity = s.entity!;
  const threshold = uboThreshold(country, entity, s.category)!;
  const registry = countryInfo(country)?.registry ?? "registry";

  const [removing, setRemoving] = React.useState<Stakeholder | null>(null);
  const [tried, setTried] = React.useState(false);

  const all = s.stakeholders;
  const people = peopleOf(all);
  const top = all.filter((p) => !p.parentId);
  const fromRegistry = top.filter((p) => p.source === "registry");
  const added = top.filter((p) => p.source === "added");
  const total = sumPct(top.filter((p) => p.shareholder || p.kind === "company").map((p) => p.ownership));
  const missingOwnership = all.filter((p) => (p.shareholder || p.kind === "company" || p.parentId) && !p.ownership);
  const kra = country === "KE";
  const problems = stakeholderProblems(s);

  // Checks first, then the declaration page, built from this list. Confirming it there sends the invitations.
  const review = () => {
    setTried(true);
    if (problems.length) return;
    router.push(DECLARATION_HREF);
  };
  const showProblems = tried && problems.length > 0;

  const list = (items: Stakeholder[]) => (
    <PeopleList
      items={items}
      all={all}
      threshold={threshold}
      kra={kra}
      onRemove={setRemoving}
    />
  );

  return (
    <SetupColumn>
      <SetupHeader
        back="/get-started"
        title={s.category === "partnership" ? "Add your partners" : "Add key business controllers"}
        description={
          s.category === "partnership"
            ? "List every partner as a shareholder with their share, and anyone else who can sign for the business."
            : `List everyone who is a director, owns ${threshold}% or more (directly or through another company), or can sign for the business.`
        }
      />

      <div className="mb-6 flex flex-col sm:flex-row sm:gap-3">
        <AddButton href={stakeholderHref({ kind: "person" })}>Add a person</AddButton>
        <AddButton href={stakeholderHref({ kind: "company" })}>Add a company that owns shares</AddButton>
      </div>

      {added.length > 0 && (
        <section className="mb-6">
          <GroupLabel>Newly added stakeholders</GroupLabel>
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
        <div className="mb-6" aria-live="polite">
          {total === 100 ? (
            <Note intent="success">Total ownership: 100% — perfectly allocated</Note>
          ) : total > 100 ? (
            <Note intent="error">
              Total allocated: {total}% — {total - 100}% too much
            </Note>
          ) : (
            <Note intent="warning">
              Total allocated: {total}% — remaining {sumPct([100, -total])}% unassigned. That’s fine if the rest is held by people who own less than {threshold}%.
            </Note>
          )}
        </div>
      )}

      {people.length > 0 && (
        <div className={cn(cardCls, "mb-3 rounded-[20px]")}>
          <ForenCheckbox
            checked={s.noMajorOwner}
            onCheckedChange={(c) => s.set({ noMajorOwner: c === true })}
            label={`No individual owns ${threshold}% or more`}
            description="Then add the person with significant management control, such as the CEO or managing director, and tick “Has significant control” for them."
          />
        </div>
      )}

      <Note intent="info" className="mb-10">
        Each person gets a unique link to verify their ID, upload proof of address and take a liveness check. Links expire in 72 hours, so ask them to finish
        before then. Companies don’t get a link: their owners do.
      </Note>
      <ForenButton size="md" className="w-full" onClick={review}>
        Review declaration
      </ForenButton>
      <ProblemsDialog open={showProblems} problems={problems} onClose={() => setTried(false)} />

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

    </SetupColumn>
  );
}

/** Figma "Add new stakeholder": a 32px dashed circle with a plus, on the page background. */
function AddButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[24px] px-3 py-4 text-left text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full border-[0.762px] border-dashed border-line-2 text-fg-2">
        <PlusBoldIcon className="size-4" aria-hidden />
      </span>
      {children}
    </Link>
  );
}

/** Figma "Error Stakeholder": a red X, the problem and an Okay button. Several problems are listed together. */
function ProblemsDialog({ open, problems, onClose }: { open: boolean; problems: Problem[]; onClose: () => void }) {
  const one = problems.length === 1;
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={
        <span className="flex flex-col items-center gap-4 pl-10 text-center">
          <XIcon className="size-10 text-error" aria-hidden />
          <span className="text-[16px] leading-[24px] font-medium tracking-[0.015em]">{one ? problems[0].title : `${problems.length} things to fix`}</span>
        </span>
      }
      className="sm:max-w-[373px] sm:rounded-[32px]"
    >
      <div className="-mt-3 flex flex-col gap-8">
        {one ? (
          <p className="text-center text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{problems[0].body}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {problems.map((p) => (
              <li key={p.title} className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">
                <span className="block text-[14px] leading-[21px] text-fg">{p.title}</span>
                {p.body}
              </li>
            ))}
          </ul>
        )}
        <ForenButton size="lg" className="w-full" onClick={onClose}>
          Okay
        </ForenButton>
      </div>
    </Modal>
  );
}

/** What's still missing on a row, if anything. */
function missingOf(p: Stakeholder, all: Stakeholder[], threshold: number, kra: boolean): string | null {
  if ((p.shareholder || p.kind === "company" || p.parentId) && !p.ownership) return "Ownership percentage missing and required for shareholders.";
  if (p.kind === "company") return null;
  if (!p.nationality) return "Nationality missing.";
  if (kra && !p.kraPin) return "KRA PIN missing.";
  if ((effectiveOwnership(p, all) >= threshold || p.controller) && !p.control.length) return "Nature of control missing.";
  return null;
}

function PeopleList({
  items,
  all,
  threshold,
  kra,
  onRemove,
}: {
  items: Stakeholder[];
  all: Stakeholder[];
  threshold: number;
  /** Kenya: everyone needs a KRA PIN. */
  kra: boolean;
  onRemove: (p: Stakeholder) => void;
}) {
  const row = (p: Stakeholder, nested: boolean) => {
    const missing = missingOf(p, all, threshold, kra);
    const parent = all.find((x) => x.id === p.parentId);
    const line =
      p.kind === "company"
        ? `Company · ${p.ownership}% Ownership`
        : parent
          ? `Owns ${p.ownership}% of ${fullName(parent)} · ${effectiveOwnership(p, all)}% of this business`
          : roleLine(p);
    return (
      <div className={cn(cardCls, "flex items-center gap-3", nested && "ml-6 sm:ml-10")}>
        {p.kind === "company" ? (
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle text-fg-2">
            <BuildingsIcon className="size-[18px]" />
          </span>
        ) : (
          <PersonAvatar person={p} />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-fg">{fullName(p)}</p>
          {missing ? (
            <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-error">{missing}</p>
          ) : (
            <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{line}</p>
          )}
        </div>
        <RowMenu person={p} onRemove={() => onRemove(p)} />
      </div>
    );
  };
  return (
    <ul className="flex flex-col gap-4">
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
              <Link
                href={stakeholderHref({ kind: "person", parent: p.id })}
                className="ml-6 flex h-10 w-fit items-center gap-2 rounded-[12px] px-2 text-[13px] font-medium text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus sm:ml-10"
              >
                <PlusIcon className="size-4 text-fg-2" aria-hidden />
                Add a person who owns {fullName(p)}
              </Link>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function RowMenu({ person, onRemove }: { person: Stakeholder; onRemove: () => void }) {
  const [open, setOpen] = React.useState(false);
  const item =
    "flex h-9 w-full items-center gap-2 rounded-[10px] px-2.5 text-left text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus [&_svg]:size-4";
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${fullName(person)}`}
          className="grid size-8 shrink-0 place-items-center rounded-[8px] border border-line bg-sunken text-fg-2 shadow-[0_2px_4px_-1px_rgba(36,28,21,0.08)] outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
        >
          <DotsThreeVerticalBoldIcon className="size-4" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-[150px] rounded-[14px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
        >
          <Link href={stakeholderHref({ id: person.id })} className={cn(item, "text-fg hover:bg-subtle")} onClick={() => setOpen(false)}>
            <PencilSimpleIcon aria-hidden />
            Edit
          </Link>
          <button
            type="button"
            className={cn(item, "text-error hover:bg-error-subtle")}
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            <TrashIcon aria-hidden />
            Delete
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * After the declaration is confirmed: a full-page success state in place of the old "Verification emails sent"
 * dialog (Figma "Email sent") and the confirmation card. It leads with the envelope and who confirmed it,
 * says what happens next, lists who was emailed (with their link to share privately) and offers the next moves.
 * The editable list isn't shown: it's locked now, and the full structure lives on the declaration page.
 */
function InvitationsSent() {
  const s = useOnboarding();
  const people = peopleOf(s.stakeholders);
  const done = people.length > 0 && people.every((p) => p.status === "verified");
  const by = s.declaration;
  const confirmed = by ? `${by.name} confirmed the declaration on ${formatDate(by.confirmedAt)}.` : "The declaration is confirmed.";

  return (
    <SetupColumn>
      <SetupHeader
        back="/get-started"
        center
        media={<Image src={asset("/onboarding/envelope.png")} alt="" width={150} height={150} priority className="size-[120px] sm:size-[150px]" />}
        title={done ? "Everyone’s verified" : "Invitations sent"}
        description={
          done ? (
            <>
              {confirmed} All {people.length} stakeholders have verified their identity.
            </>
          ) : (
            <>
              {confirmed} We’ve emailed {people.length === 1 ? "1 person" : `${people.length} people`} a link to verify their identity.
            </>
          )
        }
      />

      {!done && (
        <section aria-labelledby="next-steps" className="mb-6 rounded-[20px] border-[0.7px] border-line bg-surface px-4 py-5 sm:px-5">
          <h2 id="next-steps" className="mb-4 text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-fg">
            What happens next
          </h2>
          <ol className="flex flex-col gap-4">
            {NEXT_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-[12px] leading-none font-semibold text-fg tabular-nums"
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">{step.title}</p>
                  <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="emailed" className="mb-8">
        <GroupLabel>
          <span id="emailed">Emailed ({people.length})</span>
        </GroupLabel>
        <ul className="flex flex-col gap-3">
          {people.map((p) => (
            <li key={p.id} className={cn(cardCls, "flex flex-wrap items-center gap-3")}>
              <PersonAvatar person={p} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="flex flex-wrap items-center gap-1 text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-fg">
                  <span className="truncate">{fullName(p)}</span>
                  <StatusBadge status={p.status} />
                </p>
                <p className="truncate text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{p.email || roleLine(p)}</p>
              </div>
              {p.status !== "verified" && p.status !== "rejected" && <CopyLink person={p} />}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3">
        <LinkButton href="/get-started/verification" size="md" className="w-full">
          Track verification
        </LinkButton>
        <LinkButton href={DECLARATION_HREF} variant="outline" size="md" className="w-full text-fg-2">
          View declaration
        </LinkButton>
        <LinkButton href="/get-started" variant="ghost" size="md" className="w-full text-fg-2">
          Back to setup
        </LinkButton>
      </div>
    </SetupColumn>
  );
}

const NEXT_STEPS = [
  { title: "Each person gets an email link", body: "It’s unique to them and expires in 72 hours. Copy it below to share it privately too." },
  { title: "They verify their ID and proof of address", body: "Plus a quick selfie. It takes about 5 minutes on their phone." },
  { title: "You track their progress", body: "See who’s done, and resend a link if someone needs to retry." },
];

function StatusBadge({ status }: { status: Stakeholder["status"] }) {
  const [color, label] = (
    {
      pending: ["orange", "Pending"],
      not_sent: ["gray", "Not sent"],
      verified: ["success", "Verified"],
      action_required: ["error", "Action required"],
      rejected: ["error", "Action required"],
    } as const
  )[status];
  return (
    <ForenBadge size="sm" color={color}>
      {label}
    </ForenBadge>
  );
}

export function CopyLink({ person }: { person: Stakeholder }) {
  return (
    <ForenButton
      variant="outline"
      size="xxs"
      className={cn("shrink-0", rowButtonCls)}
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
