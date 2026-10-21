"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  RiArrowRightLine,
  RiArrowRightSLine,
  RiCheckboxCircleFill,
  RiFileTextFill,
  RiFlaskLine,
  RiInformationFill,
  RiQuestionAnswerFill,
  RiShieldCheckFill,
  RiTimeLine,
  RiUser3Fill,
} from "@remixicon/react";
import { toast } from "sonner";
import { Modal } from "@/components/overlay";
import { EmptyState, Panel } from "@/components/states";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenInput } from "@/components/ui/foren-input";
import { LinkButton } from "@/components/link-button";
import { uploadRequirements } from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { checklist, contextOf, useOnboarding, type ChecklistItem, type OnboardingState } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { GroupLabel, SetupColumn, TaskBadge, fullName } from "./shared";

const ICON: Record<ChecklistItem["id"], React.ReactNode> = {
  stakeholders: <RiUser3Fill className="size-4 text-[#3d6fb6]" aria-hidden />,
  verification: <RiShieldCheckFill className="size-4 text-[#c026d3]" aria-hidden />,
  documents: <RiFileTextFill className="size-4 text-[#4c9a4e]" aria-hidden />,
  questionnaire: <RiQuestionAnswerFill className="size-4 text-[#b45309]" aria-hidden />,
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

function Banner() {
  return (
    <div className="relative mb-6 aspect-[940/514] w-full overflow-hidden rounded-[20px] bg-[#3d86c9]">
      <Image src={asset("/onboarding/setup-banner.jpg")} alt="" fill priority sizes="(min-width: 640px) 558px, 100vw" className="object-cover" />
      <Image
        src={asset("/onboarding/foren-wordmark.svg")}
        alt="Foren"
        width={100}
        height={24}
        className="absolute top-[11%] left-1/2 h-auto w-[30%] -translate-x-1/2 brightness-0 invert"
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

  const title = changes ? "A few things need another look" : inReview ? "We’re reviewing your account" : "Complete your account setup";
  const description = changes
    ? "Everything else checked out. Fix the highlighted items below to finish your review."
    : inReview
      ? "You’ve sent everything we need. We’ll email you when your account is ready."
      : "Finish the steps below to unlock your full Foren business account.";

  return (
    <SetupColumn>
      <Banner />
      <h1 className="font-display text-[22px] leading-[30px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">{title}</h1>
      <p className="mt-1 text-[14px] leading-[21px] font-medium text-fg-2">{description}</p>
      {(changes || inReview) && (
        <span className="mt-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-success-subtle px-3 text-[12px] font-semibold text-success">
          <RiCheckboxCircleFill className="size-3.5" aria-hidden />
          All your details are saved
        </span>
      )}

      <div className="mt-6 mb-8" aria-live="polite">
        <div className="mb-2 flex items-center justify-between text-[12px] leading-[18px] font-semibold text-fg">
          <span>
            {done} of {items.length} steps {changes || inReview ? "submitted" : "completed"}
          </span>
          {attention > 0 ? (
            <span className="rounded-full bg-error-subtle px-2 py-0.5 text-[11px] text-error">{attention} needs attention</span>
          ) : (
            <span className="text-fg-3">{pct}%</span>
          )}
        </div>
        <div
          className="flex h-1.5 gap-1"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={done}
          aria-label="Setup progress"
        >
          {items.map((i) => (
            <span
              key={i.id}
              className={cn("flex-1 rounded-full", i.status === "action_required" ? "bg-error" : isDone(i) ? "bg-[var(--color-foren-brand-green)]" : "bg-line-2/60")}
            />
          ))}
        </div>
      </div>

      <GroupLabel>{changes || inReview ? "In review" : "To do"}</GroupLabel>
      <ul className="flex flex-col gap-3">
        {items.map((i) => (
          <li key={i.id}>
            <TaskRow item={i} s={s} />
          </li>
        ))}
      </ul>

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
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] leading-[18px] font-medium text-fg-3">
          <RiTimeLine className="size-3.5 text-warning" aria-hidden />
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
  const body = (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-subtle">{ICON[item.id]}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] leading-[21px] font-medium text-fg">{item.title}</span>
          <TaskBadge status={item.status} label={item.status === "action_required" ? "Needs attention" : undefined} />
        </span>
        <span className="mt-0.5 block text-[12px] leading-[18px] font-medium text-fg-2">{item.description}</span>
      </span>
      {!locked && <RiArrowRightSLine className="size-4 shrink-0 text-fg-3" aria-hidden />}
    </>
  );
  const cls = "flex items-center gap-3 px-4 py-4";
  return (
    <div className={cn("overflow-hidden rounded-[16px] bg-surface", notes.length > 0 && "ring-1 ring-error/20")}>
      {locked ? (
        <div className={cls}>{body}</div>
      ) : (
        <Link href={item.href} className={cn(cls, "outline-none hover:bg-sunken/60 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset")}>
          {body}
        </Link>
      )}
      {notes.map((n, k) => (
        <div key={k} className="flex items-start gap-2.5 bg-error-subtle px-4 py-3 text-[12px] leading-[18px] font-medium text-error">
          <RiInformationFill className="mt-px size-4 shrink-0" aria-hidden />
          <p className="flex-1">{n}</p>
          <LinkButton href={item.href} size="xxs" className="shrink-0">
            Review
          </LinkButton>
        </div>
      ))}
    </div>
  );
}

function attentionNotes(item: ChecklistItem, s: OnboardingState): string[] {
  if (item.status !== "action_required") return [];
  if (item.id === "verification")
    return s.stakeholders.filter((p) => p.status === "action_required").map((p) => p.note ?? `${fullName(p)} needs to retake their verification.`);
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
      <div className="mt-10 flex flex-col gap-3 rounded-[16px] bg-surface px-4 py-3.5 sm:-mx-6 sm:flex-row sm:items-center">
        <RiInformationFill className="size-4 shrink-0 text-[#e0a526] max-sm:hidden" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-[19px] font-medium text-fg">Rather have someone else handle setup?</p>
          <p className="text-[12px] leading-[18px] font-medium text-fg-2">They complete these same steps on your behalf.</p>
        </div>
        <ForenButton variant="outline" size="xxs" trailingIcon={<RiArrowRightLine />} onClick={() => setOpen(true)} className="self-start sm:self-auto">
          Delegate setup
        </ForenButton>
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
        <RiFlaskLine className="size-3.5" aria-hidden />
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
        <h1 className="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">Your account is active</h1>
        <p className="mt-2 max-w-[400px] text-[14px] leading-[21px] font-medium text-fg-2">
          {name ? `${name} is verified. ` : ""}You can now send, receive and issue cards with no setup limits.
        </p>
        <ForenButton size="sm" className="mt-6" onClick={() => router.push("/cards")}>
          Go to dashboard
        </ForenButton>
      </Panel>
    </SetupColumn>
  );
}
