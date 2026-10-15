"use client";
// Prototype data store. Everything is test data, persisted to localStorage so a usability
// session survives a refresh. "Reset demo" in the demo panel restores the seed.
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { POLICY } from "@/config/policy";
import { planGoal } from "@/domain/autofx";
import { DEFAULT_USD_RATES, setRates, USD_RATES } from "@/domain/money";
import type {
  AutoFxGoal,
  Balance,
  Card,
  CardRequest,
  Currency,
  Money,
  CardDraft,
  Notification,
  Person,
  Role,
  Subscription,
  Transaction,
} from "@/domain/types";
import { PEOPLE, PERSONAL_USER, sampleGoals, seed, type SeedState } from "@/fixtures/seed";
import { personalSeed, samplePersonal } from "@/fixtures/personal";

export type DemoSettings = {
  latencyMs: number;
  failLoads: boolean;
  failSaves: boolean;
  clockOffsetMs: number;
  personalEnabled: boolean;
};

type Data = SeedState & {
  personalBalances: Balance[];
  rates: Record<Currency, number>;
};

type State = Data & {
  role: Role;
  demo: DemoSettings;
  hydrated: boolean;
};

type Actions = {
  setRole: (r: Role) => void;
  setDemo: (d: Partial<DemoSettings>) => void;
  advanceClock: (minutes: number) => void;
  resetDemo: () => void;
  emptyAccount: () => void;

  upsertCard: (c: Card) => void;
  patchCard: (id: string, patch: Partial<Card>) => void;
  invitePerson: (p: Person) => void;

  recordTransaction: (t: Transaction, opts?: { debit?: boolean }) => void;
  patchTransaction: (id: string, patch: Partial<Transaction>) => void;
  saveCardDraft: (d: CardDraft) => void;
  deleteCardDraft: (id: string) => void;

  addRequest: (r: CardRequest) => void;
  patchRequest: (id: string, patch: Partial<CardRequest>) => void;

  patchSubscription: (id: string, patch: Partial<Subscription>) => void;

  addGoal: (g: AutoFxGoal) => void;
  removeGoal: (id: string) => void;
  loadSampleGoals: () => void;
  runAutoFx: () => number;
  setRate: (c: Currency, v: number) => void;
  adjustBalance: (c: Currency, deltaMinor: number) => void;
  scaleBalances: (factor: number) => void;
  loadSamplePersonal: () => void;

  notify: (n: Omit<Notification, "id" | "at" | "read">) => void;
  markAllRead: (role: Role) => void;
};

const initialData = (): Data => {
  const b = seed();
  const p = personalSeed();
  return {
    ...b,
    personalBalances: p.balances,
    cards: [...b.cards, ...p.cards],
    transactions: [...b.transactions, ...p.transactions].sort((x, y) => y.at.localeCompare(x.at)),
    subscriptions: [...b.subscriptions, ...p.subscriptions],
    rates: { ...DEFAULT_USD_RATES },
  };
};

const DEFAULT_DEMO: DemoSettings = {
  latencyMs: 500,
  failLoads: false,
  failSaves: false,
  clockOffsetMs: 0,
  personalEnabled: false,
};

