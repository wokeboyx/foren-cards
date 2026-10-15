import { CATEGORY_LABEL, MODE, STRATEGY, strategyLabel } from "@/domain/labels";
import { CURRENCY_NAME } from "@/domain/money";
import type { Card, FundingConfig } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { cn } from "@/lib/utils";

/** The funding path as a short ordered list: card balances → other balances (AC 2.3, 4.1). Cards only pay from Foren balances. */
export function FundingPath({ funding, className }: { funding: FundingConfig; className?: string }) {
  const steps: { title: string; detail: string; icon?: React.ReactNode }[] = [];
  if (funding.strategy === "custom") {
    funding.order.forEach((c, i) => steps.push({ title: `${c} balance`, detail: i === 0 ? "Tried first" : CURRENCY_NAME[c] }));
  } else if (funding.strategy === "cheapest_fx") {
    steps.push({ title: "Balance in the charge’s currency", detail: "Used first, so no conversion is needed" });
    steps.push({ title: "Other eligible balances", detail: `Eligible: ${funding.order.join(", ")}. The cheapest to convert is tried first, and one charge may be split.` });
  } else {
    steps.push({ title: "Balance in the charge’s currency", detail: "Used first, so no conversion is needed" });
    const kept = funding.protect ?? "USD";
    steps.push({ title: `Other balances except ${kept}`, detail: funding.order.filter((c) => c !== kept).join(", ") });
    steps.push({ title: `${kept} balance (protected)`, detail: "Only if nothing else can cover the charge" });
  }

  return (
    <div className={className}>
      <div className="mb-2 text-[13px] text-fg-2">
        <span className="font-semibold text-fg">{strategyLabel(funding)}</span> · {STRATEGY[funding.strategy].line}
      </div>
      <ol className="relative space-y-0">
        {steps.map((s, i) => (
          <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
            {i < steps.length - 1 && <span aria-hidden className="absolute top-6 bottom-0 left-[11px] w-px bg-line-2" />}
            <span className="tnum relative z-10 grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-[12px] font-semibold text-fg-2 ring-2 ring-surface">
              {s.icon ?? i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="text-[14px] leading-[20px] font-medium text-fg">{s.title}</div>
              <div className="text-[12px] leading-[16px] text-fg-3">{s.detail}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function permissionSentence(card: Pick<Card, "permissions" | "lockedMerchantId">): string {
  const p = card.permissions;
  if (card.lockedMerchantId) return `Only works at ${merchantById(card.lockedMerchantId)?.name}.`;
  if (p.mode === "anywhere") return "Works anywhere, except blocked categories and merchants.";
  if (p.mode === "first_merchant") return "Locks to the first merchant that charges it. Best for one subscription or sign-up.";
  if (p.mode === "merchants")
    return p.allowedMerchantIds.length
      ? `Only works at ${p.allowedMerchantIds.length} selected ${p.allowedMerchantIds.length === 1 ? "merchant" : "merchants"}.`
      : "Only works at selected merchants — none selected yet.";
  return p.allowedCategories.length
    ? `Only works in ${p.allowedCategories.map((c) => CATEGORY_LABEL[c]).join(", ")}.`
    : "Only works in allowed categories — none selected yet.";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 text-[13px] leading-[18px] sm:grid-cols-[150px_1fr]">
      <dt className="text-fg-3">{label}</dt>
      <dd className="text-fg">{children}</dd>
    </div>
  );
}

export function PermissionsSummary({ card, className }: { card: Pick<Card, "permissions" | "lockedMerchantId">; className?: string }) {
  const p = card.permissions;
  const chips = (items: string[], tone: "allow" | "block") =>
    items.length ? (
      <div className="flex flex-wrap gap-1.5">
        {items.map((x) => (
          <span key={x} className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium", tone === "allow" ? "bg-success-subtle text-success" : "bg-error-subtle text-error")}>
            {tone === "block" ? "Blocked · " : ""}
            {x}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-fg-3">None</span>
    );
  return (
    <div className={className}>
      <p className="mb-1 text-[14px] text-fg">{permissionSentence(card)}</p>
      <dl className="divide-y divide-line">
        <Row label="Mode">{card.lockedMerchantId ? "Locked to one merchant" : MODE[p.mode]}</Row>
        {p.mode === "merchants" && !card.lockedMerchantId && <Row label="Allowed merchants">{chips(p.allowedMerchantIds.map((id) => merchantById(id)?.name ?? id), "allow")}</Row>}
        {p.mode === "categories" && !card.lockedMerchantId && <Row label="Allowed categories">{chips(p.allowedCategories.map((c) => CATEGORY_LABEL[c]), "allow")}</Row>}
        <Row label="Blocked categories">{chips(p.blockedCategories.map((c) => CATEGORY_LABEL[c]), "block")}</Row>
        <Row label="Blocked merchants">{chips(p.blockedMerchantIds.map((id) => merchantById(id)?.name ?? id), "block")}</Row>
      </dl>
    </div>
  );
}
