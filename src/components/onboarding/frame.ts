import { computed } from "vue";
import { useOnboardingStore } from "@/stores/onboarding";

/**
 * Sign-up layout from the Foren Business Banking Figma ("Sole Trader / corporate" sections):
 * a 325px rail with the wordmark, numbered steps, demo card and help; content in an inset sunken
 * panel (558px column) with "Already have an account?" at the top; a 72px action bar at the bottom.
 * Phones: wordmark + step progress on top, content full width, the action bar pinned to the bottom.
 */

export type StepKey = "welcome" | "account" | "identity" | "business" | "edd";

export type Step = { key: StepKey; title: string; description: string };

const STEPS: Step[] = [
  {
    key: "welcome",
    title: "Welcome and requirements",
    description:
      "Select your country and entity type to view setup requirements  ~2 mins",
  },
  {
    key: "account",
    title: "Account setup",
    description: "Set up secure login credentials and verify your email",
  },
  {
    key: "identity",
    title: "Identity verification",
    description: "Confirm your identity as the primary account manager",
  },
  {
    key: "business",
    title: "Business details",
    description: "Enter company registration details to verify your business",
  },
  {
    key: "edd",
    title: "Enhanced due diligence",
    description:
      "Provide regulatory, operational and AML information about your business",
  },
];

/** Sign-up steps for the chosen entity (enhanced due diligence is MTO/PSP only). */
export function useSteps() {
  const store = useOnboardingStore();
  return computed(() =>
    STEPS.filter((s) => s.key !== "edd" || store.entity === "mto"),
  );
}

export type FooterAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
};

/** Bottom bar. `cancel: false` hides Cancel; a function replaces the "Leave sign-up?" dialog. */
export type FrameFooter = {
  primary: FooterAction;
  cancel?: false | (() => void);
};

/** Figma text field: subtle fill, 48px, radius 16, 12px padding. */
export const fieldCls =
  "h-12 w-full rounded-[16px] border border-line bg-subtle px-3 text-[14px] leading-[21px] font-medium text-fg outline-none placeholder:text-fg-3 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20 aria-[invalid=true]:border-error disabled:text-fg-disabled";
