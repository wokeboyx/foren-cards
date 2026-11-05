"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CaretRightIcon, ChatsFillIcon, ClockCounterClockwiseFillIcon, FileFillIcon, FlaskIcon, ShieldCheckFillIcon, ShieldFillIcon, UsersThreeFillIcon, WarningCircleFillIcon } from "@/components/icons";
import { toast } from "sonner";
import { Modal } from "@/components/overlay";
import { EmptyState, Panel } from "@/components/states";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenInput } from "@/components/ui/foren-input";
import { LinkButton } from "@/components/link-button";
import { uploadRequirements } from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { checklist, contextOf, useOnboarding, type ChecklistItem, type OnboardingState } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { GroupLabel, InfoGlyph, Note, SetupColumn, TaskBadge, fullName } from "./shared";

const ICON: Record<ChecklistItem["id"], React.ReactNode> = {
  stakeholders: <UsersThreeFillIcon className="size-[18px] shrink-0 text-[#0052b4]" aria-hidden />,
  verification: <ShieldCheckFillIcon className="size-[18px] shrink-0 text-[#dc4ad8]" aria-hidden />,
  documents: <FileFillIcon className="size-[18px] shrink-0 text-[var(--color-foren-brand-green)]" aria-hidden />,
  questionnaire: <ChatsFillIcon className="size-[18px] shrink-0 text-[#b45309]" aria-hidden />,
};

const isDone = (i: ChecklistItem) => i.status === "submitted" || i.status === "verified";

export function GetStartedPage() {
  const s = useOnboarding();
  if (!s.signedUpAt)
    return (
      <SetupColumn>
        <Panel>
          <EmptyState
            title="You haven’t signed up yet"
            body="Sign up for a Foren business account to see your setup steps here."
            action={
              <LinkButton href="/onboarding" size="sm">
                Start sign-up
              </LinkButton>
            }
          />
        </Panel>
      </SetupColumn>
    );
  if (s.review === "approved") return <Approved name={s.business?.name} />;
  return <Checklist s={s} />;
}

/**
 * Figma banner: 470×257 with 26.5px corners, wordmark 134px wide and 34px down. The image has its own dark rounded
 * corners baked in, so the clip is 1.5px rounder than Figma's to hide their anti-aliased edge.
 */
function Banner() {
  return (
    <div className="relative mb-8 aspect-[470/257] w-full overflow-hidden rounded-[28px]">
      <Image src={asset("/onboarding/setup-banner.png")} alt="" fill priority sizes="(min-width: 640px) 470px, 100vw" className="object-cover" />
      <Image
        src={asset("/login/foren-fka-leatherback-light.svg")}
        alt="Foren, formerly Leatherback"
        width={100}
        height={39}
        className="absolute top-[11%] left-1/2 h-auto w-[28.5%] -translate-x-1/2"
      />
    </div>
  );
}

