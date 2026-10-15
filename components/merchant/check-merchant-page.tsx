"use client";
import { CardsHeader } from "@/components/cards/cards-header";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CardArt } from "@/components/card/card-art";
import { CardStatusBadge } from "@/components/card/status-badge";
import { EmptyState, Panel } from "@/components/states";
import { COPY } from "@/content/copy";
import type { Card, Merchant } from "@/domain/types";
import { saveCard, unfreezeCard } from "@/lib/actions";
import { can, visibleCards } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MerchantChecker } from "./merchant-checker";

export function CheckMerchantPage() {
  const role = useStore((s) => s.role);
  const cards = useStore((s) => s.cards);
  const params = useSearchParams();
  const router = useRouter();
  const usable = visibleCards(role, cards).filter((c) => c.status !== "canceled");
  const selected = usable.find((c) => c.id === params.get("card")) ?? usable[0];

  const applyFix = async (card: Card, m: Merchant, fix: string) => {
    try {
      if (fix === "unfreeze") await unfreezeCard(card.id);
      else {
        const p = card.permissions;
        await saveCard({
          ...card,
          permissions:
            fix === "allow_merchant"
              ? { ...p, blockedMerchantIds: p.blockedMerchantIds.filter((x) => x !== m.id), allowedMerchantIds: p.mode === "merchants" ? [...new Set([...p.allowedMerchantIds, m.id])] : p.allowedMerchantIds }
              : { ...p, blockedCategories: p.blockedCategories.filter((x) => x !== m.category), allowedCategories: p.mode === "categories" ? [...new Set([...p.allowedCategories, m.category])] : p.allowedCategories },
        });
      }
      toast(`${card.nickname} updated`);
    } catch {
      toast.error(COPY.saveFailure);
    }
  };

  return (
    <div className="space-y-6">
      <CardsHeader tab="check" description="See if a card will work before you pay." />
      {!selected ? (
        <Panel>
          <EmptyState title="No cards to check" body="You need an active card to check a merchant." />
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Panel className="p-3">
            <div className="px-2 pt-1 pb-2 text-[12px] font-semibold tracking-[0.06em] text-fg-3 uppercase" id="card-pick">
              Card to check
            </div>
            <div role="radiogroup" aria-labelledby="card-pick" className="space-y-1">
              {usable.map((c) => (
                <div key={c.id}>
                  <button
                    role="radio"
                    aria-checked={c.id === selected.id}
                    onClick={() => router.replace(`/cards/check-merchant?card=${c.id}`, { scroll: false })}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[14px] px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus",
                      c.id === selected.id ? "bg-subtle" : "hover:bg-sunken"
                    )}
                  >
                    <CardArt card={c} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-fg">{c.nickname}</span>
                      <span className="tnum text-[12px] text-fg-3">•• {c.last4}</span>
                    </span>
                    {c.status !== "active" && <CardStatusBadge card={c} size="sm" />}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-5 sm:p-6">
            <MerchantChecker
              key={selected.id}
              card={selected}
              initialMerchantId={params.get("merchant") ?? undefined}
              alternatives={usable.filter((c) => c.status === "active")}
              canFix={can(role, "edit", selected)}
              onFix={(m, fix) => applyFix(selected, m, fix)}
            />
          </Panel>
        </div>
      )}
    </div>
  );
}
