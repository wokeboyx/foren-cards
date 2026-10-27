"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { countryInfo } from "@/domain/onboarding";
import { useOnboarding, type OnboardingState } from "@/lib/onboarding-store";

/** Sign-up screens in order, with what each needs before it can be shown. */
const ORDER: { href: string; ready: (s: OnboardingState) => boolean }[] = [
  { href: "/onboarding", ready: () => true },
  { href: "/onboarding/use", ready: (s) => !!s.country && !!s.entity && !!countryInfo(s.country)?.entities.includes(s.entity) },
  { href: "/onboarding/account", ready: (s) => s.useCases.length > 0 },
  { href: "/onboarding/verify-email", ready: (s) => !!s.email && !!s.firstName && !!s.lastName },
  { href: "/onboarding/identity", ready: (s) => s.emailVerified },
  { href: "/onboarding/identity/confirmed", ready: (s) => s.identityVerified },
  { href: "/onboarding/business", ready: (s) => s.identityVerified },
  { href: "/onboarding/business/profile", ready: (s) => !!s.business },
  // Enhanced due diligence is MTO/PSP only; the page itself sends everyone else on to review.
  { href: "/onboarding/compliance", ready: (s) => !!s.profile },
  { href: "/onboarding/review", ready: (s) => !!s.profile && (s.entity !== "mto" || s.edd_done) },
  { href: "/onboarding/welcome", ready: (s) => !!s.signedUpAt },
];

/** The earliest screen up to `href` whose prerequisites aren't met, or null when `href` can be shown. */
export function blockedBy(s: OnboardingState, href: string): string | null {
  const idx = ORDER.findIndex((o) => o.href === href);
  for (let i = 1; i <= idx; i++) if (!ORDER[i].ready(s)) return ORDER[i - 1].href;
  return null;
}

/** Sends people back to the first unfinished step if they land on a later one (deep link, refresh). */
export function useSignupGuard(href: string) {
  const router = useRouter();
  const redirect = useOnboarding((s) => blockedBy(s, href));
  React.useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);
  return !redirect;
}
