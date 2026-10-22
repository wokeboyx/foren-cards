"use client";
// Onboarding state for the prototype: sign-up answers, the business, stakeholders, documents and
// review status. Kept apart from the cards store so "Reset demo" there doesn't wipe a sign-up.
import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  isNewBusiness,
  isScumlCategory,
  requirementsFor,
  type ControlType,
  type CountryCode,
  type EntityType,
  type RequirementContext,
  type UseCaseId,
} from "@/domain/onboarding";

export type Business = {
  name: string;
  regType?: string;
  regNumber: string;
  /** ISO date. */
  incorporatedOn: string;
  companyType: string;
  address: string;
  /** Found in the registry, or typed in by hand (then compliance checks it). */
  source: "registry" | "manual";
};

export type Profile = { turnover: string; sector: string; category: string; website: string; notTrading: boolean };

export type StakeholderStatus = "not_sent" | "pending" | "action_required" | "verified";
export type Stakeholder = {
  id: string;
  /** A person, or a company that holds shares (indirect ownership). Companies aren't sent a verification link. */
  kind: "person" | "company";
  /** Company name goes in firstName (lastName stays empty), so names and avatars work the same for both. */
  firstName: string;
  lastName: string;
  /** Set on a person who owns the business through this company stakeholder; their ownership is their % of it. */
  parentId?: string;
  /** Companies only. */
  regNumber: string;
  /** Companies only: ISO country code of registration. */
  regCountry: string;
  email: string;
  position: string;
  /** ISO date. Asked in the app; their ID is the proof. Empty until added (registry records don't carry it). */
  dob: string;
  /** ISO country code. */
  nationality: string;
  director: boolean;
  shareholder: boolean;
  /** Percent, 0–100. */
  ownership: number;
  signatory: boolean;
  /** Has significant control without owning enough to be a UBO (named when no one owns 10% or more). */
  controller: boolean;
  /** Nature of control, required for UBOs and controllers. */
  control: ControlType[];
  /** Describes "other" control. */
  controlOther: string;
  /** Listed in the registry, or added by the user. */
  source: "registry" | "added";
  status: StakeholderStatus;
  note?: string;
};

export type DocStatus = "uploaded" | "in_review" | "needs_attention" | "accepted";
export type UploadedDoc = { fileName: string; sizeKb: number; status: DocStatus; note?: string };

export type TaskStatus = "not_started" | "in_progress" | "submitted" | "action_required" | "verified";

export type Edd = Record<string, string | string[]>;

/** The digital Director and UBO declaration, confirmed with a tick instead of a signature. */
export type Declaration = { confirmedAt: string; name: string; email: string; position: string; phone: string };

/** Prototype-only switches for outcomes we can't produce for real. */
export type OnboardingDemo = {
  lookup: "found" | "not_found";
  identity: "approved" | "retry";
};

export type OnboardingState = State;
type State = {
  country: CountryCode | null;
  entity: EntityType | null;
  useCases: UseCaseId[];
  waitlist: { country: string; email: string } | null;

  email: string;
  firstName: string;
  lastName: string;
  /** Job title and phone of the person signing up, who is the authorised representative on the declaration. */
  position: string;
  phone: string;
  emailVerified: boolean;
  identityVerified: boolean;

  business: Business | null;
  profile: Profile | null;
  edd: Edd;
  edd_done: boolean;
  /** Sign-up finished; the account exists with limited access. */
  signedUpAt: string | null;

  stakeholders: Stakeholder[];
  stakeholdersSubmitted: boolean;
  /** Ticked on Stakeholders: no individual owns the threshold or more, so a controller is named instead. */
  noMajorOwner: boolean;
  declaration: Declaration | null;
  invitesSentAt: string | null;
  documents: Record<string, UploadedDoc>;
  documentsSubmitted: boolean;
  questionnaire: Record<string, string>;
  questionnaireSubmitted: boolean;
  /** Compliance review of everything submitted. */
  review: "none" | "in_review" | "changes_requested" | "approved";

  demo: OnboardingDemo;
};

