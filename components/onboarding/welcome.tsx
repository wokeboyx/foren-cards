"use client";
import { useSignupGuard } from "./guard";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RiFileTextLine, RiNotification3Line, RiQuestionnaireLine, RiShieldCheckLine, RiTeamLine, RiTimeLine, RiUserLine } from "@remixicon/react";
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
    ids.has("documents") && { icon: RiFileTextLine, label: "Upload your documents", time: "~5 min" },
    ids.has("stakeholders") && { icon: RiTeamLine, label: "Add management & ownership", time: "~4 min" },
    ids.has("questionnaire") && { icon: RiQuestionnaireLine, label: "Answer a short questionnaire", time: "~3 min" },
    { icon: RiShieldCheckLine, label: "Pass compliance review", time: "1–2 days" },
  ].filter(Boolean) as { icon: typeof RiFileTextLine; label: string; time: string }[];
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
          <Image src={asset("/onboarding/foren-wordmark.svg")} alt="Foren" width={100} height={24} priority />
          <div className="flex items-center gap-3 text-fg">
            <span className="grid size-8 place-items-center rounded-full bg-surface ring-1 ring-line" aria-hidden>
              <RiNotification3Line className="size-4" />
            </span>
            <span className="grid size-8 place-items-center rounded-full bg-surface ring-1 ring-line" aria-hidden>
              <RiUserLine className="size-4" />
            </span>
          </div>
        </header>

        <main id="main" className="relative mx-auto flex w-full max-w-[400px] flex-col gap-4 px-5 pt-16 pb-16 lg:pt-[120px]">
          <div className="overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-foren-xs)] ring-1 ring-line animate-[rise-in_300ms_ease-out]">
            <div className="relative h-[110px] overflow-hidden">
              <Image src={asset("/onboarding/welcome-texture.jpg")} alt="" fill sizes="400px" className="object-cover" />
              <Image src={asset("/onboarding/coins.png")} alt="" width={420} height={420} className="absolute top-[-128px] left-1/2 max-w-none -translate-x-1/2 object-contain" />
            </div>
            <div className="flex flex-col gap-6 px-4 pt-6 pb-5">
              <div className="flex flex-col gap-2 text-center">
                <h1 className="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">Welcome to Foren.</h1>
                <p className="text-[14px] leading-[21px] font-medium text-fg-2">
                  Your details are in, <span className="font-semibold text-fg">{s.business.name}</span>. Activate your account to open your dashboard and finish the last {count} steps.
                </p>
              </div>
              <ul className="flex flex-col gap-3" aria-label="Steps left">
                {tasks.map((t) => (
                  <li key={t.label} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-info-subtle text-info" aria-hidden>
                      <t.icon className="size-[14px]" />
                    </span>
                    <span className="flex-1 text-[14px] leading-[21px] font-medium text-fg">{t.label}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-[12px] font-medium text-fg-3">
                      <RiTimeLine className="size-3" aria-hidden />
                      {t.time}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <LinkButton href="/cards" variant="outline" size="xs">
              Explore features
            </LinkButton>
            <LinkButton href="/get-started" size="xs">
              Activate my account
            </LinkButton>
          </div>
        </main>
      </div>
    </div>
  );
}
