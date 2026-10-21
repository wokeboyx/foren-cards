"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RiArrowLeftSLine, RiChat1Line, RiCheckLine, RiPlayCircleLine } from "@remixicon/react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/overlay";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenSpinner } from "@/components/ui/foren-spinner";
import { asset } from "@/lib/base-path";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";

/**
 * Sign-up layout from the Foren Business Banking Figma ("Sole Trader / corporate" sections):
 * a 325px rail with the wordmark, numbered steps, demo card and help; content in an inset sunken
 * panel (558px column) with "Already have an account?" at the top; a 72px action bar at the bottom.
 * Phones: wordmark + step progress on top, content full width, the action bar pinned to the bottom.
 */

export type StepKey = "welcome" | "account" | "identity" | "business" | "edd";

const STEPS: { key: StepKey; title: string; description: string }[] = [
  { key: "welcome", title: "Welcome and requirements", description: "Select your country and entity type to view setup requirements  ~2 mins" },
  { key: "account", title: "Account setup", description: "Set up secure login credentials and verify your email" },
  { key: "identity", title: "Identity verification", description: "Confirm your identity as the primary account manager" },
  { key: "business", title: "Business details", description: "Enter company registration details to verify your business" },
  { key: "edd", title: "Enhanced due diligence", description: "Provide regulatory, operational and AML information about your business" },
];

export function useSteps() {
  const entity = useOnboarding((s) => s.entity);
  return STEPS.filter((s) => s.key !== "edd" || entity === "mto");
}

export type FooterAction = { label: string; onClick?: () => void; href?: string; disabled?: boolean; loading?: boolean };

