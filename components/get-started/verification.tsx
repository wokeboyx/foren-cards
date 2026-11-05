"use client";
import * as React from "react";
import { CheckCircleFillIcon, ClockFillIcon, FlaskIcon } from "@/components/icons";
import { toast } from "sonner";
import { EmptyState, Panel } from "@/components/states";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { LinkButton } from "@/components/link-button";
import { peopleOf, useOnboarding, type Stakeholder } from "@/lib/onboarding-store";
import { SupportDialog } from "./documents";
import { CopyLink } from "./stakeholders";
import { GroupLabel, InfoGlyph, PersonAvatar, SetupColumn, SetupHeader, fullName, roleLine, rowButtonCls } from "./shared";

export function VerificationPage() {
  const s = useOnboarding();

  if (!s.invitesSentAt)
    return (
      <SetupColumn size="lg">
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
  const action = people.filter((p) => p.status === "action_required" || p.status === "rejected");
  const waiting = people.filter((p) => p.status === "pending" || p.status === "not_sent");
  const verified = people.filter((p) => p.status === "verified");

  return (
    <SetupColumn size="lg">
      <SetupHeader
        back="/get-started"
        action={
          <LinkButton href="/get-started" variant="secondary" size="md" className="w-[115px]">
            Skip
          </LinkButton>
        }
        title="Stakeholder verification"
        description="Track the verification status of your business stakeholders. All individuals must complete identity checks to activate your business account."
      />
      <div aria-live="polite" className="flex flex-col gap-6">
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
      <ul className="flex flex-col gap-3">
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
    // Figma 3240:71573: failed, but they can retry with a new link.
    line: (p) => p.note ?? "Your stakeholder verification has failed. Kindly ask them to re-try.",
    icon: <InfoGlyph />,
  },
  rejected: {
    badge: (
      <ForenBadge size="sm" color="error">
        Action required
      </ForenBadge>
    ),
    // Figma 3240:71422 "Rejection (Support)": failed and can't be retried; only support can resolve it.
    line: (p) => p.note ?? "Your stakeholder verification has failed. Please reach out to our support for assistance.",
    icon: <InfoGlyph />,
  },
  pending: {
    badge: (
      <ForenBadge size="sm" color="orange">
        Pending
      </ForenBadge>
    ),
    line: () => "Waiting for stakeholder to complete verification.",
    icon: <InfoGlyph />,
  },
  not_sent: {
    badge: (
      <ForenBadge size="sm" color="gray">
        Not sent
      </ForenBadge>
    ),
    line: () => "Their link hasn’t been sent yet.",
    icon: <ClockFillIcon className="size-4 shrink-0 text-fg-3" aria-hidden />,
  },
  verified: {
    badge: (
      <ForenBadge size="sm" color="success">
        Verified
      </ForenBadge>
    ),
    line: () => "Verification complete",
    icon: <CheckCircleFillIcon className="size-4 shrink-0 text-[var(--color-foren-brand-green)]" aria-hidden />,
  },
};

function Row({ person: p }: { person: Stakeholder }) {
  const st = STATUS[p.status];
  const patch = useOnboarding((s) => s.patchStakeholder);
  const [support, setSupport] = React.useState(false);
  // Figma: a white card inset 2px in a rounded sunken frame, with the status line underneath inside the frame.
  return (
    <div className="flex flex-col gap-1 rounded-[24px] bg-sunken px-0.5 pt-0.5 pb-2">
      <div className="flex flex-wrap items-center gap-3 rounded-[22px] bg-surface px-3 py-4">
        <PersonAvatar person={p} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-1 text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-fg">
            {fullName(p)}
            {st.badge}
          </p>
          <p className="truncate text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{roleLine(p)}</p>
        </div>
        {p.status === "rejected" && (
          <div className="flex gap-2 max-sm:w-full max-sm:pl-[52px]">
            <ForenButton variant="outline" size="xxs" className={rowButtonCls} onClick={() => setSupport(true)}>
              Contact support
            </ForenButton>
          </div>
        )}
        {p.status !== "verified" && p.status !== "rejected" && (
          <div className="flex gap-2 max-sm:w-full max-sm:pl-[52px]">
            <CopyLink person={p} />
            <ForenButton
              variant="outline"
              size="xxs"
              className={rowButtonCls}
              onClick={() => {
                // A new link restarts their check: someone asked to retry goes back to waiting (Figma 3240:71573).
                patch(p.id, { status: "pending", note: undefined });
                toast.success(`New link sent to ${p.email}`, { description: "The old link no longer works." });
              }}
            >
              Resend link
            </ForenButton>
          </div>
        )}
      </div>
      <p className="flex items-center gap-2 px-6 py-2 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg">
        {st.icon}
        {st.line(p)}
      </p>
      <SupportDialog open={support} onClose={() => setSupport(false)} sentDescription={`We’ve asked our team to look into ${fullName(p)}’s failed verification.`} />
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
        <FlaskIcon className="size-3.5" aria-hidden />
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
          One needs to retry
        </ForenButton>
        <ForenButton
          variant="secondary"
          size="xxs"
          onClick={() => s.patchStakeholder(open[0].id, { status: "rejected", note: undefined })}
        >
          One is rejected
        </ForenButton>
      </div>
    </div>
  );
}
