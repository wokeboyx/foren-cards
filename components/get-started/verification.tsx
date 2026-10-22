"use client";
import * as React from "react";
import { RiCheckboxCircleFill, RiErrorWarningFill, RiFlaskLine, RiTimeFill } from "@remixicon/react";
import { toast } from "sonner";
import { EmptyState, Panel } from "@/components/states";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { LinkButton } from "@/components/link-button";
import { peopleOf, useOnboarding, type Stakeholder } from "@/lib/onboarding-store";
import { CopyLink } from "./stakeholders";
import { GroupLabel, PersonAvatar, SetupColumn, SetupHeader, fullName, roleLine } from "./shared";

export function VerificationPage() {
  const s = useOnboarding();

  if (!s.invitesSentAt)
    return (
      <SetupColumn>
        <SetupHeader back="/get-started" title="Stakeholder verification" />
        <Panel>
          <EmptyState
            title="No invitations sent yet"
            body="Add your directors and owners first. We’ll email each of them a link to verify their identity."
            action={
              <LinkButton href="/get-started/stakeholders" size="sm">
                Add stakeholders
              </LinkButton>
            }
          />
        </Panel>
      </SetupColumn>
    );

  // Companies that own shares aren't verified themselves; the people behind them are.
  const people = peopleOf(s.stakeholders);
  const action = people.filter((p) => p.status === "action_required");
  const waiting = people.filter((p) => p.status === "pending" || p.status === "not_sent");
  const verified = people.filter((p) => p.status === "verified");

  return (
    <SetupColumn>
      <SetupHeader
        back="/get-started"
        action={
          <LinkButton href="/get-started" variant="secondary" size="xs">
            Skip
          </LinkButton>
        }
        title="Stakeholder verification"
        description="Track each stakeholder’s identity check. Everyone must finish before we can activate your account."
      />
      <div aria-live="polite" className="flex flex-col gap-8">
        {action.length > 0 && <Group label="Requires action" people={action} />}
        {waiting.length > 0 && <Group label="Awaiting response" people={waiting} />}
        {verified.length > 0 && <Group label="Verified" people={verified} />}
      </div>
      <Simulate />
    </SetupColumn>
  );
}

function Group({ label, people }: { label: string; people: Stakeholder[] }) {
  return (
    <section>
      <GroupLabel>{label}</GroupLabel>
      <ul className="flex flex-col gap-4">
        {people.map((p) => (
          <li key={p.id}>
            <Row person={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const STATUS: Record<Stakeholder["status"], { badge: React.ReactNode; line: (p: Stakeholder) => string; icon: React.ReactNode }> = {
  action_required: {
    badge: (
      <ForenBadge size="sm" color="error">
        Action required
      </ForenBadge>
    ),
    line: (p) => p.note ?? "They need to send more information to finish their verification.",
    icon: <RiErrorWarningFill className="size-3.5 shrink-0 text-error" aria-hidden />,
  },
  pending: {
    badge: (
      <ForenBadge size="sm" color="orange">
        Pending
      </ForenBadge>
    ),
    line: () => "Waiting for them to complete verification.",
    icon: <RiTimeFill className="size-3.5 shrink-0 text-[#e0a526]" aria-hidden />,
  },
  not_sent: {
    badge: (
      <ForenBadge size="sm" color="gray">
        Not sent
      </ForenBadge>
    ),
    line: () => "Their link hasn’t been sent yet.",
    icon: <RiTimeFill className="size-3.5 shrink-0 text-fg-3" aria-hidden />,
  },
  verified: {
    badge: (
      <ForenBadge size="sm" color="success">
        Verified
      </ForenBadge>
    ),
    line: () => "Verification complete.",
    icon: <RiCheckboxCircleFill className="size-3.5 shrink-0 text-success" aria-hidden />,
  },
};

function Row({ person: p }: { person: Stakeholder }) {
  const st = STATUS[p.status];
  const patch = useOnboarding((s) => s.patchStakeholder);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-surface px-4 py-3.5">
        <PersonAvatar person={p} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14px] leading-[21px] font-semibold text-fg">
            {fullName(p)}
            {st.badge}
          </p>
          <p className="truncate text-[12px] leading-[18px] font-medium text-fg-2">{roleLine(p)}</p>
        </div>
        {p.status !== "verified" && (
          <div className="flex gap-2 max-sm:w-full max-sm:pl-12">
            <CopyLink person={p} />
            <ForenButton
              variant="outline"
              size="xxs"
              onClick={() => {
                patch(p.id, { status: p.status === "not_sent" ? "pending" : p.status });
                toast.success(`New link sent to ${p.email}`, { description: "The old link no longer works." });
              }}
            >
              Resend link
            </ForenButton>
          </div>
        )}
      </div>
      <p className="mt-2 flex items-start gap-2 px-4 text-[12px] leading-[18px] font-medium text-fg-2">
        <span className="mt-0.5">{st.icon}</span>
        {st.line(p)}
      </p>
    </div>
  );
}

/** Prototype-only: stand in for stakeholders finishing (or failing) their checks. */
function Simulate() {
  const s = useOnboarding();
  const open = peopleOf(s.stakeholders).filter((p) => p.status !== "verified");
  if (!open.length) return null;
  return (
    <div className="mt-10 rounded-[16px] border border-dashed border-line-2 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[12px] leading-[18px] font-semibold text-fg-3">
        <RiFlaskLine className="size-3.5" aria-hidden />
        Prototype: simulate stakeholder responses
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <ForenButton
          variant="secondary"
          size="xxs"
          onClick={() => s.set({ stakeholders: s.stakeholders.map((p) => ({ ...p, status: "verified" as const, note: undefined })) })}
        >
          Everyone verifies
        </ForenButton>
        <ForenButton
          variant="secondary"
          size="xxs"
          onClick={() => {
            const target = open[0];
            s.patchStakeholder(target.id, { status: "action_required", note: `${target.firstName}’s ID photo was too blurry to read. Ask them to retake it in good light.` });
          }}
        >
          One needs action
        </ForenButton>
      </div>
    </div>
  );
}
