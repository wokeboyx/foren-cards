"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BuildingsIcon } from "@/components/icons";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { LinkButton } from "@/components/link-button";
import { formatDate } from "@/components/onboarding/shared";
import { controlLabel, countryInfo, hasStakeholders, minDirectors, nationalityName, sumPct, uboThreshold } from "@/domain/onboarding";
import { effectiveOwnership, peopleOf, ubosOf, useOnboarding, type OnboardingState, type Stakeholder } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { GroupLabel, Note, PersonAvatar, SetupColumn, SetupHeader, fullName } from "./shared";

const LIST = "/get-started/stakeholders";
export const DECLARATION_HREF = `${LIST}/declaration`;

export type Problem = { title: string; body: string };

/** Everything that stops the declaration being built from the stakeholder list. Shared by the list and the declaration page. */
export function stakeholderProblems(s: Pick<OnboardingState, "country" | "entity" | "category" | "stakeholders" | "noMajorOwner">): Problem[] {
  const threshold = uboThreshold(s.country!, s.entity!, s.category)!;
  const all = s.stakeholders;
  const people = peopleOf(all);
  const top = all.filter((p) => !p.parentId);
  const companies = all.filter((p) => p.kind === "company");
  const ubos = ubosOf(all, threshold);
  const controllers = people.filter((p) => p.controller);
  const total = sumPct(top.filter((p) => p.shareholder || p.kind === "company").map((p) => p.ownership));
  const needDirectors = minDirectors(s.entity!);
  const directors = people.filter((p) => p.director).length;
  const signatories = people.filter((p) => p.signatory).length;
  const missingOwnership = all.filter((p) => (p.shareholder || p.kind === "company" || p.parentId) && !p.ownership);
  const missingNationality = people.filter((p) => !p.nationality);
  const missingKra = s.country === "KE" ? people.filter((p) => !p.kraPin) : [];
  const missingControl = people.filter((p) => (ubos.includes(p) || p.controller) && !p.control.length);

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
  return problems;
}

/**
 * The Director and UBO self-declaration on its own page, digital only. Sections are filled in from sign-up
 * and the stakeholder list; the statement is confirmed with a tick instead of a signature. Once confirmed
 * it's read-only and shows who confirmed it and when.
 */