function Checklist({ s }: { s: ReturnType<typeof useOnboarding.getState> }) {
  const items = checklist(s);
  const done = items.filter(isDone).length;
  const attention = items.filter((i) => i.status === "action_required").length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const allSubmitted = items.length > 0 && items.every(isDone);
  const set = s.set;

  const changes = s.review === "changes_requested";
  const inReview = s.review === "in_review";

  const title = changes ? "A few things need another look" : inReview ? "Your account is under review" : "Complete your account setup";
  const description = changes
    ? "Everything else checked out. Resolve the highlighted items below to finalise your account review."
    : inReview
      ? "We are reviewing your details. No further action is required from you at this time. We will notify you via email once your account is fully activated."
      : "Finish the steps below to unlock your full Foren business account.";

  return (
    <SetupColumn>
      <Banner />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[16px] leading-[24px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">{title}</h1>
          <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{description}</p>
          {changes && (
            <Note intent="success" className="w-fit" icon={<ShieldFillIcon className="size-4 shrink-0" aria-hidden />}>
              All your details are saved
            </Note>
          )}
        </div>

        <div className="flex flex-col gap-1.5" aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-[12px] leading-[18px] font-medium tracking-[0.01em]">
            <span className="text-fg">
              {done} of {items.length} steps {changes || inReview ? "submitted" : "completed"}
            </span>
            {attention > 0 ? (
              <ForenBadge size="sm" color="error">
                {attention} needs attention
              </ForenBadge>
            ) : inReview ? (
              <ForenBadge size="sm" color="orange">
                In review
              </ForenBadge>
            ) : (
              <span className="text-fg-2">{pct}%</span>
            )}
          </div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done} aria-label="Setup progress">
            {changes ? (
              // Figma: one green bar for what's submitted, one red bar for what needs attention.
              <div className="flex h-2 gap-1.5">
                {done > 0 && <span className="rounded-full bg-[var(--color-foren-brand-green)]" style={{ flex: done }} />}
                {attention > 0 && <span className="rounded-full bg-error" style={{ flex: attention }} />}
                {items.length - done - attention > 0 && (
                  <span className="rounded-full bg-[var(--color-foren-bg-button-secondary-active)]" style={{ flex: items.length - done - attention }} />
                )}
              </div>
            ) : (
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-foren-bg-button-secondary-active)]">
                <div
                  className={cn("h-full rounded-full transition-[width]", inReview ? "bg-warning" : "bg-[var(--color-foren-brand-green)]")}
                  style={{ width: `${inReview ? 100 : pct}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <section>
          <GroupLabel className="mb-4">{changes || inReview ? "In review" : "To do"}</GroupLabel>
          <ul className="flex flex-col gap-4">
            {items.map((i) => (
              <li key={i.id}>
                <TaskRow item={i} s={s} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {allSubmitted && s.review === "none" && (
        <div className="mt-6 flex flex-col gap-2">
          <ForenButton size="md" className="w-full" onClick={() => set({ review: "in_review" })}>
            Submit for review
          </ForenButton>
          <p className="text-center text-[12px] leading-[18px] font-medium text-fg-3">You can’t change your answers while we review them.</p>
        </div>
      )}
      {changes && attention === 0 && (
        <ForenButton size="md" className="mt-6 w-full" onClick={() => set({ review: "in_review" })}>
          Send for review again
        </ForenButton>
      )}

      {(inReview || changes) && (
        <p className="mt-6 flex items-center justify-center gap-2 px-4 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">
          <ClockCounterClockwiseFillIcon className="size-[18px] shrink-0 text-warning" aria-hidden />
          Reviews usually take 1–2 business days.
        </p>
      )}

      {!inReview && !changes && <DelegateCard />}
      {(inReview || changes) && <SimulateReview />}
    </SetupColumn>
  );
}

function TaskRow({ item, s }: { item: ChecklistItem; s: OnboardingState }) {
  const notes = attentionNotes(item, s);
  const locked = item.status === "verified" || (s.review === "in_review" && item.status === "submitted");
  // While compliance reviews, submitted steps read "In review" (Figma "Document in review").
  const reviewing = s.review !== "none" && item.status === "submitted";
  const body = (
    <>
      {ICON[item.id]}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-1">
          <span className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">{item.title}</span>
          <TaskBadge
            status={item.status}
            label={item.status === "action_required" ? "Needs attention" : reviewing ? "In review" : undefined}
            color={reviewing ? "orange" : undefined}
          />
        </span>
        <span className="block text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{item.description}</span>
      </span>
      {!locked && <CaretRightIcon className="size-4 shrink-0 text-fg-3" aria-hidden />}
    </>
  );
  const cls = "relative z-[1] flex items-center gap-3 rounded-[20px] border-[0.7px] border-line bg-surface px-3 py-4";
  return (
    <div>
      {locked ? (
        <div className={cls}>{body}</div>
      ) : (
        <Link href={item.href} className={cn(cls, "outline-none hover:bg-[#fcfcfc] focus-visible:ring-2 focus-visible:ring-focus")}>
          {body}
        </Link>
      )}
      {notes.length > 0 && (
        // Figma: a red panel tucked under the card, its top hidden behind the card's rounded bottom.
        <div className="-mt-5 flex flex-col gap-3 rounded-b-[20px] bg-error-subtle px-3 pt-9 pb-4">
          {notes.map((n, k) => (
            <div key={k} className="flex items-center gap-3">
              <WarningCircleFillIcon className="size-[18px] shrink-0 text-error" aria-hidden />
              <p className="flex-1 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{n}</p>
              {item.id === "documents" && (
                <LinkButton href={item.href} size="xxs" className="shrink-0">
                  Review
                </LinkButton>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function attentionNotes(item: ChecklistItem, s: OnboardingState): string[] {
  if (item.status !== "action_required") return [];
  if (item.id === "verification")
    return s.stakeholders
      .filter((p) => p.status === "action_required" || p.status === "rejected")
      .map((p) => p.note ?? (p.status === "rejected" ? `${fullName(p)}’s verification failed. Contact support to resolve it.` : `${fullName(p)} needs to retake their verification.`));
  if (item.id === "documents") {
    const ctx = contextOf(s);
    if (!ctx) return [];
    return uploadRequirements(ctx)
      .filter((r) => s.documents[r.id]?.status === "needs_attention")
      .map((r) => `${r.title}: ${s.documents[r.id]?.note ?? "Please upload it again."}`);
  }
  return [];
}

function DelegateCard() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <>
      {/* Figma: 613px wide, so it overhangs the 470px column on wide panels. */}
      <div className="mt-10 flex flex-col gap-3 rounded-[20px] border-[0.7px] border-line bg-sunken px-3 py-4 sm:flex-row sm:items-start lg:-mx-[71px]">
        <InfoGlyph size={20} className="max-sm:hidden" />
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">Rather have someone else handle setup?</p>
            <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">They complete these same steps on your behalf.</p>
          </div>
          <ForenButton
            variant="outline"
            size="xxs"
            trailingIcon={<ArrowRightIcon />}
            onClick={() => setOpen(true)}
            className="self-start font-medium tracking-[0.01em] text-fg-2 sm:self-auto [&_svg]:size-[14px]"
          >
            Delegate setup
          </ForenButton>
        </div>
      </div>
      <Modal open={open} onOpenChange={setOpen} title="Delegate setup" description="We’ll email them a link to finish these steps. You stay the account owner.">
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (!name.trim() || !emailOk) return;
            toast.success(`Invite sent to ${name.trim()}`);
            setOpen(false);
            setName("");
            setEmail("");
            setTried(false);
          }}
        >
          <ForenInput label="Their name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={tried && !name.trim()} error={tried && !name.trim() ? "Enter their name" : undefined} />
          <ForenInput
            label="Work email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={tried && !emailOk}
            error={tried && !emailOk ? "Enter a valid email address" : undefined}
          />
          <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <ForenButton type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </ForenButton>
            <ForenButton type="submit" size="sm">
              Send invite
            </ForenButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Prototype-only: decide what compliance comes back with. */
function SimulateReview() {
  const s = useOnboarding();
  const approve = () => {
    const documents = Object.fromEntries(Object.entries(s.documents).map(([k, d]) => [k, { ...d, status: "accepted" as const, note: undefined }]));
    s.set({ review: "approved", documents, stakeholders: s.stakeholders.map((p) => ({ ...p, status: "verified" as const, note: undefined })) });
  };
  const requestChanges = () => {
    const ctx = contextOf(s);
    const first = ctx ? uploadRequirements(ctx).find((r) => s.documents[r.id]) : undefined;
    const documents = { ...s.documents };
    if (first) documents[first.id] = { ...documents[first.id], status: "needs_attention", note: "This copy isn’t clear enough to read. Upload a sharper scan with all 4 edges visible." };
    s.set({ review: "changes_requested", documents });
  };
  return (
    <div className="mt-10 rounded-[16px] border border-dashed border-line-2 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[12px] leading-[18px] font-semibold text-fg-3">
        <FlaskIcon className="size-3.5" aria-hidden />
        Prototype: simulate the compliance review
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <ForenButton variant="secondary" size="xxs" onClick={approve}>
          Approve account
        </ForenButton>
        <ForenButton variant="secondary" size="xxs" onClick={requestChanges}>
          Ask for a change
        </ForenButton>
      </div>
    </div>
  );
}

function Approved({ name }: { name?: string }) {
  const router = useRouter();
  return (
    <SetupColumn>
      <Panel className="flex flex-col items-center px-6 py-12 text-center">
        <Image src={asset("/onboarding/check.png")} alt="" width={96} height={96} className="mb-6" />
        <h1 className="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">Your account is active</h1>
        <p className="mt-2 max-w-[400px] text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg-2">
          {name ? `${name} is verified. ` : ""}You can now send, receive and issue cards with no setup limits.
        </p>
        <ForenButton size="sm" className="mt-6" onClick={() => router.push("/cards")}>
          Go to dashboard
        </ForenButton>
      </Panel>
    </SetupColumn>
  );
}