let idSeq = 0;
export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(++idSeq).toString(36)}`;

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialData(),
      role: "owner",
      demo: DEFAULT_DEMO,
      hydrated: false,

      setRole: (role) => set({ role }),
      setDemo: (d) => set((s) => ({ demo: { ...s.demo, ...d } })),
      advanceClock: (minutes) => set((s) => ({ demo: { ...s.demo, clockOffsetMs: s.demo.clockOffsetMs + minutes * 60_000 } })),
      resetDemo: () => {
        setRates(DEFAULT_USD_RATES);
        set({ ...initialData(), demo: { ...DEFAULT_DEMO, personalEnabled: get().demo.personalEnabled } });
      },

      emptyAccount: () =>
        set((s) => {
          const personalIds = new Set(s.cards.filter((c) => c.personal).map((c) => c.id));
          return {
            cards: s.cards.filter((c) => c.personal),
            transactions: s.transactions.filter((t) => personalIds.has(t.cardId)),
            subscriptions: s.subscriptions.filter((x) => personalIds.has(x.cardId)),
            requests: [],
            notifications: [],
            cardDrafts: [],
          };
        }),

      upsertCard: (c) =>
        set((s) => ({ cards: s.cards.some((x) => x.id === c.id) ? s.cards.map((x) => (x.id === c.id ? c : x)) : [c, ...s.cards] })),
      patchCard: (id, patch) => set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      invitePerson: (p) => set((s) => ({ invitedPeople: [...s.invitedPeople, p] })),
      patchTransaction: (id, patch) => set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      saveCardDraft: (d) => set((s) => ({ cardDrafts: [d, ...s.cardDrafts.filter((x) => x.id !== d.id)] })),
      deleteCardDraft: (id) => set((s) => ({ cardDrafts: s.cardDrafts.filter((x) => x.id !== id) })),

      recordTransaction: (t, opts) =>
        set((s) => {
          const card = s.cards.find((c) => c.id === t.cardId);
          const personal = card?.personal;
          const key = personal ? "personalBalances" : "balances";
          let balances = s[key];
          if (opts?.debit !== false && t.status === "approved") {
            balances = balances.map((b) => {
              const out = t.legs
                .filter((l) => l.source.kind === "balance" && l.source.currency === b.currency)
                .reduce((sum, l) => sum + l.debit.minor, 0);
              return out ? { ...b, available: { ...b.available, minor: b.available.minor - out } } : b;
            });
          }
          return { transactions: [t, ...s.transactions], [key]: balances } as Partial<State>;
        }),

      addRequest: (r) => set((s) => ({ requests: [r, ...s.requests] })),
      patchRequest: (id, patch) => set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      patchSubscription: (id, patch) =>
        set((s) => ({ subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      addGoal: (g) => set((s) => ({ goals: [...s.goals, g] })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      loadSampleGoals: () => set({ goals: sampleGoals(now()) }),
      runAutoFx: () => {
        let acted = 0;
        for (const g of get().goals) {
          const plan = planGoal(g, get().balances);
          if (!plan) continue;
          acted++;
          set((s) => ({
            balances: s.balances.map((b) =>
              b.currency === plan.debit.currency
                ? { ...b, available: { ...b.available, minor: b.available.minor - plan.debit.minor } }
                : b.currency === plan.credit.currency
                  ? { ...b, available: { ...b.available, minor: b.available.minor + plan.credit.minor } }
                  : b
            ),
            goals: s.goals.map((x) =>
              x.id === g.id
                ? { ...x, completed: x.type === "target_rate" ? true : x.completed, actions: [...x.actions, { at: now().toISOString(), text: plan.text }] }
                : x
            ),
          }));
        }
        return acted;
      },
      setRate: (c, v) => {
        setRates({ [c]: v });
        set((s) => ({ rates: { ...s.rates, [c]: v } }));
      },
      adjustBalance: (c, deltaMinor) =>
        set((s) => ({
          balances: s.balances.map((b) => (b.currency === c ? { ...b, available: { ...b.available, minor: b.available.minor + deltaMinor } } : b)),
        })),

      scaleBalances: (f) => set((s) => ({ balances: s.balances.map((b) => ({ ...b, available: { ...b.available, minor: Math.round(b.available.minor * f) } })) })),

      loadSamplePersonal: () =>
        set((s) => {
          const p = samplePersonal(now());
          return {
            cards: [p.card, ...s.cards.filter((c) => c.id !== p.card.id)],
            transactions: [...p.transactions, ...s.transactions.filter((t) => t.cardId !== p.card.id)].sort((a, b) => b.at.localeCompare(a.at)),
            subscriptions: [...s.subscriptions.filter((x) => x.cardId !== p.card.id), ...p.subscriptions],
          };
        }),

      notify: (n) =>
        set((s) => ({ notifications: [{ ...n, id: uid("n"), at: now().toISOString(), read: false }, ...s.notifications] })),
      markAllRead: (role) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.forRole === role ? { ...n, read: true } : n)) })),
    }),
    {
      name: "foren-cards-demo-v8",
      partialize: (s) => {
        const rest: Partial<typeof s> = { ...s };
        delete rest.hydrated;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (state?.rates) setRates(state.rates);
        useStore.setState({ hydrated: true });
      },
    }
  )
);

// The individual track runs in a phone-sized iframe on desktop. Keep the frame and the
// outer page (Demo panel) in step: apply changes another document writes to storage.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== useStore.persist.getOptions().name || !e.newValue) return;
    try {
      const { state } = JSON.parse(e.newValue) as { state: Partial<State> };
      if (state.rates) setRates(state.rates);
      useStore.setState(state);
    } catch {
      /* ignore malformed writes */
    }
  });
}

/** Prototype clock — the demo panel can jump it forward to expire approval windows. */
export function now(): Date {
  return new Date(Date.now() + useStore.getState().demo.clockOffsetMs);
}

/** Re-render every `ms` and return the prototype "now". */
export function useNow(ms = 1000): Date {
  const offset = useStore((s) => s.demo.clockOffsetMs);
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setT(Date.now()), ms);
    return () => clearInterval(i);
  }, [ms]);
  return new Date(t + offset);
}

export const ROLE_PERSON: Record<Exclude<Role, "individual">, string> = {
  owner: "u_amara",
  cardholder: "u_tunde",
  finance: "u_chidi",
};

export function currentUserId(role: Role): string {
  return role === "individual" ? PERSONAL_USER.id : ROLE_PERSON[role];
}

export const personById = (id: string): Person | undefined =>
  id === PERSONAL_USER.id ? { id, name: PERSONAL_USER.name, email: "", role: "cardholder" as const } : allPeople().find((p) => p.id === id);

/** Team members on Foren plus people invited while creating a card. */
export const allPeople = (): Person[] => [...PEOPLE, ...useStore.getState().invitedPeople];

export { USD_RATES };

/** Effective request state: approved one-time approvals expire when their window ends. */
export function requestState(r: CardRequest, at: Date): CardRequest["state"] {
  if (r.state === "approved" && r.windowEndsAt && new Date(r.windowEndsAt) <= at) return "expired";
  return r.state;
}

export function approvalWindowEnd(from: Date): string {
  return new Date(from.getTime() + POLICY.approvalWindowMinutes * 60_000).toISOString();
}

export type { Money };