export function DeclarationPage() {
  const s = useOnboarding();
  const router = useRouter();
  const [agreed, setAgreed] = React.useState(false);
  const [tried, setTried] = React.useState(false);

  if (!s.signedUpAt || !s.country || !s.entity || !hasStakeholders(s.entity, s.category))
    return <Blocked title="Director and UBO declaration" intro="Finish sign-up first." problems={[]} />;

  const readOnly = s.stakeholdersSubmitted;
  if (!readOnly) {
    const problems = stakeholderProblems(s);
    if (problems.length)
      return (
        <Blocked
          title="Your declaration isn’t ready"
          intro={
            s.stakeholders.length
              ? "We build the declaration from your stakeholder list. Fix these first, then come back to confirm it."
              : "We build the declaration from your stakeholder list. Add your directors, owners and signatories first."
          }
          problems={s.stakeholders.length ? problems : []}
        />
      );
  }

  const threshold = uboThreshold(s.country, s.entity, s.category)!;
  const all = s.stakeholders;
  const people = peopleOf(all);
  const ubos = ubosOf(all, threshold);
  const controllers = people.filter((p) => p.controller && !ubos.includes(p));
  const companies = all.filter((p) => p.kind === "company");
  const directors = people.filter((p) => p.director);
  const signatories = people.filter((p) => p.signatory);
  const b = s.business;
  const by = readOnly && s.declaration ? s.declaration : { name: `${s.firstName} ${s.lastName}`.trim(), email: s.email, position: s.position, phone: s.phone, confirmedAt: null };
  const details = (p: Stakeholder) => [nationalityName(p.nationality), p.kraPin && `KRA PIN ${p.kraPin}`, controlLabel(p.control, p.controlOther)].filter(Boolean).join(" · ");
  const sentTo = people.filter((p) => p.status !== "verified" && p.status !== "rejected").length;

  const confirm = () => {
    setTried(true);
    if (!agreed) return;
    const now = new Date().toISOString();
    s.set({
      stakeholdersSubmitted: true,
      declaration: { confirmedAt: now, name: `${s.firstName} ${s.lastName}`.trim(), email: s.email, position: s.position, phone: s.phone },
      invitesSentAt: now,
      stakeholders: all.map((p) => (p.kind === "company" || p.status === "verified" || p.status === "rejected" ? p : { ...p, status: "pending" as const })),
    });
    toast.success("Declaration confirmed", { description: `We’ve emailed ${sentTo} ${sentTo === 1 ? "person" : "people"} a verification link.` });
    router.push(LIST);
  };

  // Sections are numbered like the paper form, skipping the ones that don't apply.
  let n = 0;
  const num = () => ++n;

  return (
    <SetupColumn size="md">
      <SetupHeader
        back={LIST}
        title="Director and UBO declaration"
        description={
          readOnly
            ? "The declaration you confirmed for the business. It can’t be changed now that the invitations are sent."
            : "We filled this in from your sign-up and stakeholder list. Check it, then confirm it on behalf of the business."
        }
      />

      {readOnly && s.declaration && (
        <Note intent="success" className="mb-4" title="Confirmed">
          {s.declaration.name} confirmed this declaration on {formatDate(s.declaration.confirmedAt)}.
        </Note>
      )}

      <article aria-label="Director and UBO declaration" className="flex flex-col rounded-[20px] border-[0.7px] border-line bg-surface">
        <DocSection n={num()} title="Company information" first>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field label="Business name" value={b?.name} />
            <Field label="Registration number" value={b?.regType && b.regNumber ? `${b.regType}-${b.regNumber}` : b?.regNumber} />
            <Field label="Country of registration" value={countryInfo(s.country)?.name} />
            {b?.companyType && <Field label="Company type" value={b.companyType} />}
            {b?.address && <Field label="Registered address" value={b.address} wide />}
          </dl>
        </DocSection>

        <DocSection n={num()} title={`Beneficial owners (${threshold}% or more)`}>
          {ubos.length ? (
            <DocList>
              {ubos.map((p) => {
                const via = all.find((x) => x.id === p.parentId);
                return (
                  <PersonRow
                    key={p.id}
                    person={p}
                    primary={fullName(p)}
                    secondary={[via && `Through ${fullName(via)} (owns ${p.ownership}% of it)`, details(p)].filter(Boolean).join(" · ")}
                    figure={`${effectiveOwnership(p, all)}%`}
                  />
                );
              })}
            </DocList>
          ) : (
            <p className={bodyCls}>No individual owns {threshold}% or more.</p>
          )}
        </DocSection>

        {controllers.length > 0 && (
          <DocSection n={num()} title="Significant management control">
            <DocList>
              {controllers.map((p) => (
                <PersonRow key={p.id} person={p} primary={fullName(p)} secondary={[p.position, details(p)].filter(Boolean).join(" · ")} />
              ))}
            </DocList>
          </DocSection>
        )}

        {companies.length > 0 && (
          <DocSection n={num()} title="Companies that own shares">
            <DocList>
              {companies.map((c) => (
                <PersonRow
                  key={c.id}
                  person={c}
                  company
                  primary={fullName(c)}
                  secondary={[c.regNumber, nationalityName(c.regCountry)].filter(Boolean).join(" · ")}
                  figure={`${c.ownership}%`}
                />
              ))}
            </DocList>
          </DocSection>
        )}

        <DocSection n={num()} title="Directors">
          <DocList>
            {directors.map((p) => (
              <PersonRow key={p.id} person={p} primary={fullName(p)} secondary={[p.position, p.email].filter(Boolean).join(" · ")} />
            ))}
          </DocList>
        </DocSection>

        <DocSection n={num()} title="Authorised signatories">
          <DocList>
            {signatories.map((p) => (
              <PersonRow key={p.id} person={p} primary={fullName(p)} secondary={[p.position, p.email].filter(Boolean).join(" · ")} />
            ))}
          </DocList>
        </DocSection>

        <DocSection n={num()} title="Statement of accuracy and compliance">
          <div className={cn(bodyCls, "flex flex-col gap-2 rounded-[12px] bg-sunken px-3 py-3")}>
            <p>
              I hereby declare that the information provided above is accurate, complete, and up-to-date to the best of my knowledge. I understand that failure to
              disclose accurate Director and UBO details may result in regulatory and/or operational consequences.
            </p>
            <p>
              Furthermore, I confirm that the Company complies with all applicable Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) regulations. Any
              changes to the UBO structure will be communicated to Foren promptly.
            </p>
          </div>
        </DocSection>

        <DocSection n={num()} title="Authorised representative">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field label="Name" value={by.name} />
            <Field label="Position" value={by.position} />
            <Field label="Email" value={by.email} />
            <Field label="Phone" value={by.phone} />
            <Field label="Date" value={by.confirmedAt ? formatDate(by.confirmedAt) : "On confirmation"} />
          </dl>
        </DocSection>
      </article>

      {readOnly ? (
        <div className="mt-8 flex flex-col-reverse gap-3 sm:grid sm:grid-cols-2">
          <LinkButton href={LIST} variant="outline" size="md" className="text-fg-2">
            Back to invitations
          </LinkButton>
          <LinkButton href="/get-started/verification" size="md">
            Track verification
          </LinkButton>
        </div>
      ) : (
        <>
          <div className={cn("mt-4 rounded-[20px] border-[0.7px] bg-surface px-4 py-4 sm:px-6", tried && !agreed ? "border-error" : "border-line")}>
            <ForenCheckbox
              checked={agreed}
              error={tried && !agreed}
              onCheckedChange={(c) => setAgreed(c === true)}
              label={`I confirm this declaration on behalf of ${b?.name ?? "the business"}`}
              description="Ticking this box takes the place of a signature."
              aria-describedby={tried && !agreed ? "agree-error" : undefined}
            />
            {tried && !agreed && (
              <p id="agree-error" role="alert" className="mt-2 pl-8 text-[12px] leading-[18px] font-medium text-error">
                Tick the box to confirm the declaration
              </p>
            )}
          </div>
          <p className="mt-3 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">
            Confirming emails {sentTo} {sentTo === 1 ? "person" : "people"} a link to verify their identity. You can’t change the stakeholders after that.
          </p>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:grid sm:grid-cols-2">
            <LinkButton href={LIST} variant="outline" size="md" className="text-fg-2">
              Back to edit
            </LinkButton>
            <ForenButton type="button" size="md" onClick={confirm}>
              Confirm and send invitations
            </ForenButton>
          </div>
        </>
      )}
    </SetupColumn>
  );
}

