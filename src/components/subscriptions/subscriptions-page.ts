import {
  subscriptionStatus,
  type forecast,
  type SubStatus,
} from "@/domain/forecast";
import type { Card, Subscription } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { useNow } from "@/composables/useNow";
import { useAppStore } from "@/stores/app";

export const short = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Returns a status function for subscriptions; call it inside a computed so it tracks the store and clock. */
export function useSubStatus() {
  const s = useAppStore();
  const now = useNow(30_000);
  return (sub: Subscription, card: Card) =>
    subscriptionStatus(sub, card, merchantById(sub.merchantId)!, {
      balances: s.balances,
      transactions: s.transactions,
      requests: s.requests,
      subscriptions: s.subscriptions,
      now: now.value,
    });
}

export type SubRow = {
  s: Subscription;
  card: Card;
  f: ReturnType<typeof forecast>;
  st: SubStatus;
};