type Actions = {
  set: (patch: Partial<State>) => void;
  setDemo: (patch: Partial<OnboardingDemo>) => void;
  upsertStakeholder: (s: Stakeholder) => void;
  removeStakeholder: (id: string) => void;
  patchStakeholder: (id: string, patch: Partial<Stakeholder>) => void;
  setDocument: (reqId: string, doc: UploadedDoc | null) => void;
  reset: () => void;
  /** Jump to a ready-made point in the journey (demo panel). */
  loadPreset: (preset: OnboardingPreset) => void;
};

export type OnboardingPreset = "signed_up" | "in_review" | "changes_requested" | "approved";

const INITIAL: State = {
  country: null,
  entity: null,
  useCases: [],
  waitlist: null,
  email: "",
  firstName: "",
  lastName: "",
  position: "",
  phone: "",
  emailVerified: false,
  identityVerified: false,
  business: null,
  profile: null,
  edd: {},
  edd_done: false,
  signedUpAt: null,
  stakeholders: [],
  stakeholdersSubmitted: false,
  noMajorOwner: false,
  declaration: null,
  invitesSentAt: null,
  documents: {},
  documentsSubmitted: false,
  questionnaire: {},
  questionnaireSubmitted: false,
  review: "none",
  demo: { lookup: "found", identity: "approved" },
};

/** Sample business returned by the registry lookup, per country. */
export function registryBusiness(country: CountryCode, regType: string | undefined, regNumber: string): Business {
  const byCountry: Record<CountryCode, Omit<Business, "regNumber" | "regType" | "source">> = {
    NG: { name: "Karaya Pharmaceuticals Limited", incorporatedOn: "2019-03-12", companyType: "Private Limited Company", address: "14 Marina Road, Lagos Island, Lagos" },
    GB: { name: "Karaya Pharmaceuticals Ltd", incorporatedOn: "2019-03-12", companyType: "Private Limited Company", address: "20 Wenlock Road, London N1 7GU" },
    CA: { name: "Karaya Pharmaceuticals Inc.", incorporatedOn: "2019-03-12", companyType: "Federal corporation", address: "100 King Street West, Toronto, ON M5X 1A9" },
    KE: { name: "Karaya Pharmaceuticals Limited", incorporatedOn: "2019-03-12", companyType: "Private company", address: "Westlands Road, Nairobi" },
  };
  return { ...byCountry[country], regType, regNumber, source: "registry" };
}

/** Defaults for a new person stakeholder. */
export const PERSON: Omit<Stakeholder, "id" | "firstName" | "lastName" | "email" | "position" | "source" | "status"> = {
  kind: "person",
  regNumber: "",
  regCountry: "",
  dob: "",
  nationality: "",
  director: false,
  shareholder: false,
  ownership: 0,
  signatory: false,
  controller: false,
  control: [],
  controlOther: "",
};

/** Directors on the registry record, offered as stakeholders. Ownership, date of birth and nationality are missing until the user adds them. */
export function registryStakeholders(): Stakeholder[] {
  return [
    { ...PERSON, id: "sh_david", firstName: "David", lastName: "Oyelowo", email: "david@karayapharma.com", position: "Director", dob: "", nationality: "", director: true, shareholder: true, ownership: 0, signatory: true, source: "registry", status: "not_sent" },
    { ...PERSON, id: "sh_mariam", firstName: "Mariam", lastName: "Odunwale", email: "mariam@karayapharma.com", position: "Director", dob: "", nationality: "", director: true, shareholder: true, ownership: 0, signatory: false, source: "registry", status: "not_sent" },
  ];
}

