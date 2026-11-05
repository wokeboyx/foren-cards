"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CaretDownIcon, CaretLeftIcon, CaretUpIcon, ChatCircleIcon, CheckBoldIcon, PlayCircleIcon } from "@/components/icons";
import { toast } from "sonner";
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

/** Height the "compact" sidebar saves: logo gap 64→32, demo-card gap 48→32, card-to-help 32→24, card image 96→64. */
const COMPACT_SAVING = 32 + 16 + 8 + 32;

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
  headerGap = 48,
  titleMaxWidth,
}: {
  step: StepKey;
  /** Where the round back button goes. */
  back?: string | (() => void);
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Bottom bar. Omit to hide it (e.g. screens with their own call to action). Production shows only the primary action; pass `cancel` to add one. */
  footer?: { primary: FooterAction; cancel?: false | (() => void) };
  children: React.ReactNode;
  /** Content column wider than 558px (the use-case grid, 572px in Figma). */
  wide?: boolean;
  /** Centered content without the title block (e.g. Identity confirmed). */
  bare?: boolean;
  /** Mark the current step done in the rail (e.g. Identity confirmed). */
  completed?: boolean;
  /** Space between the title block and the content; varies per Figma screen. */
  headerGap?: 24 | 32 | 40 | 48 | 64;
  /** Cap the title width so it wraps where Figma wraps it (e.g. Verify email, 480). */
  titleMaxWidth?: number;
}) {
  const steps = useSteps();
  const current = steps.findIndex((s) => s.key === step);
  const router = useRouter();

  // Short windows, in two stages, so the sidebar (steps, demo card, help) always fits one screen:
  // 1. "compact": tighter spacing and a shorter demo-card image, all steps still shown;
  // 2. "collapse": also show only the current step, the next one peeking out, with "See all steps".
  // The full sidebar's height doesn't depend on the window, so it's measured once while shown in full.
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const naturalHeight = React.useRef(0);
  const [fit, setFit] = React.useState<"full" | "compact" | "collapse">("full");
  const [expanded, setExpanded] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const check = () => {
      if (fit === "full" && el.scrollHeight > el.clientHeight + 1) naturalHeight.current = el.scrollHeight;
      const natural = naturalHeight.current;
      if (!natural) return; // never overflowed: stays full
      const room = el.clientHeight;
      const next = natural <= room ? "full" : natural - COMPACT_SAVING <= room ? "compact" : "collapse";
      if (next !== fit) {
        setFit(next);
        if (next !== "collapse") setExpanded(false);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [fit]);
  const needsCollapse = fit === "collapse";
  const compact = fit !== "full";

  const goBack = () => (typeof back === "function" ? back() : back && router.push(back));

  // Sidebar, 576px column and Medium (48px) buttons follow the production app (onboarding.foren.co); the content sits in
  // Figma's rounded grey panel, inset in the white page, with a white footer bar under it.
  const column = wide ? "max-w-[476px] lg:max-w-[576px]" : "max-w-[576px]";
  return (
    <div data-hide-scrollbar className="min-h-dvh bg-canvas lg:flex">
      {/* Sidebar */}
      <aside className="hidden w-[325px] shrink-0 border-r border-line bg-surface lg:block">
        {/* Exactly one screen tall and scrolls on its own (scrollbar hidden), so it never makes the page scroll
            past the fixed footer. overscroll-contain keeps a sidebar scroll from carrying on into the page. */}
        <div ref={sidebarRef} className="sticky top-0 flex h-dvh flex-col overflow-y-auto overscroll-contain px-6 pt-8">
          <Link href="/onboarding" aria-label="Foren, formerly Leatherback: sign-up home" className="w-fit shrink-0 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <Image src={asset("/onboarding/foren-fka-leatherback.svg")} alt="" width={100} height={39} priority />
          </Link>
          <nav aria-label="Sign-up progress" className={cn("shrink-0", compact ? "mt-8" : "mt-16")}>
            <Stepper
              steps={steps}
              current={current}
              completed={completed}
              collapsed={needsCollapse && !expanded}
              collapsible={needsCollapse}
              expanded={expanded}
              onToggle={() => {
                if (expanded) sidebarRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                setExpanded(!expanded);
              }}
            />
          </nav>
          <div className={cn("mt-auto flex shrink-0 flex-col", compact ? "gap-6 pt-8" : "gap-8 pt-12")}>
            <DemoCard compact={compact} />
            <HelpButton />
          </div>
        </div>
      </aside>

      {/* Phone/tablet top: logo + progress */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface px-5 pt-4 pb-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Image src={asset("/onboarding/foren-fka-leatherback.svg")} alt="Foren, formerly Leatherback" width={80} height={31} priority />
          <Link href="/login" className="text-[13px] font-semibold text-fg-2 underline-offset-2 hover:underline">
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

      {/* Content: full-page grey from the sidebar border to the edges, with the full-width footer bar under it (production). */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex-1">
          <div className="absolute top-4 right-4 hidden items-center gap-4 lg:flex">
            <span className="text-[14px] leading-[21px] font-medium text-fg-2">Already have an account?</span>
            <ForenButton variant="secondary" size="sm" onClick={() => router.push("/login")}>
              Login
            </ForenButton>
          </div>
          <main id="main" className={cn("mx-auto w-full px-5 pt-8 pb-32 lg:px-6 lg:pb-10 lg:box-content", column)}>
            {bare ? (
              children
            ) : (
              <>
                <div className={cn("flex flex-col", back ? "gap-4" : "pt-6", { 24: "mb-6", 32: "mb-8", 40: "mb-10", 48: "mb-12", 64: "mb-16" }[headerGap])}>
                  {/* Production starts the title 24px down; the back button takes that space on screens that have one. */}
                  {back && (
                    <div className="h-6">
                      <button
                        type="button"
                        onClick={goBack}
                        aria-label="Back"
                        className="grid size-6 place-items-center rounded-full border-[0.6px] border-[rgba(0,0,0,0.07)] bg-white/10 text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        <CaretLeftIcon className="size-[14px]" aria-hidden />
                      </button>
                    </div>
                  )}
                  {title && (
                    <div className="flex flex-col gap-2">
                      <h1 className="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] text-black [font-synthesis:none]" style={titleMaxWidth ? { maxWidth: titleMaxWidth } : undefined}>
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
          <footer className="sticky bottom-0 z-10 border-t border-line bg-surface px-5 py-4 lg:px-6">
            <div className={cn("mx-auto flex w-full items-center justify-end gap-3", column)}>
              {typeof footer.cancel === "function" && (
                <ForenButton variant="outline" size="md" className="max-lg:flex-1" onClick={footer.cancel}>
                  Cancel
                </ForenButton>
              )}
              <PrimaryAction action={footer.primary} />
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

function PrimaryAction({ action }: { action: FooterAction }) {
  const router = useRouter();
  return (
    <ForenButton
      size="md"
      className="max-lg:flex-1"
      disabled={action.disabled || action.loading}
      aria-busy={action.loading || undefined}
      leadingIcon={action.loading ? <ForenSpinner size="sm" className="text-current" /> : undefined}
      onClick={() => (action.onClick ? action.onClick() : action.href && router.push(action.href))}
    >
      {action.label}
    </ForenButton>
  );
}

function Stepper({
  steps,
  current,
  completed,
  collapsed,
  collapsible,
  expanded,
  onToggle,
}: {
  steps: typeof STEPS;
  current: number;
  completed?: boolean;
  /** Show only the current step, with the next one fading out under a white overlay. */
  collapsed: boolean;
  /** The window is too short for the full list, so offer the See all steps / See less toggle. */
  collapsible: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const listId = React.useId();
  return (
    <div className="flex flex-col gap-4">
      <ol id={listId} className="flex flex-col gap-8" aria-label="Sign-up steps">
        {steps.map((s, i) => {
          const done = i < current || (i === current && completed);
          const active = i === current && !completed;
          const peek = collapsed && i === current + 1;
          // Collapsed: steps other than the current and next are hidden visually but stay in reading order.
          const hidden = collapsed && i !== current && !peek;
          return (
            <li
              key={s.key}
              className={cn(
                "flex items-start gap-3",
                hidden && "sr-only",
                peek && "pointer-events-none -mb-2 max-h-12 overflow-hidden select-none [mask-image:linear-gradient(to_bottom,black,transparent)]"
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[12px] leading-4 font-bold",
                  done ? "bg-success text-white" : active ? "bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]" : "border-[1.5px] border-line-2 text-fg-2"
                )}
              >
                {done ? <CheckBoldIcon className="size-[14px]" aria-label="Done" /> : i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className={cn("text-[14px] leading-[21px] font-medium tracking-[0.01em]", done ? "text-success" : active ? "text-fg" : "text-fg-2")}>{s.title}</span>
                <span className="text-[12px] leading-[18px] font-medium tracking-[0.01em] whitespace-pre-wrap text-fg-2">{s.description}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={onToggle}
          className="ml-9 flex w-fit items-center gap-1 rounded-[4px] text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus"
        >
          {expanded ? "See less" : "See all steps"}
          {expanded ? <CaretUpIcon className="size-3.5" aria-hidden /> : <CaretDownIcon className="size-3.5" aria-hidden />}
        </button>
      )}
    </div>
  );
}

function DemoCard({ compact }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
      <div className={cn("relative bg-[#cfecc6]", compact ? "h-16" : "h-24")}>
        <Image src={asset("/onboarding/clouds.jpg")} alt="" fill sizes="276px" className="object-cover object-top opacity-70" />
        <span className="absolute -bottom-4 left-4 grid size-8 place-items-center rounded-full border border-line bg-white text-[#3d6fb6]">
          <PlayCircleIcon className="size-5" aria-hidden />
        </span>
      </div>
      <div className="flex flex-col gap-2 px-4 pt-6 pb-4">
        <p className="text-[14px] leading-[21px] font-semibold text-fg">See Foren in action</p>
        <p className="text-[12px] leading-[18px] font-medium text-fg-3">Explore a live demo with sample data. No signup required, nothing touches your real account.</p>
        <Link
          href="/cards"
          className="mt-2 inline-flex h-12 w-fit items-center rounded-full bg-[var(--color-foren-bg-button-secondary)] px-6 text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-fg-2 outline-none hover:bg-[var(--color-foren-bg-button-secondary-hover)] focus-visible:shadow-[0_0_0_1px_var(--color-foren-bg-default),0_0_0_3px_var(--color-foren-border-focused-primary)]"
        >
          Explore demo
        </Link>
      </div>
    </div>
  );
}

export function HelpButton() {
  return (
    <div className="flex flex-col items-start gap-1 pb-8">
      <ForenButton variant="secondary" size="md" leadingIcon={<ChatCircleIcon aria-hidden />} onClick={() => toast("Support chat opens here. It isn’t part of the prototype.")}>
        Need help?
      </ForenButton>
      <p className="text-[12px] leading-[18px] font-medium text-fg-2">Chat with our support team</p>
    </div>
  );
}

// ---------------------------------------------------------------- shared form pieces

/** White rounded-24 card the Figma uses around form fields (px 16, py 24, 32 between fields). */
export function FormCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-8 rounded-[24px] bg-surface px-4 py-6", className)}>{children}</div>;
}

/** Label + control + hint, 8px apart (Figma Input). */
/**
 * Label, control, then helper text (production layout: the helper sits under the control, 8px apart).
 * `description` explains the field and always shows; `hint` is a follow-up that an error replaces.
 * `required` adds the red asterisk production uses on required labels.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  description,
  required,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  description?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">
        {label}
        {required && (
          <span aria-hidden className="text-error">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {description && <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">{description}</p>}
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

/** DS Input field (Figma 218:2615): subtle fill, no border at rest, 48px, radius 16, 12px padding; focused = solar-yellow-900 border + 6px halo. */
export const fieldCls =
  "h-12 w-full rounded-[16px] border border-transparent bg-subtle px-3 text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-fg-3 focus-visible:border-[var(--color-foren-border-active)] focus-visible:shadow-[0_0_0_6px_var(--color-foren-ring-active)] aria-[invalid=true]:border-error disabled:cursor-not-allowed disabled:border-[var(--color-foren-border-disabled)] disabled:text-fg-3";

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
