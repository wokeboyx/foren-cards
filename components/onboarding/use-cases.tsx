"use client";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { USE_CASES, type UseCaseId } from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { OnboardingFrame } from "./frame";
import { useSignupGuard } from "./guard";

/** Figma "How to use Foren" product illustrations: 24px wide, natural height. */
const ICON: Record<Exclude<UseCaseId, "team">, { file: string; h: number }> = {
  global_accounts: { file: "global-accounts", h: 25.215 },
  api: { file: "api", h: 18.786 },
  payouts: { file: "payouts", h: 22.505 },
  payment_links: { file: "payment-links", h: 24.003 },
  checkout: { file: "checkout", h: 22.505 },
  cards: { file: "cards", h: 17.304 },
  virtual_accounts: { file: "global-accounts", h: 25.215 },
  fx: { file: "fx", h: 20.648 },
  insights: { file: "insights", h: 25.21 },
};

function UseCaseIcon({ id }: { id: UseCaseId }) {
  if (id === "team")
    // Two overlapping figures, as layered in the Figma.
    return (
      <span aria-hidden className="inline-grid shrink-0 place-items-start">
        <Image src={asset("/onboarding/use-cases/team-back.svg")} alt="" width={18.276} height={23.527} className="col-start-1 row-start-1 ml-[5.72px]" />
        <Image src={asset("/onboarding/use-cases/team-front.svg")} alt="" width={18.276} height={23.527} className="col-start-1 row-start-1" />
      </span>
    );
  const { file, h } = ICON[id];
  return <Image aria-hidden src={asset(`/onboarding/use-cases/${file}.svg`)} alt="" width={24} height={h} className="shrink-0" />;
}

export function UseCases() {
  const router = useRouter();
  const ok = useSignupGuard("/onboarding/use");
  const selected = useOnboarding((s) => s.useCases);
  const set = useOnboarding((s) => s.set);
  if (!ok) return null;

  const toggle = (id: UseCaseId) => set({ useCases: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] });

  return (
    <OnboardingFrame
      headerGap={40}
      step="welcome"
      wide
      back="/onboarding"
      title="How do you want to use Foren?"
      description="Select the features you need to start. You can activate additional products or tools anytime from your settings."
      footer={{ primary: { label: "Continue", disabled: selected.length === 0, onClick: () => router.push("/onboarding/account") } }}
    >
      <fieldset>
        <legend className="sr-only">Products you’ll use</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((u) => {
            const on = selected.includes(u.id);
            return (
              <label
                key={u.id}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-5 rounded-[16px] border bg-surface p-4 transition-[border-color] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                  on ? "border-success" : "border-transparent hover:border-line"
                )}
              >
                <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(u.id)} />
                <span className="flex items-center justify-between gap-3">
                  <UseCaseIcon id={u.id} />
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] bg-surface transition-colors",
                      on ? "border-success" : "border-line"
                    )}
                  >
                    {on && <span className="size-2 rounded-full bg-success" />}
                  </span>
                </span>
                <span className="flex flex-col gap-1 tracking-[0.01em]">
                  <span className="text-[14px] leading-[21px] font-medium text-fg">{u.title}</span>
                  <span className="text-[12px] leading-[18px] font-medium text-fg-3">{u.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </OnboardingFrame>
  );
}