export const useOnboarding = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      set: (patch) => set(patch),
      setDemo: (patch) => set((s) => ({ demo: { ...s.demo, ...patch } })),
      upsertStakeholder: (s) =>
        set((st) => ({ stakeholders: st.stakeholders.some((x) => x.id === s.id) ? st.stakeholders.map((x) => (x.id === s.id ? s : x)) : [...st.stakeholders, s] })),
      // Removing a company also removes the people listed as its owners.
      removeStakeholder: (id) => set((st) => ({ stakeholders: st.stakeholders.filter((x) => x.id !== id && x.parentId !== id) })),
      patchStakeholder: (id, patch) => set((st) => ({ stakeholders: st.stakeholders.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      setDocument: (reqId, doc) =>
        set((st) => {
          const documents = { ...st.documents };
          if (doc) documents[reqId] = doc;
          else delete documents[reqId];
          return { documents };
        }),
      reset: () => set({ ...INITIAL, demo: get().demo }),
      loadPreset: (preset) => {
        const base: Partial<State> = {
          country: "NG",
          entity: "company",
          useCases: ["global_accounts", "payouts", "cards"],
          email: "ayodele@karayapharma.com",
          firstName: "Ayodele",
          lastName: "Owoetoni",
          position: "Finance Director",
          phone: "+234 803 555 0142",
          emailVerified: true,
          identityVerified: true,
          business: registryBusiness("NG", "RC", "1234567"),
          profile: { turnover: "1M – 5M", sector: "Healthcare", category: "Pharmacy and drugs", website: "https://karayapharma.com", notTrading: false },
          signedUpAt: new Date().toISOString(),
        };
        if (preset === "signed_up") return set({ ...INITIAL, ...base, demo: get().demo });
        const ctx = contextOf({ ...INITIAL, ...base } as State)!;
        const docs: Record<string, UploadedDoc> = {};
        for (const r of requirementsFor(ctx).filter((r) => r.source === "upload" && !r.optional))
          docs[r.id] = { fileName: `${r.id.replace(/_/g, "-")}.pdf`, sizeKb: 420, status: preset === "approved" ? "accepted" : "in_review" };
        const people: Stakeholder[] = [
          { ...registryStakeholders()[0], dob: "1978-06-14", nationality: "NG", ownership: 30, control: ["shares", "voting"], status: "verified" },
          { ...registryStakeholders()[1], dob: "1985-02-03", nationality: "NG", ownership: 20, control: ["shares", "voting"], status: preset === "changes_requested" ? "action_required" : "verified", note: preset === "changes_requested" ? "The ID photo was too blurry to read. Ask Mariam to retake it in good light." : undefined },
          { ...PERSON, id: "sh_ryan", firstName: "Ryan", lastName: "Adeyemi", email: "ryan@karayapharma.com", position: "Investor", dob: "1990-11-21", nationality: "GB", shareholder: true, ownership: 50, control: ["shares"], source: "added", status: "verified" },
        ];
        if (preset === "changes_requested")
          docs.cac_certificate = { fileName: "cac-certificate.pdf", sizeKb: 380, status: "needs_attention", note: "This certificate is no longer valid. Upload a current, certified true copy." };
        set({
          ...INITIAL,
          ...base,
          stakeholders: people,
          stakeholdersSubmitted: true,
          declaration: { confirmedAt: new Date().toISOString(), name: "Ayodele Owoetoni", email: "ayodele@karayapharma.com", position: "Finance Director", phone: "+234 803 555 0142" },
          invitesSentAt: new Date().toISOString(),
          documents: docs,
          documentsSubmitted: true,
          questionnaire: { volume: "NGN 2 million", frequency: "1–100", hasWebsite: "Yes", website: "https://karayapharma.com", use: "Paying suppliers and staff salaries" },
          questionnaireSubmitted: true,
          review: preset === "approved" ? "approved" : preset === "changes_requested" ? "changes_requested" : "in_review",
          demo: get().demo,
        });
      },
    }),
    {
      name: "foren-onboarding-v1",
      // Saved sign-ups from before newer stakeholder fields existed: fill the gaps so they show as missing, not crash.
      merge: (saved, current) => {
        const s = saved as Partial<State> | undefined;
        return { ...current, ...s, stakeholders: (s?.stakeholders ?? []).map((p) => ({ ...PERSON, ...p })) };
      },
    }
  )
);

// ---------------------------------------------------------------- derived

/** % of the business a stakeholder owns: directly, or through a company stakeholder (parent % × their % of it). */
export function effectiveOwnership(p: Stakeholder, all: Stakeholder[]): number {
  if (p.parentId) {
    const parent = all.find((x) => x.id === p.parentId);
    return parent ? Math.round(((parent.ownership * p.ownership) / 100) * 100) / 100 : 0;
  }
  return p.shareholder || p.kind === "company" ? p.ownership : 0;
}

