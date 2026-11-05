"use client";
import { useSignupGuard } from "./guard";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BellIcon, ChatTextIcon, ClockIcon, FileTextIcon, ShieldCheckIcon, UserIcon, UsersThreeIcon } from "@/components/icons";
import { LinkButton } from "@/components/link-button";
import { asset } from "@/lib/base-path";
import { checklist, useOnboarding } from "@/lib/onboarding-store";

/** "Welcome to Foren." after sign-up (Figma 3035:75292 / 3240:69245). Full page, no step rail. */
export function Welcome() {
  const ready = useSignupGuard("/onboarding/welcome");
  const router = useRouter();
  const s = useOnboarding();
  const signedUp = !!s.signedUpAt;

  React.useEffect(() => {
    if (ready && !signedUp) router.replace("/onboarding/review");
  }, [ready, signedUp, router]);

  if (!ready || !signedUp || !s.business) return null;

  const ids = new Set(checklist(s).map((i) => i.id));
  const tasks = [
    ids.has("documents") && { icon: FileTextIcon, label: "Upload your documents", time: "~5 min" },
    ids.has("stakeholders") && { icon: UsersThreeIcon, label: "Add management & ownership", time: "~4 min" },
    ids.has("questionnaire") && { icon: ChatTextIcon, label: "Answer a short questionnaire", time: "~3 min" },
    { icon: ShieldCheckIcon, label: "Pass compliance review", time: "1–2 days" },
  ].filter(Boolean) as { icon: typeof FileTextIcon; label: string; time: string }[];
  const count = ["", "one", "two", "three", "four", "five"][tasks.length] ?? String(tasks.length);

  return (
    <div className="min-h-dvh bg-surface p-0 lg:p-2">
      <div className="relative min-h-dvh overflow-hidden bg-canvas lg:min-h-[calc(100dvh-16px)] lg:rounded-[20px]">
        {/* Soft pink wash with a hint of green, as in the Figma frame. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-[radial-gradient(60%_120%_at_50%_-20%,#f9dcdc_0%,transparent_70%),radial-gradient(30%_80%_at_0%_10%,#d8f1cf_0%,transparent_70%)] opacity-90"
        />
        <header className="relative flex items-center justify-between px-5 pt-5 lg:px-6 lg:pt-6">
          <Image src={asset("/onboarding/foren-fka-leatherback.svg")} alt="Foren, formerly Leatherback" width={100} height={39} priority />
          <div className="flex items-center gap-3 text-fg">
            <span className="grid size-7 place-items-center rounded-[8px] border border-line bg-surface shadow-[var(--shadow-foren-sm)]" aria-hidden>
              <BellIcon className="size-4" />
            </span>
            <span className="grid size-7 place-items-center rounded-full ring-2 ring-[var(--color-foren-brand-green)]/40" aria-hidden>
              <span className="grid size-6 place-items-center rounded-full bg-[var(--color-foren-text-inverse)]">
                <UserIcon className="size-4" />
              </span>
            </span>
          </div>
        </header>

        {/* Figma "Welcome": 446px column; the banner (128px, top radius 32) runs 21px under the white card. */}
        <main id="main" className="relative mx-auto flex w-full max-w-[486px] flex-col gap-[21px] px-5 pt-16 pb-16 lg:pt-[196px]">
          <div className="flex flex-col animate-[rise-in_300ms_ease-out]">
            <div className="relative -mb-[21px] h-[128px] overflow-hidden rounded-t-[32px]">
              <Image src={asset("/onboarding/welcome-texture.jpg")} alt="" fill sizes="446px" className="object-cover" />
              <Image src={asset("/onboarding/coins.png")} alt="" width={540} height={540} className="absolute top-[-182px] left-1/2 max-w-none -translate-x-1/2 object-contain opacity-90" />
            </div>
            <div className="relative flex flex-col gap-8 rounded-[24px] bg-surface px-4 py-10">
              <div className="flex flex-col gap-2 text-center">
                <h1 className="font-display text-[18px] leading-[28px] font-semibold text-black [font-synthesis:none]">Welcome to Foren.</h1>
                <p className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg-2">
                  Your details are in, <span className="font-semibold text-fg">{s.business.name}</span>.
                  <br />
                  Activate your account to open your dashboard and finish the last {count} steps.
                </p>
              </div>
              <ul className="flex flex-col gap-4" aria-label="Steps left">
                {tasks.map((t) => (
                  <li key={t.label} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-info-subtle text-info" aria-hidden>
                      <t.icon className="size-[14px]" />
                    </span>
                    <span className="flex-1 text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">{t.label}</span>
                    <span className="inline-flex h-6 shrink-0 items-center gap-0.5 rounded-full bg-[var(--color-foren-bg-button-secondary)] pr-1.5 pl-1 text-[11px] leading-4 font-medium tracking-[0.01em] text-fg-2">
                      <ClockIcon className="size-[14px]" aria-hidden />
                      {t.time}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <LinkButton href="/cards" variant="secondary" size="xs" className="sm:min-w-[130px]">
              Explore features
            </LinkButton>
            <LinkButton href="/get-started" size="xs" className="sm:min-w-[160px]">
              Activate my account
            </LinkButton>
          </div>
        </main>
      </div>
    </div>
  );
}
