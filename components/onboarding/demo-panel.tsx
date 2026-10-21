"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { RiFlaskLine } from "@remixicon/react";
import { toast } from "sonner";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import { useOnboarding, type OnboardingPreset } from "@/lib/onboarding-store";

export const SIGNUP_ROUTES: [string, string][] = [
  ["/onboarding", "Welcome and requirements"],
  ["/onboarding/use", "How you’ll use Foren"],
  ["/onboarding/account", "Create your account"],
  ["/onboarding/verify-email", "Verify email"],
  ["/onboarding/identity", "Verify identity"],
  ["/onboarding/business", "Find your business"],
  ["/onboarding/business/profile", "A few more things"],
  ["/onboarding/compliance", "Enhanced due diligence (MTO/PSP)"],
  ["/onboarding/review", "Review your details"],
  ["/onboarding/welcome", "Welcome to Foren"],
];

const PRESETS: [OnboardingPreset, string][] = [
  ["signed_up", "Signed up, nothing submitted"],
  ["in_review", "Everything submitted, in review"],
  ["changes_requested", "Compliance needs changes"],
  ["approved", "Approved"],
];

/** Prototype-only controls for sign-up: jump to a screen, load a ready-made state, pick outcomes. */
export function OnboardingDemoPanel() {
  const s = useOnboarding();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="fixed top-1/2 right-0 z-40 inline-flex h-10 -translate-y-1/2 items-center rounded-l-full bg-[var(--color-foren-bg-button-primary)] pr-2 pl-3 text-[var(--color-foren-text-inverse)] opacity-80 shadow-[var(--shadow-foren-lg)] outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-focus"
          aria-label="Open prototype demo controls"
        >
          <RiFlaskLine className="size-4" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="left"
          sideOffset={10}
          collisionPadding={12}
          className="z-50 max-h-[85dvh] w-[360px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-[24px] bg-surface p-5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
        >
          <div className="mb-1 text-[15px] font-semibold text-fg">Onboarding controls</div>
          <p className="mb-4 text-[12px] leading-[16px] text-fg-3">Test data only. Answers are saved on this device.</p>

          <Section label="Registry lookup">
            <ForenSegmentedControl
              size="sm"
              value={s.demo.lookup}
              onChange={(v) => s.setDemo({ lookup: v })} fullWidth ariaLabel="Registry lookup"
              options={[
                { value: "found", label: "Finds the business" },
                { value: "not_found", label: "Finds nothing" },
              ]}
            />
          </Section>
          <Section label="Identity check">
            <ForenSegmentedControl
              size="sm"
              value={s.demo.identity}
              onChange={(v) => s.setDemo({ identity: v })} fullWidth ariaLabel="Identity check"
              options={[
                { value: "approved", label: "Approved" },
                { value: "retry", label: "Needs a retry" },
              ]}
            />
          </Section>

          <Section label="Go to a sign-up screen">
            <ul className="grid gap-1">
              {SIGNUP_ROUTES.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} onClick={() => setOpen(false)} className="block rounded-[10px] px-2 py-1.5 text-[13px] font-medium text-fg-2 hover:bg-subtle hover:text-fg">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section label="Jump to after sign-up (Nigerian company)">
            <div className="grid gap-2">
              {PRESETS.map(([p, label]) => (
                <ForenButton
                  key={p}
                  variant="secondary"
                  size="xs"
                  className="justify-start"
                  onClick={() => {
                    s.loadPreset(p);
                    setOpen(false);
                    router.push("/get-started");
                  }}
                >
                  {label}
                </ForenButton>
              ))}
            </div>
          </Section>

          <ForenButton
            variant="outline"
            size="xs"
            className="mt-2 w-full"
            onClick={() => {
              s.reset();
              setOpen(false);
              router.push("/onboarding");
              toast("Sign-up reset");
            }}
          >
            Start sign-up again
          </ForenButton>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[12px] font-semibold tracking-[0.01em] text-fg-3 uppercase">{label}</div>
      {children}
    </div>
  );
}
