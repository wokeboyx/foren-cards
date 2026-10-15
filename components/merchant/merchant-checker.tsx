"use client";
import * as React from "react";
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiQuestionFill,
  RiSettings3Fill,
  RiStore2Line,
} from "@remixicon/react";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenSearch, type ForenSearchResult } from "@/components/ui/foren-search";
import { ForenSpinner } from "@/components/ui/foren-spinner";
import { MerchantLogo } from "@/components/merchant-logo";
import { ErrorState } from "@/components/states";
import { COPY } from "@/content/copy";
import { checkMerchant, VERDICT_LABEL, type CompatResult, type Verdict } from "@/domain/compatibility";
import { CATEGORY_LABEL } from "@/domain/labels";
import type { Card, Merchant } from "@/domain/types";
import { MERCHANTS } from "@/fixtures/merchants";
import { call } from "@/lib/api";
import { cn } from "@/lib/utils";

export const VERDICT_STYLE: Record<Verdict, { icon: React.ReactNode; cls: string }> = {
  works: { icon: <RiCheckboxCircleFill />, cls: "bg-success-subtle text-success" },
  likely: { icon: <RiCheckboxCircleFill />, cls: "bg-info-subtle text-info" },
  setup_needed: { icon: <RiSettings3Fill />, cls: "bg-warning-subtle text-warning" },
  wont_work: { icon: <RiCloseCircleFill />, cls: "bg-error-subtle text-error" },
  no_history: { icon: <RiQuestionFill />, cls: "bg-subtle text-fg-2" },
};

/** An unknown merchant typed by the user — we have no history for it. */
function unknownMerchant(name: string): Merchant {
  return { id: `unknown:${name.toLowerCase()}`, name, category: "office", billingCurrency: "USD", mark: name.slice(0, 2), tint: "#87827e", network: { kind: "unknown" } };
}

export function MerchantChecker({
  card,
  alternatives = [],
  onFix,
  canFix,
  compact,
  initialMerchantId,
}: {
  card: Card;
  /** Other cards the user could use instead when the verdict is "Won't work". */
  alternatives?: Card[];
  /** Apply the suggested rule change (e.g. allow this merchant). */
  onFix?: (merchant: Merchant, fix: NonNullable<Extract<CompatResult["card"], { ok: false }>["fix"]>) => void;
  canFix?: boolean;
  compact?: boolean;
  initialMerchantId?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [merchant, setMerchant] = React.useState<Merchant | null>(() => MERCHANTS.find((m) => m.id === initialMerchantId) ?? null);
  const [status, setStatus] = React.useState<"idle" | "searching" | "done" | "error">(initialMerchantId ? "done" : "idle");
  const run = React.useRef(0);

  const check = (m: Merchant) => {
    const id = ++run.current;
    setMerchant(m);
    setStatus("searching");
    call(() => true, { kind: "load" })
      .then(() => id === run.current && setStatus("done"))
      .catch(() => id === run.current && setStatus("error"));
  };

  const search = React.useCallback((raw: string): ForenSearchResult[] => {
    const q = raw.trim().toLowerCase();
    if (!q) return [];
    const hits = MERCHANTS.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6);
    const list: ForenSearchResult[] = hits.map((m) => ({
      value: m.id,
      label: m.name,
      description: CATEGORY_LABEL[m.category],
      icon: <MerchantLogo merchant={m} size={28} />,
    }));
    if (!hits.some((m) => m.name.toLowerCase() === q))
      list.push({ value: `unknown:${raw.trim()}`, label: `Check “${raw.trim()}”`, description: "Not in our merchant list", icon: <RiStore2Line className="size-5 text-fg-3" /> });
    return list;
  }, []);

  const result = merchant ? checkMerchant(card, merchant) : null;
  const alts = merchant && result?.verdict === "wont_work" ? alternatives.filter((c) => c.id !== card.id && checkMerchant(c, merchant).verdict !== "wont_work") : [];

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <ForenSearch
        ariaLabel="Search for a merchant"
        placeholder="Search merchants, e.g. Figma"
        value={query}
        onChange={setQuery}
        onSearch={search}
        emptyState={<span className="text-[13px] text-fg-3">Type a merchant name</span>}
        onSelect={(r) => {
          const m = r.value.startsWith("unknown:") ? unknownMerchant(r.value.slice(8)) : MERCHANTS.find((x) => x.id === r.value)!;
          check(m);
          setQuery("");
        }}
      />

      {status === "idle" && !compact && (
        <p className="text-[13px] leading-[18px] text-fg-3">We’ll check what we know about the merchant and this card’s own rules. Results are estimates, not guarantees.</p>
      )}
      {status === "searching" && (
        <div className="flex items-center gap-3 rounded-[16px] bg-subtle px-4 py-4 text-[14px] text-fg-2" role="status">
          <ForenSpinner size="sm" ariaLabel="Checking" />
          Checking {merchant?.name}…
        </div>
      )}
      {status === "error" && (
        <div className="rounded-[16px] bg-subtle">
          <ErrorState message="We couldn’t check this merchant. Try again." onRetry={() => merchant && check(merchant)} className="py-6" />
        </div>
      )}
      {status === "done" && merchant && result && (
        <VerdictPanel
          merchant={merchant}
          result={result}
          alternatives={alts}
          onFix={canFix && onFix && !result.card.ok && result.card.fix ? () => onFix(merchant, (result.card as Extract<CompatResult["card"], { ok: false }>).fix!) : undefined}
        />
      )}
    </div>
  );
}