export function OnboardingFrame({
  step,
  back,
  title,
  description,
  footer,
  children,
  wide,
  bare,
  completed,
}: {
  step: StepKey;
  /** Where the round back button goes. */
  back?: string | (() => void);
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Bottom bar. Omit to hide it (e.g. screens with their own call to action). */
  footer?: { primary: FooterAction; cancel?: false | (() => void) };
  children: React.ReactNode;
  /** Content column wider than 558px (the use-case grid). */
  wide?: boolean;
  /** Centered content without the title block (e.g. Identity confirmed). */
  bare?: boolean;
  /** Mark the current step done in the rail (e.g. Identity confirmed). */
  completed?: boolean;
}) {
  const steps = useSteps();
  const current = steps.findIndex((s) => s.key === step);
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const goBack = () => (typeof back === "function" ? back() : back && router.push(back));

  return (
    <div className="min-h-dvh bg-surface lg:flex">
      {/* Rail */}
      <aside className="hidden w-[325px] shrink-0 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-16 px-[22px] py-8">
          <div className="px-3">
            <Link href="/onboarding" aria-label="Foren home">
              <Image src={asset("/onboarding/foren-wordmark.svg")} alt="Foren" width={100} height={24} priority />
            </Link>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-8">
            <Stepper steps={steps} current={current} completed={completed} />
            <div className="flex flex-col gap-10">
              <DemoCard />
              <HelpButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Phone/tablet top: wordmark + progress */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface px-5 pt-4 pb-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Image src={asset("/onboarding/foren-wordmark.svg")} alt="Foren" width={80} height={19} priority />
          <Link href="/cards" className="text-[13px] font-semibold text-fg-2 underline-offset-2 hover:underline">
            Log in
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex flex-1 gap-1" aria-hidden>
            {steps.map((s, i) => (
              <span key={s.key} className={cn("h-1 flex-1 rounded-full", i < current || (i === current && completed) ? "bg-[var(--color-foren-brand-green)]" : i === current ? "bg-fg" : "bg-line")} />
            ))}
          </div>
          <span className="shrink-0 text-[12px] font-medium text-fg-3">
            Step {current + 1} of {steps.length} · {steps[current]?.title}
          </span>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col lg:py-2 lg:pr-2">
        <div className="relative flex-1 bg-canvas lg:rounded-[20px] lg:shadow-[var(--shadow-foren-xs)]">
          <div className="absolute top-3 right-3 hidden items-center gap-6 lg:flex">
            <span className="text-[16px] leading-6 font-medium text-fg">Already have an account?</span>
            <ForenButton variant="secondary" size="sm" className="w-[118px]" onClick={() => router.push("/cards")}>
              Login
            </ForenButton>
          </div>
          <main id="main" className={cn("mx-auto w-full px-5 pt-8 pb-32 lg:px-0 lg:pt-[112px]", wide ? "max-w-[476px] lg:max-w-[700px]" : "max-w-[558px]")}>
            {bare ? (
              children
            ) : (
              <>
                <div className="mb-12 flex flex-col gap-3">
                  {back && (
                    <button
                      type="button"
                      onClick={goBack}
                      aria-label="Back"
                      className="grid size-6 place-items-center rounded-full border-[0.6px] border-[rgba(0,0,0,0.07)] bg-white/10 text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      <RiArrowLeftSLine className="size-[14px]" aria-hidden />
                    </button>
                  )}
                  {title && (
                    <div className="flex flex-col gap-2">
                      <h1 className="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none] lg:text-[28px] lg:leading-[36px]">
                        {title}
                      </h1>
                      {description && <p className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg-2">{description}</p>}
                    </div>
                  )}
                </div>
                {children}
              </>
            )}
          </main>
        </div>
        {footer && (
          <div className="sticky bottom-0 z-10 border-t border-line bg-surface">
            <div className={cn("mx-auto flex h-[72px] w-full items-center justify-end gap-3 px-5 lg:px-0", wide ? "max-w-[476px] lg:max-w-[700px]" : "max-w-[558px]")}>
              {footer.cancel !== false && (
                <ForenButton variant="outline" size="xxs" className="min-w-[89px] max-lg:h-10 max-lg:flex-1" onClick={() => (typeof footer.cancel === "function" ? footer.cancel() : setCancelOpen(true))}>
                  Cancel
                </ForenButton>
              )}
              <PrimaryAction action={footer.primary} />
            </div>
          </div>
        )}
      </div>
      <CancelDialog open={cancelOpen} onOpenChange={setCancelOpen} />
    </div>
  );
}

function PrimaryAction({ action }: { action: FooterAction }) {
  const router = useRouter();
  return (
    <ForenButton
      size="xs"
      className="min-w-[104px] max-lg:h-10 max-lg:flex-1"
      disabled={action.disabled || action.loading}
      aria-busy={action.loading || undefined}
      leadingIcon={action.loading ? <ForenSpinner size="sm" className="text-current" /> : undefined}
      onClick={() => (action.onClick ? action.onClick() : action.href && router.push(action.href))}
    >
      {action.label}
    </ForenButton>
  );
}

function Stepper({ steps, current, completed }: { steps: typeof STEPS; current: number; completed?: boolean }) {
  return (
    <ol className="flex w-[281px] flex-col gap-8" aria-label="Sign-up steps">
      {steps.map((s, i) => {
        const done = i < current || (i === current && completed);
        const active = i === current && !completed;
        return (
          <li key={s.key} className="flex items-start gap-3" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-[12px] leading-4 font-bold",
                done ? "bg-success text-white" : active ? "bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]" : "border-[1.75px] border-line text-[10.5px] text-fg-disabled"
              )}
            >
              {done ? <RiCheckLine className="size-[14px]" aria-label="Done" /> : i + 1}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className={cn("text-[14px] leading-[21px] font-medium tracking-[0.01em]", done ? "text-success" : active ? "text-fg" : "text-fg-disabled")}>{s.title}</span>
              <span className={cn("text-[12px] leading-[18px] font-medium tracking-[0.01em] whitespace-pre-wrap", active || done ? "text-fg-3" : "text-fg-disabled")}>{s.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DemoCard() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-line bg-white px-3 pt-12 pb-4">
      <div className="absolute inset-x-0 top-0 h-16 overflow-hidden bg-[#cfecc6]">
        <Image src={asset("/onboarding/clouds.jpg")} alt="" fill sizes="281px" className="object-cover object-top opacity-70" />
      </div>
      <div className="relative flex flex-col gap-6">
        <span className="grid size-8 place-items-center rounded-full border border-line bg-white text-[#3d6fb6]">
          <RiPlayCircleLine className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-[14px] leading-[21px] font-medium text-fg">See Foren in action</p>
          <p className="text-[12px] leading-[18px] font-medium text-fg-3">Explore a live demo with sample data. No signup required, nothing touches your real account.</p>
        </div>
        <Link
          href="/cards"
          className="inline-flex h-[38px] w-fit items-center rounded-full bg-[var(--color-foren-bg-button-secondary)] px-3 text-[12px] leading-[18px] font-medium text-fg-2 outline-none hover:bg-[var(--color-foren-bg-button-secondary-hover)] focus-visible:ring-2 focus-visible:ring-focus"
        >
          Explore demo
        </Link>
      </div>
    </div>
  );
}

export function HelpButton() {
  return (
    <div className="flex flex-col items-start gap-2">
      <ForenButton variant="secondary" size="sm" leadingIcon={<RiChat1Line aria-hidden />} onClick={() => toast("Support chat opens here. It isn’t part of the prototype.")}>
        Need help?
      </ForenButton>
      <p className="text-[12px] leading-[18px] font-medium text-fg-2">Chat with our support team</p>
    </div>
  );
}

function CancelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Leave sign-up?"
      consequence="Your answers are saved on this device, so you can pick up where you left off."
      confirmLabel="Leave"
      onConfirm={() => {
        onOpenChange(false);
        router.push("/cards");
      }}
    />
  );
}

// ---------------------------------------------------------------- shared form pieces

/** White rounded-24 card the Figma uses around form fields (px 16, py 24, 32 between fields). */
export function FormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-8 rounded-[24px] bg-surface px-4 py-6", className)}>{children}</div>;
}

/** Label + control + hint, 8px apart (Figma Input). */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  description,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-0.5">
        <label htmlFor={htmlFor} className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">
          {label}
        </label>
        {description && <p className="text-[12px] leading-[18px] font-medium text-fg-2">{description}</p>}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-[12px] leading-[18px] font-medium text-error">
          {error}
        </p>
      ) : (
        hint && <p className="text-[12px] leading-[18px] font-medium text-fg-3">{hint}</p>
      )}
    </div>
  );
}

/** Figma text field: subtle fill, 48px, radius 16, 12px padding. */
export const fieldCls =
  "h-12 w-full rounded-[16px] border border-line bg-subtle px-3 text-[14px] leading-[21px] font-medium text-fg outline-none placeholder:text-fg-3 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20 aria-[invalid=true]:border-error disabled:text-fg-disabled";

/** Full-screen "Checking…" overlay with the Foren mark (Figma "Checking" frame). */
export function CheckingOverlay({ label = "Checking…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 grid place-items-center bg-[#241c15]/45 backdrop-blur-[1px] animate-[fade-in_150ms_ease-out]">
      <span className="grid size-12 animate-pulse place-items-center rounded-[12px] bg-white shadow-[var(--shadow-foren-lg)]">
        <Image src={asset("/foren-logo.svg")} alt="" width={22} height={22} />
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
