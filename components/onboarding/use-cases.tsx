"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  RiBankCardLine,
  RiBankLine,
  RiBarChart2Line,
  RiBuilding2Line,
  RiCodeSSlashLine,
  RiExchangeLine,
  RiLinksLine,
  RiSendPlaneLine,
  RiShoppingBag3Line,
  RiTeamLine,
} from "@remixicon/react";
import { USE_CASES, type UseCaseId } from "@/domain/onboarding";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { OnboardingFrame } from "./frame";
import { useSignupGuard } from "./guard";

const ICON: Record<UseCaseId, React.ComponentType<{ className?: string }>> = {
  global_accounts: RiBankLine,
  api: RiCodeSSlashLine,
  payouts: RiSendPlaneLine,
  payment_links: RiLinksLine,
  checkout: RiShoppingBag3Line,
  cards: RiBankCardLine,
  virtual_accounts: RiBuilding2Line,
  fx: RiExchangeLine,
  insights: RiBarChart2Line,
  team: RiTeamLine,
};

export function UseCases() {
  const router = useRouter();
  const ok = useSignupGuard("/onboarding/use");
  const selected = useOnboarding((s) => s.useCases);
  const set = useOnboarding((s) => s.set);
  if (!ok) return null;

  const toggle = (id: UseCaseId) => set({ useCases: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] });

  return (
    <OnboardingFrame
      step="welcome"
      wide
      back="/onboarding"
      title="How do you want to use Foren?"
      description="Select all that apply. Your choice shapes your Foren experience, and you can add more later."
      footer={{ primary: { label: "Continue", disabled: selected.length === 0, onClick: () => router.push("/onboarding/account") } }}
    >
      <fieldset>
        <legend className="sr-only">Products you’ll use</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {USE_CASES.map((u) => {
            const on = selected.includes(u.id);
            const Icon = ICON[u.id];
            return (
              <label
                key={u.id}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-4 rounded-[16px] border bg-surface p-4 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                  on ? "border-success shadow-[var(--shadow-foren-xs)]" : "border-transparent hover:border-line"
                )}
              >
                <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(u.id)} />
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-4 right-4 grid size-4 place-items-center rounded-full border transition-colors",
                    on ? "border-success" : "border-line-2"
                  )}
                >
                  {on && <span className="size-2 rounded-full bg-success" />}
                </span>
                <Icon className={cn("size-6", on ? "text-success" : "text-fg-2")} aria-hidden />
                <span className="flex flex-col gap-1 pr-4">
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
