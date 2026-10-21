"use client";
import * as React from "react";
import Link from "next/link";
import { RiArrowLeftSLine, RiCheckboxCircleFill, RiErrorWarningFill, RiInformationFill } from "@remixicon/react";
import { ForenBadge, type BadgeColor } from "@/components/ui/foren-badge";
import type { Stakeholder, TaskStatus } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";

/** The Figma "Verify your business" screens sit in a centred 558px column inside the app panel. */
export function SetupColumn({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[558px]", className)}>{children}</div>;
}

/** Megafield title + one-line description, with the round back button above (Figma). */
export function SetupHeader({
  title,
  description,
  back,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4">
      {(back || action) && (
        <div className="flex items-center justify-between">
          {back ? (
            <Link
              href={back}
              aria-label="Back"
              className="grid size-8 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] bg-surface text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
            >
              <RiArrowLeftSLine className="size-[18px]" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">{title}</h1>
        {description && <p className="text-[14px] leading-[21px] font-medium text-fg-2">{description}</p>}
      </div>
    </header>
  );
}

/** Uppercase group label (Figma "TODO", "FROM COMPANY HOUSE", "REQUIRES ACTION"). */
export function GroupLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("mb-3 text-[12px] leading-[18px] font-semibold tracking-[0.04em] text-fg-3 uppercase", className)}>{children}</h2>;
}

const TASK_BADGE: Record<TaskStatus, [BadgeColor, string]> = {
  not_started: ["gray", "Not started"],
  in_progress: ["orange", "In progress"],
  submitted: ["success", "Submitted"],
  action_required: ["error", "Action required"],
  verified: ["success", "Verified"],
};

export function TaskBadge({ status, label }: { status: TaskStatus; label?: string }) {
  const [color, text] = TASK_BADGE[status];
  return (
    <ForenBadge size="sm" color={color}>
      {label ?? text}
    </ForenBadge>
  );
}

/**
 * Multi-line note. The DS Info note is a one-line pill, which truncates the longer explanations these
 * screens need, so this keeps its colours but lets text wrap.
 */
export function Note({
  intent = "info",
  title,
  children,
  className,
  action,
}: {
  intent?: "info" | "success" | "warning" | "error";
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const tone = {
    info: "bg-info-subtle text-info",
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    error: "bg-error-subtle text-error",
  }[intent];
  const Icon = intent === "success" ? RiCheckboxCircleFill : intent === "info" ? RiInformationFill : RiErrorWarningFill;
  return (
    <div role={intent === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-[12px] px-3 py-2.5 text-[13px] leading-[19px] font-medium", tone, className)}>
      <Icon className="mt-px size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
      {action}
    </div>
  );
}

const AVATAR_TONES = ["bg-[#3a3633]", "bg-[#5d4fc9]", "bg-[#c9a227]", "bg-[#4c9a4e]", "bg-[#b45309]", "bg-[#3d6fb6]"];

/** Coloured initial avatar like the Figma stakeholder rows. */
export function PersonAvatar({ person, size = 36 }: { person: Pick<Stakeholder, "id" | "firstName">; size?: number }) {
  const n = [...person.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full font-medium text-white", AVATAR_TONES[n % AVATAR_TONES.length])}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {person.firstName.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export const fullName = (p: Pick<Stakeholder, "firstName" | "lastName">) => `${p.firstName} ${p.lastName}`.trim();

/** "Director & shareholder · 25% ownership" */
export function roleLine(p: Stakeholder) {
  const roles = [p.director && "Director", p.shareholder && "shareholder", !p.director && !p.shareholder && p.signatory && "Authorised signatory"].filter(Boolean) as string[];
  let text = roles.join(" & ");
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!text) text = p.position || "Stakeholder";
  if (p.shareholder && p.ownership > 0) text += ` · ${p.ownership}% ownership`;
  if ((p.director || p.shareholder) && p.signatory) text += " · Signatory";
  return text;
}

/** Fake but stable per-person verification link (prototype). */
export const verificationLink = (p: Stakeholder) => `https://verify.foren.co/k/${p.id.replace(/^sh_/, "")}-${p.firstName.toLowerCase()}`;
