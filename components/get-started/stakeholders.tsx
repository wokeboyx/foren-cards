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
import { LinkButton } from "@/components/link-button";
import { formatDate } from "@/components/onboarding/shared";
import { controlLabel, countryInfo, hasStakeholders, minDirectors, nationalityName, sumPct, uboThreshold } from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { effectiveOwnership, peopleOf, registryStakeholders, ubosOf, useOnboarding, type Stakeholder } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
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
  const needDirectors = minDirectors(entity);
  const registry = countryInfo(country)?.registry ?? "registry";

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
  const total = sumPct(top.filter((p) => p.shareholder || p.kind === "company").map((p) => p.ownership));
  const directors = people.filter((p) => p.director).length;
  const signatories = people.filter((p) => p.signatory).length;
  const missingOwnership = all.filter((p) => (p.shareholder || p.kind === "company" || p.parentId) && !p.ownership);
  const kra = country === "KE";
  const missingNationality = people.filter((p) => !p.nationality);
  const missingKra = kra ? people.filter((p) => !p.kraPin) : [];
  const missingControl = people.filter((p) => (ubos.includes(p) || p.controller) && !p.control.length);
  const locked = s.stakeholdersSubmitted;

  // Each problem has a short title and an explanation, shown in the Figma "Error Stakeholder" dialog.
  const problems: Problem[] = [];
  const add = (title: string, body: string) => problems.push({ title, body });
  if (people.length === 0) add("No stakeholders added", "Add at least one person.");
  if (directors < needDirectors) add("Not enough directors", `Add at least ${needDirectors} directors. You have ${directors}.`);
  if (people.length && signatories === 0) add("No authorised signatory", "Add at least one authorised signatory.");
  if (missingOwnership.length) add("Ownership percentage missing", `Set an ownership percentage for ${missingOwnership.map(fullName).join(" and ")}.`);
  if (missingNationality.length) add("Nationality missing", `Add the nationality for ${missingNationality.map(fullName).join(" and ")}.`);
  if (missingKra.length) add("KRA PIN missing", `Add the KRA PIN for ${missingKra.map(fullName).join(" and ")}.`);
  if (missingControl.length) add("Nature of control missing", `Add the nature of control for ${missingControl.map(fullName).join(" and ")}.`);
  if (total > 100) add(`Total ownership is ${total}%`, `Current allocated total is ${total}%. Adjust shareholder percentages so it’s no more than 100%.`);
  for (const c of companies) {
    const owners = all.filter((p) => p.parentId === c.id);
    const held = sumPct(owners.map((p) => p.ownership));
    if (c.ownership >= threshold && owners.length === 0) add("Company owners missing", `Add the people who own ${fullName(c)}.`);
    if (held > 100) add(`Owners of ${fullName(c)} add up to ${held}%`, "Adjust their percentages so they’re no more than 100%.");
  }
  if (people.length && !ubos.length && !s.noMajorOwner)
    add(`No individual owns ${threshold}% or more`, "Tick “No individual owns " + threshold + "% or more” and add the person with significant control.");
  if (s.noMajorOwner && ubos.length) add(`Someone owns ${threshold}% or more`, `${ubos.map(fullName).join(" and ")} own ${threshold}% or more. Untick “No individual owns ${threshold}% or more”.`);
  if (s.noMajorOwner && !ubos.length && !controllers.length) add("Significant control missing", "Add the person with significant control, and tick “Has significant control” for them.");

  // Checks first, then the declaration, built from this list. Confirming it sends the invitations.
  const review = () => {
    setTried(true);
    if (problems.length) return;
    setDeclaring(true);
  };
  const showProblems = tried && problems.length > 0;
  const confirm = () => {
    const now = new Date().toISOString();
    setDeclaring(false);
    s.set({
      stakeholdersSubmitted: true,
      declaration: { confirmedAt: now, name: `${s.firstName} ${s.lastName}`.trim(), email: s.email, position: s.position, phone: s.phone },
      invitesSentAt: now,
      stakeholders: all.map((p) => (p.kind === "company" || p.status === "verified" || p.status === "rejected" ? p : { ...p, status: "pending" as const })),
    });
    setSent(true);
  };

  const list = (items: Stakeholder[]) => (
    <PeopleList
      items={items}
      all={all}
      threshold={threshold}
      kra={kra}
      locked={locked}
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

      {!locked && (
        <div className="mb-6 flex flex-col sm:flex-row sm:gap-3">
          <AddButton href={stakeholderHref({ kind: "person" })}>Add a person</AddButton>
          <AddButton href={stakeholderHref({ kind: "company" })}>Add a company that owns shares</AddButton>
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
            disabled={locked}
            onCheckedChange={(c) => s.set({ noMajorOwner: c === true })}
            label={`No individual owns ${threshold}% or more`}
            description="Then add the person with significant management control, such as the CEO or managing director, and tick “Has significant control” for them."
          />
        </div>
      )}

      {!locked && (
        <>
          <Note intent="info" className="mb-10">
            Each person gets a unique link to verify their ID, upload proof of address and take a liveness check. Links expire in 72 hours, so ask them to
            finish before then. Companies don’t get a link: their owners do.
          </Note>
          <ForenButton size="md" className="w-full" onClick={review}>
            Review declaration
          </ForenButton>
          <ProblemsDialog open={showProblems} problems={problems} onClose={() => setTried(false)} />
        </>
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

type Problem = { title: string; body: string };

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
  locked,
  onRemove,
}: {
  items: Stakeholder[];
  all: Stakeholder[];
  threshold: number;
  /** Kenya: everyone needs a KRA PIN. */
  kra: boolean;
  locked: boolean;
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
        {!locked && <RowMenu person={p} onRemove={() => onRemove(p)} />}
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
              {!locked && (
                <Link
                  href={stakeholderHref({ kind: "person", parent: p.id })}
                  className="ml-6 flex h-10 w-fit items-center gap-2 rounded-[12px] px-2 text-[13px] font-medium text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus sm:ml-10"
                >
                  <PlusIcon className="size-4 text-fg-2" aria-hidden />
                  Add a person who owns {fullName(p)}
                </Link>
              )}
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

/** Figma dialog titles are Megafield 20/30; the shared Modal title is Inter, so set it here. */
function DialogTitle({ children }: { children: React.ReactNode }) {
  return <span className="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.015em] [font-synthesis:none]">{children}</span>;
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
  const personLine = (p: Stakeholder) =>
    [nationalityName(p.nationality), p.kraPin && `KRA PIN ${p.kraPin}`, controlLabel(p.control, p.controlOther)].filter(Boolean).join(" · ");

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={<DialogTitle>Director and UBO declaration</DialogTitle>}
      description={readOnly ? undefined : "We filled this in from your details. Check it, then confirm it on behalf of the business."}
      className="sm:max-w-[560px] sm:rounded-[32px]"
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
            <div className="-mx-6 grid grid-cols-2 gap-3 border-t border-line px-6 pt-4">
              <ForenButton type="button" variant="outline" size="md" className="text-fg-2" onClick={onClose}>
                Back to edit
              </ForenButton>
              <ForenButton
                type="button"
                size="md"
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
    <div className="rounded-[16px] border-[0.7px] border-line px-3 py-2.5">
      <p className="text-[13px] leading-[19px] font-semibold text-fg">{primary}</p>
      {secondary && <p className="text-[12px] leading-[18px] font-medium break-words text-fg-2">{secondary}</p>}
    </div>
  );
}

/** Figma "Email sent": 529px dialog, 150px envelope, Megafield title, stakeholder cards and a full-width Okay. */
export function SentDialog({ open, people, onDone }: { open: boolean; people: Stakeholder[]; onDone: () => void }) {
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onDone()}
      title={
        <span className="flex flex-col items-center gap-6 pl-10 text-center">
          <Image src={asset("/onboarding/envelope.png")} alt="" width={150} height={150} />
          <DialogTitle>Verification emails sent</DialogTitle>
        </span>
      }
      className="sm:max-w-[529px] sm:rounded-[32px] sm:px-4"
    >
      <p className="mx-auto -mt-3 mb-8 max-w-[393px] text-center text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg-2">
        We’ve emailed all stakeholders. You can also copy their verification links to share privately.
      </p>
      <GroupLabel>Stakeholders ({people.length})</GroupLabel>
      <ul className="mb-8 flex flex-col gap-4">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-[24px] border-[0.7px] border-line px-3 py-4">
            <PersonAvatar person={p} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-fg">{fullName(p)}</p>
              <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{roleLine(p)}</p>
            </div>
            <CopyLink person={p} />
          </li>
        ))}
      </ul>
      <div className="-mx-4 border-t border-line px-4 pt-4">
        <ForenButton size="md" className="w-full" onClick={onDone}>
          Okay
        </ForenButton>
      </div>
    </Modal>
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