const bodyCls = "text-[13px] leading-[19px] font-medium tracking-[0.01em] text-fg-2";

/** Shown instead of the declaration when it can't be built yet. */
function Blocked({ title, intro, problems }: { title: string; intro: string; problems: Problem[] }) {
  return (
    <SetupColumn size="md">
      <SetupHeader back={LIST} title={title} description={intro} />
      {problems.length > 0 && (
        <div className="mb-8 rounded-[20px] border-[0.7px] border-line bg-surface px-4 py-4 sm:px-6">
          <GroupLabel className="mb-3">{problems.length === 1 ? "1 thing to fix" : `${problems.length} things to fix`}</GroupLabel>
          <ul className="flex flex-col gap-3">
            {problems.map((p) => (
              <li key={p.title} className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">
                <span className="block text-[14px] leading-[21px] font-semibold text-error">{p.title}</span>
                {p.body}
              </li>
            ))}
          </ul>
        </div>
      )}
      <LinkButton href={LIST} size="md" className="w-full">
        Back to stakeholders
      </LinkButton>
    </SetupColumn>
  );
}

function DocSection({ n, title, first, children }: { n: number; title: string; first?: boolean; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <section aria-labelledby={id} className={cn("flex flex-col gap-3 px-4 py-5 sm:px-6", !first && "border-t-[0.7px] border-line")}>
      <h2 id={id} className="flex items-baseline gap-2 text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-fg">
        <span className="text-[12px] font-semibold text-fg-3 tabular-nums">{n}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", wide && "sm:col-span-2")}>
      <dt className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">{label}</dt>
      <dd className="text-[14px] leading-[21px] font-medium tracking-[0.01em] break-words text-fg">{value || "—"}</dd>
    </div>
  );
}

function DocList({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col divide-y-[0.7px] divide-line">{children}</ul>;
}

function PersonRow({ person, company, primary, secondary, figure }: { person: Stakeholder; company?: boolean; primary: string; secondary: string; figure?: string }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      {company ? (
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-subtle text-fg-2">
          <BuildingsIcon className="size-4" />
        </span>
      ) : (
        <PersonAvatar person={person} size={32} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-fg">{primary}</p>
        {secondary && <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] break-words text-fg-2">{secondary}</p>}
      </div>
      {figure && <span className="shrink-0 text-[14px] leading-[21px] font-semibold text-fg tabular-nums">{figure}</span>}
    </li>
  );
}
