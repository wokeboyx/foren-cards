// App data store. While the UI runs on mock services this holds the test data, persisted to
// localStorage so a usability session survives a refresh ("Reset demo" restores the seed).
// When the real API is wired up, services fill this store from responses instead of fixtures.
import { defineStore } from "pinia";
import { POLICY } from "@/config/policy";
import { planGoal } from "@/domain/autofx";
import { DEFAULT_USD_RATES, setRates, USD_RATES } from "@/domain/money";
import type {
  Balance,
  Card,
  CardRequest,
  Currency,
  Money,
  Notification,
  Person,
  Role,
  Subscription,
  Transaction,
  AutoFxGoal,
} from "@/domain/types";
import {
  PEOPLE,
  PERSONAL_USER,
  sampleGoals,
  seed,
  type SeedState,
} from "@/fixtures/seed";
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

export type AppState = Data & {
  role: Role;
  demo: DemoSettings;
};

const initialData = (): Data => {
  const b = seed();
  const p = personalSeed();
  return {
    ...b,
    personalBalances: p.balances,
    cards: [...b.cards, ...p.cards],
    transactions: [...b.transactions, ...p.transactions].sort((x, y) =>
      y.at.localeCompare(x.at),
    ),
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
export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(++idSeq).toString(36)}`;

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    ...initialData(),
    role: "owner",
    demo: { ...DEFAULT_DEMO },
  }),

  actions: {
    setRole(role: Role) {
      this.role = role;
    },
    setDemo(d: Partial<DemoSettings>) {
      this.demo = { ...this.demo, ...d };
    },
    advanceClock(minutes: number) {
      this.demo.clockOffsetMs += minutes * 60_000;
    },
    resetDemo() {
      setRates(DEFAULT_USD_RATES);
      const personalEnabled = this.demo.personalEnabled;
      this.$patch((s) =>
        Object.assign(s, initialData(), {
          demo: { ...DEFAULT_DEMO, personalEnabled },
        }),
      );
    },
    emptyAccount() {
      const personalIds = new Set(
        this.cards.filter((c) => c.personal).map((c) => c.id),
      );
      this.$patch({
        cards: this.cards.filter((c) => c.personal),
        transactions: this.transactions.filter((t) =>
          personalIds.has(t.cardId),
        ),
        subscriptions: this.subscriptions.filter((x) =>
          personalIds.has(x.cardId),
        ),
        requests: [],
        notifications: [],
      });
    },

    upsertCard(c: Card) {
      this.cards = this.cards.some((x) => x.id === c.id)
        ? this.cards.map((x) => (x.id === c.id ? c : x))
        : [c, ...this.cards];
    },
    patchCard(id: string, patch: Partial<Card>) {
      this.cards = this.cards.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      );
    },
    invitePerson(p: Person) {
      this.invitedPeople.push(p);
    },
    patchTransaction(id: string, patch: Partial<Transaction>) {
      this.transactions = this.transactions.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      );
    },

    recordTransaction(t: Transaction, opts?: { debit?: boolean }) {
      const card = this.cards.find((c) => c.id === t.cardId);
      if (opts?.debit !== false && t.status === "approved" && card) {
        // Cards are prefunded: a payment comes out of the card's own balance.
        const out = t.legs
          .filter((l) => l.source.kind === "card")
          .reduce((sum, l) => sum + l.debit.minor, 0);
        if (out) this.adjustCardBalance(card.id, -out);
      }
      this.transactions = [t, ...this.transactions];
    },

    addRequest(r: CardRequest) {
      this.requests = [r, ...this.requests];
    },
    patchRequest(id: string, patch: Partial<CardRequest>) {
      this.requests = this.requests.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      );
    },

    patchSubscription(id: string, patch: Partial<Subscription>) {
      this.subscriptions = this.subscriptions.map((x) =>
        x.id === id ? { ...x, ...patch } : x,
      );
    },
    addSubscription(s: Subscription) {
      this.subscriptions.push(s);
    },

    addGoal(g: AutoFxGoal) {
      this.goals.push(g);
    },
    removeGoal(id: string) {
      this.goals = this.goals.filter((g) => g.id !== id);
    },
    loadSampleGoals() {
      this.goals = sampleGoals(now());
    },
    /** Runs every AutoFX goal once; returns how many acted. */
    runAutoFx(): number {
      let acted = 0;
      for (const g of [...this.goals]) {
        const plan = planGoal(g, this.balances);
        if (!plan) continue;
        acted++;
        this.balances = this.balances.map((b) =>
          b.currency === plan.debit.currency
            ? {
                ...b,
                available: {
                  ...b.available,
                  minor: b.available.minor - plan.debit.minor,
                },
              }
            : b.currency === plan.credit.currency
              ? {
                  ...b,
                  available: {
                    ...b.available,
                    minor: b.available.minor + plan.credit.minor,
                  },
                }
              : b,
        );
        this.goals = this.goals.map((x) =>
          x.id === g.id
            ? {
                ...x,
                completed: x.type === "target_rate" ? true : x.completed,
                actions: [
                  ...x.actions,
                  { at: now().toISOString(), text: plan.text },
                ],
              }
            : x,
        );
      }
      return acted;
    },
    setRate(c: Currency, v: number) {
      setRates({ [c]: v });
      this.rates = { ...this.rates, [c]: v };
    },
    adjustBalance(c: Currency, deltaMinor: number, personal = false) {
      const key = personal ? "personalBalances" : "balances";
      this[key] = this[key].map((b) =>
        b.currency === c
          ? {
              ...b,
              available: {
                ...b.available,
                minor: b.available.minor + deltaMinor,
              },
            }
          : b,
      );
    },
    adjustCardBalance(id: string, deltaMinor: number) {
      this.cards = this.cards.map((c) =>
        c.id === id
          ? {
              ...c,
              balance: { ...c.balance, minor: c.balance.minor + deltaMinor },
            }
          : c,
      );
    },
    scaleBalances(f: number) {
      this.balances = this.balances.map((b) => ({
        ...b,
        available: { ...b.available, minor: Math.round(b.available.minor * f) },
      }));
    },
    loadSamplePersonal() {
      const p = samplePersonal(now());
      this.$patch({
        cards: [p.card, ...this.cards.filter((c) => c.id !== p.card.id)],
        transactions: [
          ...p.transactions,
          ...this.transactions.filter((t) => t.cardId !== p.card.id),
        ].sort((a, b) => b.at.localeCompare(a.at)),
        subscriptions: [
          ...this.subscriptions.filter((x) => x.cardId !== p.card.id),
          ...p.subscriptions,
        ],
      });
    },

    notify(n: Omit<Notification, "id" | "at" | "read">) {
      this.notifications = [
        { ...n, id: uid("n"), at: now().toISOString(), read: false },
        ...this.notifications,
      ];
    },
    markAllRead(role: Role) {
      this.notifications = this.notifications.map((n) =>
        n.forRole === role ? { ...n, read: true } : n,
      );
    },
  },

  persist: {
    key: "foren-cards-demo-v12",
    afterLoad: (s) => {
      if (s.rates) setRates(s.rates as Record<Currency, number>);
    },
  },
});

/** Prototype clock — the demo panel can jump it forward to expire approval windows. */
export function now(): Date {
  return new Date(Date.now() + useAppStore().demo.clockOffsetMs);
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
  id === PERSONAL_USER.id
    ? { id, name: PERSONAL_USER.name, email: "", role: "cardholder" as const }
    : allPeople().find((p) => p.id === id);

/** Team members on Foren plus people invited while creating a card. */
export const allPeople = (): Person[] => [
  ...PEOPLE,
  ...useAppStore().invitedPeople,
];

export { USD_RATES };

/** Effective request state: approved one-time approvals expire when their window ends. */
export function requestState(r: CardRequest, at: Date): CardRequest["state"] {
  if (
    r.state === "approved" &&
    r.windowEndsAt &&
    new Date(r.windowEndsAt) <= at
  )
    return "expired";
  return r.state;
}

export function approvalWindowEnd(from: Date): string {
  return new Date(
    from.getTime() + POLICY.approvalWindowMinutes * 60_000,
  ).toISOString();
}

export type { Money };