export function VerdictPanel({ merchant, result, alternatives, onFix }: { merchant: Merchant; result: CompatResult; alternatives: Card[]; onFix?: () => void }) {
  const v = VERDICT_STYLE[result.verdict];
  const rules = result.card;
  return (
    <div className="overflow-hidden rounded-[20px] ring-1 ring-line" aria-live="polite">
      <div className={cn("flex items-center gap-3 px-4 py-3.5", v.cls)}>
        <span className="[&_svg]:size-6" aria-hidden>
          {v.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] leading-[22px] font-semibold">{VERDICT_LABEL[result.verdict]}</div>
          <div className="truncate text-[13px] opacity-90">at {merchant.name}</div>
        </div>
        <MerchantLogo merchant={merchant} size={32} />
      </div>
      <dl className="divide-y divide-line bg-surface">
        <div className="px-4 py-3">
          <dt className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-fg-3 uppercase">
            Merchant and network
            <span className={cn("rounded-full px-2 py-px text-[11px] font-semibold tracking-normal normal-case", VERDICT_STYLE[result.network.verdict].cls)}>
              {VERDICT_LABEL[result.network.verdict]}
            </span>
          </dt>
          <dd className="mt-1 text-[14px] leading-[21px] text-fg">{result.network.detail}</dd>
          {result.network.steps && (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] leading-[21px] text-fg">
              {result.network.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          )}
        </div>
        <div className="px-4 py-3">
          <dt className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-fg-3 uppercase">
            This card’s rules
            <span className={cn("rounded-full px-2 py-px text-[11px] font-semibold tracking-normal normal-case", rules.ok ? "bg-success-subtle text-success" : "bg-error-subtle text-error")}>
              {rules.ok ? "Allowed" : "Blocked"}
            </span>
          </dt>
          <dd className="mt-1 text-[14px] leading-[21px] text-fg">
            {rules.ok ? rules.detail : (
              <>
                <span className="font-semibold">{rules.rule}.</span> {rules.detail}
              </>
            )}
          </dd>
          {!rules.ok && onFix && (
            <ForenButton size="xs" variant="secondary" className="mt-2" onClick={onFix}>
              {rules.fix === "allow_merchant" ? `Allow ${merchant.name} on this card` : rules.fix === "allow_category" ? `Allow ${CATEGORY_LABEL[merchant.category]}` : "Unfreeze card"}
            </ForenButton>
          )}
          {!rules.ok && !onFix && rules.fix && <p className="mt-1 text-[13px] text-fg-3">Ask the account owner to change this rule.</p>}
        </div>
        {result.verdict === "wont_work" && (
          <div className="px-4 py-3">
            <dt className="text-[12px] font-semibold tracking-[0.04em] text-fg-3 uppercase">What you can do instead</dt>
            <dd className="mt-1 text-[14px] leading-[21px] text-fg">
              {alternatives.length ? (
                <>
                  Try{" "}
                  {alternatives.slice(0, 2).map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && " or "}
                      <span className="font-semibold">
                        {c.nickname} •• {c.last4}
                      </span>
                    </span>
                  ))}
                  , which {alternatives.length > 1 ? "aren’t" : "isn’t"} blocked here. Or use another payment method.
                </>
              ) : (
                "Use another payment method for this merchant."
              )}
            </dd>
          </div>
        )}
        {(result.verdict === "works" || result.verdict === "likely") && (
          <p className="px-4 py-2.5 text-[12px] leading-[16px] text-fg-3">Based on past payments. This isn’t a guarantee — the merchant or network can still decline.</p>
        )}
        {result.verdict === "no_history" && <p className="px-4 py-2.5 text-[12px] leading-[16px] text-fg-3">{COPY.merchantUnknown}. We can’t promise this payment will succeed.</p>}
      </dl>
    </div>
  );
}

