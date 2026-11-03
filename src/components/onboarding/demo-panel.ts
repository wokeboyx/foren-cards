import type { OnboardingPreset } from "@/stores/onboarding";

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

export const PRESETS: [OnboardingPreset, string][] = [
  ["signed_up", "Signed up, nothing submitted"],
  ["in_review", "Everything submitted, in review"],
  ["changes_requested", "Compliance needs changes"],
  ["approved", "Approved"],
];
