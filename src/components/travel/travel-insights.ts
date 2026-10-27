import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { authorize, spentInPeriod } from "@/domain/authorize";
import { fxFeeBps, money, rate } from "@/domain/money";
import { route } from "@/domain/routing";
import type { Balance, Card, Currency } from "@/domain/types";
import { useNow } from "@/composables/useNow";
import { useAppStore } from "@/stores/app";

/** A typical charge in the local currency, used to show how the card would pay. */
export const SAMPLE: Record<Currency, number> = { GBP: 100, USD: 100, EUR: 100, CAD: 150, NGN: 150_000 };

function plan(card: Card, local: Currency, balances: Balance[], home: Currency, txns: ReturnType<typeof useAppStore>["transactions"], at: Date) {
  const sample = money(SAMPLE[local], local);
  const r = route(sample, card.funding, balances);
  const held = balances.find((b) => b.currency === local)?.available;
  // A real merchant in that currency, to check the card's rules the same way a payment would.
  const probeMerchant = { id: "probe", name: "a local merchant", category: "travel" as const, billingCurrency: local, mark: "", tint: "", network: { kind: "works" as const } };
  const decision = authorize(card, probeMerchant, sample, { balances, transactions: txns, requests: [], subscriptions: [], now: at });
  const spent = spentInPeriod(card, txns.filter((t) => t.cardId === card.id), at);
  const left = card.limit.amount.minor >= 1_000_000_000 ? null : { minor: Math.max(0, card.limit.amount.minor - spent.minor), currency: card.limit.amount.currency };
  return { sample, route: r, held, decision, left, homeRate: rate(local, home), fee: fxFeeBps(home, local) };
}

export type TravelPlan = ReturnType<typeof plan>;

/** What spending abroad looks like on one card: which balance pays, what it costs, and whether it'll work. */
export function useTravelPlan(
  card: MaybeRefOrGetter<Card | undefined>,
  local: MaybeRefOrGetter<Currency>,
  balances: MaybeRefOrGetter<Balance[]>,
  home: MaybeRefOrGetter<Currency>
): ComputedRef<TravelPlan | null> {
  const store = useAppStore();
  const now = useNow(30_000);
  return computed(() => {
    const c = toValue(card);
    return c ? plan(c, toValue(local), toValue(balances), toValue(home), store.transactions, now.value) : null;
  });
}