/** Individuals who are ultimate beneficial owners: own the threshold or more, directly or indirectly. */
export const ubosOf = (all: Stakeholder[], threshold: number) => all.filter((p) => p.kind === "person" && effectiveOwnership(p, all) >= threshold);

/** People who get a verification link (companies don't). */
export const peopleOf = (all: Stakeholder[]) => all.filter((p) => p.kind === "person");

export function contextOf(s: Pick<State, "country" | "entity" | "business" | "profile" | "useCases">): RequirementContext | null {
  if (!s.country || !s.entity) return null;
  const api = s.useCases.includes("api");
  return {
    country: s.country,
    entity: s.entity,
    newBusiness: isNewBusiness(s.business?.incorporatedOn) || !!s.profile?.notTrading,
    scuml: s.country === "NG" && isScumlCategory(s.profile?.sector, s.profile?.category),
    api,
    banking: !api || s.useCases.length > 1,
  };
}

export function useRequirementContext() {
  const country = useOnboarding((s) => s.country);
  const entity = useOnboarding((s) => s.entity);
  const business = useOnboarding((s) => s.business);
  const profile = useOnboarding((s) => s.profile);
  const useCases = useOnboarding((s) => s.useCases);
  return React.useMemo(() => contextOf({ country, entity, business, profile, useCases }), [country, entity, business, profile, useCases]);
}

export type ChecklistItem = {
  id: "stakeholders" | "verification" | "documents" | "questionnaire";
  title: string;
  description: string;
  href: string;
  status: TaskStatus;
};

/** The "Complete your account setup" list. Sole traders have no stakeholders: they verified themselves at sign-up. */
export function checklist(s: State): ChecklistItem[] {
  const ctx = contextOf(s);
  if (!ctx) return [];
  const items: ChecklistItem[] = [];
  if (ctx.entity !== "sole_trader") {
    items.push({
      id: "stakeholders",
      title: "Stakeholders and structure",
      description: "Add your directors, owners and signatories, then confirm the declaration.",
      href: "/get-started/stakeholders",
      status: s.stakeholdersSubmitted ? (s.review === "approved" ? "verified" : "submitted") : s.stakeholders.length ? "in_progress" : "not_started",
    });
    const people = peopleOf(s.stakeholders);
    items.push({
      id: "verification",
      title: "Stakeholder verification",
      description: "Each person verifies their ID with a link we email them.",
      href: "/get-started/verification",
      status: !s.invitesSentAt
        ? "not_started"
        : people.some((p) => p.status === "action_required")
          ? "action_required"
          : people.length && people.every((p) => p.status === "verified")
            ? "verified"
            : "in_progress",
    });
  }
  const docs = requirementsFor(ctx).filter((r) => r.source === "upload" && !r.optional);
  const uploaded = docs.filter((r) => s.documents[r.id]);
  items.push({
    id: "documents",
    title: "Business documents",
    description: "Upload your registration and supporting documents.",
    href: "/get-started/documents",
    status: docs.some((r) => s.documents[r.id]?.status === "needs_attention")
      ? "action_required"
      : s.documentsSubmitted
        ? s.review === "approved"
          ? "verified"
          : "submitted"
        : uploaded.length
          ? "in_progress"
          : "not_started",
  });
  if (requirementsFor(ctx).some((r) => r.source === "questionnaire"))
    items.push({
      id: "questionnaire",
      title: "Onboarding questionnaire",
      description: ctx.api && !ctx.banking ? "Tell us what you’ll build with our API." : "A few questions about how you’ll use your account.",
      href: "/get-started/questionnaire",
      status: s.questionnaireSubmitted ? (s.review === "approved" ? "verified" : "submitted") : Object.keys(s.questionnaire).length ? "in_progress" : "not_started",
    });
  return items;
}

/** Whether the account is still in onboarding (show "Get started" in the sidebar). */
export const isOnboarding = (s: Pick<State, "signedUpAt" | "review">) => !!s.signedUpAt && s.review !== "approved";
