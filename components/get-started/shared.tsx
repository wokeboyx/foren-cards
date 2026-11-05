"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { CaretLeftIcon, CheckCircleFillIcon, InfoFillIcon, WarningCircleFillIcon } from "@/components/icons";
import { ForenBadge, type BadgeColor } from "@/components/ui/foren-badge";
import { asset } from "@/lib/base-path";
import type { Stakeholder, TaskStatus } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";

/**
 * The Figma "Verify your business" screens sit in a centred column inside the app panel: 470px for the
 * overview and stakeholders, 550px for documents, 600px for stakeholder verification.
 */
export function SetupColumn({ children, className, size = "sm" }: { children: React.ReactNode; className?: string; size?: "sm" | "md" | "lg" }) {
  const width = { sm: "max-w-[470px]", md: "max-w-[550px]", lg: "max-w-[600px]" }[size];
  return <div className={cn("mx-auto w-full", width, className)}>{children}</div>;
}

/** Megafield title + description, with the round back button (and an optional action) above (Figma). */
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
    <header className="mb-8 flex flex-col gap-6">
      {(back || action) && (
        <div className="flex items-center justify-between">
          {back ? (
            <Link
              href={back}
              aria-label="Back"
              className="grid size-10 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] bg-white/10 text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
            >
              <CaretLeftIcon className="size-[22px]" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">{title}</h1>
        {description && <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{description}</p>}
      </div>
    </header>
  );
}

/** Uppercase group label (Figma "TODO", "FROM COMPANY HOUSE", "REQUIRES ACTION"). */
export function GroupLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("mb-2 text-[12px] leading-[18px] font-semibold tracking-[0.01em] text-fg-3 uppercase", className)}>{children}</h2>;
}

/** White list card used for stakeholder and task rows (Figma "card"). */
export const cardCls = "rounded-[24px] border-[0.7px] border-line bg-surface px-3 py-4";

/** The small outlined row buttons (Copy link, Resend link): DS outline xxs with the Figma label style. */
export const rowButtonCls = "font-medium tracking-[0.01em] text-fg-2";

const TASK_BADGE: Record<TaskStatus, [BadgeColor, string]> = {
  not_started: ["gray", "Not started"],
  in_progress: ["orange", "In progress"],
  submitted: ["success", "Submitted"],
  action_required: ["error", "Action required"],
  verified: ["success", "Verified"],
};

export function TaskBadge({ status, label, color }: { status: TaskStatus; label?: string; color?: BadgeColor }) {
  const [c, text] = TASK_BADGE[status];
  return (
    <ForenBadge size="sm" color={color ?? c}>
      {label ?? text}
    </ForenBadge>
  );
}

/** The orange-to-pink "information-2-fill" glyph Figma uses on delegate and verification status lines. */
export function InfoGlyph({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <Image src={asset("/onboarding/info-gradient.png")} alt="" width={Math.round(size * 0.834)} height={Math.round(size * 0.834)} />
    </span>
  );
}

/**
 * Multi-line note in the Figma "Info Note" style. The DS Info note is a one-line pill, which truncates the
 * longer explanations these screens need, so this keeps its colours and spacing but lets text wrap.
 */
export function Note({
  intent = "info",
  title,
  children,
  className,
  action,
  icon,
}: {
  intent?: "info" | "success" | "warning" | "error";
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const tone = {
    info: "bg-info-subtle text-info",
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    error: "bg-error-subtle text-error",
  }[intent];
  const Icon = intent === "success" ? CheckCircleFillIcon : intent === "info" ? InfoFillIcon : WarningCircleFillIcon;
  return (
    <div
      role={intent === "error" ? "alert" : "status"}
      className={cn("flex items-center gap-2 rounded-[16px] py-2 pr-3.5 pl-2.5 text-[12px] leading-[18px] font-medium tracking-[0.01em]", tone, className)}
    >
      {icon ?? <Icon className="size-4 shrink-0" aria-hidden />}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title && <p className="text-[14px] leading-[21px] font-semibold tracking-[0.0125em]">{title}</p>}
        {children && <div>{children}</div>}
      </div>
      {action}
    </div>
  );
}

/** Figma avatar fills, in the order the stakeholder rows use them. */
const AVATAR_TONES = ["bg-[#3c3c3c]", "bg-[#5d4fc9]", "bg-[#d1bd4f]", "bg-[#4c9a4e]", "bg-[#b45309]", "bg-[#3d6fb6]"];

/** Coloured initial avatar like the Figma stakeholder rows (40px, 20px initial). */
export function PersonAvatar({ person, size = 40 }: { person: Pick<Stakeholder, "id" | "firstName">; size?: number }) {
  const n = [...person.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-2 border-[rgba(0,0,0,0.03)] font-semibold text-[var(--color-foren-text-inverse)]",
        AVATAR_TONES[n % AVATAR_TONES.length]
      )}
      style={{ width: size, height: size, fontSize: size / 2 }}
    >
      {person.firstName.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export const fullName = (p: Pick<Stakeholder, "firstName" | "lastName">) => `${p.firstName} ${p.lastName}`.trim();

/** "Director & shareholder · 25% Ownership" */
export function roleLine(p: Stakeholder) {
  const roles = [
    p.director && "Director",
    p.shareholder && "shareholder",
    !p.director && !p.shareholder && p.signatory && "Authorised signatory",
    !p.director && !p.shareholder && !p.signatory && p.controller && "Significant control",
  ].filter(Boolean) as string[];
  let text = roles.join(" & ");
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!text) text = p.position || "Stakeholder";
  if (p.shareholder && p.ownership > 0) text += ` · ${p.ownership}% Ownership`;
  if ((p.director || p.shareholder) && p.signatory) text += " · Signatory";
  return text;
}

/** Fake but stable per-person verification link (prototype). */
export const verificationLink = (p: Stakeholder) => `https://verify.foren.co/k/${p.id.replace(/^sh_/, "")}-${p.firstName.toLowerCase()}`;
