"use client";
import { PageHeader } from "@/components/page-header";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenInput } from "@/components/ui/foren-input";
import { CardArt } from "@/components/card/card-art";
import { nameOnCard } from "@/components/card/holder";
import { CurrencyFlag } from "@/components/currency-flag";
import { Panel, SectionTitle } from "@/components/states";
import { COPY } from "@/content/copy";
import { CURRENCY_NAME } from "@/domain/money";
import { countryByCode } from "@/fixtures/countries";
import { setSpendingPeriod } from "@/lib/actions";
import { useAction } from "@/lib/api";
import { can, visibleCards } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { CountrySelect, PaysWith, RateBox, Tips, useTravelPlan, WillItWork } from "./travel-insights";

const HOME = "NGN" as const;

/**
 * Spending abroad (Wise "Travel hub", adapted): pick a country and a card to see which balance pays,
 * what it costs, whether the card will work there, and a few tips. Read-only apart from trip dates.
 */
export function TravelPage() {
  const role = useStore((s) => s.role);
  const allCards = useStore((s) => s.cards);
  const balances = useStore((s) => s.balances);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const cards = visibleCards(role, allCards).filter((c) => c.status !== "canceled" && c.kind !== "emergency");
  const country = countryByCode(params.get("country")) ?? countryByCode("GB")!;
  const card = cards.find((c) => c.id === params.get("card")) ?? cards[0];
  const plan = useTravelPlan(card, country.currency, balances, HOME);
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(k, v);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  return (
    <div className="max-w-[1115px] space-y-6">
      <PageHeader title="Spending abroad" description="Rates, fees and which balance pays abroad." />

      <div className="grid gap-4 sm:grid-cols-2">
        <CountrySelect value={country.code} onChange={(c) => setParam("country", c)} />
        <div className="flex flex-col gap-2">
          <label htmlFor="travel-card" className="text-[14px] font-medium text-fg">
            Which card is going?
          </label>
          <select id="travel-card" value={card?.id ?? ""} onChange={(e) => setParam("card", e.target.value)} className="h-14 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname} •• {c.last4}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!card || !plan ? (
        <Panel className="p-6 text-[14px] text-fg-2">You don’t have a card that can be used abroad.</Panel>
      ) : (
        <>
          <section className="flex flex-col items-center gap-3 rounded-[20px] bg-surface px-6 py-8 text-center">
            <CurrencyFlag currency={country.currency} size={48} />
            <h2 className="text-[24px] leading-[30px] font-semibold tracking-[-0.015em] text-fg">Spend like a local in {country.name}</h2>
            <p className="text-[14px] text-fg-2">
              Charges there are in {CURRENCY_NAME[country.currency]} ({country.currency}).
            </p>
            <div className="w-full max-w-[360px]">
              <RateBox local={country.currency} home={HOME} fee={plan.fee} />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="space-y-4 p-5">
              <SectionTitle>Which balance pays</SectionTitle>
              <PaysWith plan={plan} local={country.currency} />
            </Panel>
            <div className="space-y-4">
              <Panel className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <CardArt card={card} size="xs" />
                  <div className="min-w-0">
                    <SectionTitle>Will {card.nickname} work there?</SectionTitle>
                    <p className="truncate text-[12px] text-fg-3">{nameOnCard(card)}</p>
                  </div>
                </div>
                <WillItWork card={card} plan={plan} />
              </Panel>
              {can(role, "edit", card) && <TripDates key={card.id} cardId={card.id} from={card.activeFrom} until={card.activeUntil} />}
            </div>
          </div>

          <Panel className="space-y-4 p-5">
            <SectionTitle>Tips for spending in {country.name}</SectionTitle>
            <Tips local={country.currency} home={HOME} />
          </Panel>
        </>
      )}
    </div>
  );
}

/** Limit the card to the trip so it stops working when the team comes home. */
function TripDates({ cardId, from, until }: { cardId: string; from?: string; until?: string }) {
  const [f, setF] = React.useState(from ?? "");
  const [u, setU] = React.useState(until ?? "");
  const save = useAction(setSpendingPeriod);
  const bad = !!f && !!u && u < f;
  return (
    <Panel className="space-y-3 p-5">
      <SectionTitle>Trip dates</SectionTitle>
      <p className="text-[13px] leading-[18px] text-fg-2">The card only works between these dates.</p>
      <div className="grid grid-cols-2 gap-3">
        <ForenInput label="From" type="date" value={f} onChange={(e) => setF(e.target.value)} />
        <ForenInput label="Until" type="date" value={u} onChange={(e) => setU(e.target.value)} error={bad ? "Must be on or after the start date." : undefined} />
      </div>
      <ForenButton
        size="sm"
        disabled={bad || (!f && !u) || save.pending}
        onClick={async () => {
          const r = await save.run(cardId, f || undefined, u || undefined);
          toast(r.ok ? "Trip dates saved on the card" : COPY.saveFailure);
        }}
      >
        Save trip dates
      </ForenButton>
    </Panel>
  );
}
