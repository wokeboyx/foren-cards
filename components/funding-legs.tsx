import { RiExchangeLine, RiWallet3Line } from "@remixicon/react";
import { Money } from "@/components/money";
import { formatRate } from "@/domain/money";
import type { FeeAvoided, FundingLeg } from "@/domain/types";

/** Which balance(s) paid, with every conversion and fee shown separately — never folded into a total (AC 6.1). */
export function FundingLegs({ legs, feeAvoided }: { legs: FundingLeg[]; feeAvoided?: FeeAvoided }) {
  const split = legs.length > 1;
  return (
    <div className="space-y-3">
      {split && <p className="text-[13px] text-fg-2">This charge was split across {legs.length} balances.</p>}
      <ol className="space-y-2">
        {legs.map((l, i) => {
          const title = `${l.source.currency} balance`;
          return (
            <li key={i} className="rounded-[16px] border border-line p-3.5">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-subtle text-fg-2 [&_svg]:size-4" aria-hidden>
                  {l.fx ? <RiExchangeLine /> : <RiWallet3Line />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-[14px] font-semibold text-fg">
                      {split && <span className="tnum mr-1 text-fg-3">{i + 1}.</span>}
                      {title}
                    </span>
                    <Money value={l.debit} code className="text-[14px] font-semibold text-fg" />
                  </div>
                  <div className="mt-0.5 text-[13px] text-fg-2">
                    Covered <Money value={l.covers} /> of the charge
                    {!l.fx && " with no conversion"}.
                  </div>
                  {l.fx && (
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-[12px] bg-sunken px-3 py-2 text-[13px]">
                      <dt className="text-fg-3">Converted</dt>
                      <dd className="tnum text-right text-fg">
                        <Money value={{ minor: l.debit.minor - l.fx.fee.minor, currency: l.fx.from }} /> → <Money value={l.fx.converted} />
                      </dd>
                      <dt className="text-fg-3">Rate</dt>
                      <dd className="tnum text-right text-fg">{formatRate(l.fx.from, l.fx.converted.currency, l.fx.rate)}</dd>
                      <dt className="text-fg-3">FX fee</dt>
                      <dd className="tnum text-right font-medium text-fg">
                        <Money value={l.fx.fee} />
                      </dd>
                    </dl>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {feeAvoided && (
        <div className="rounded-[16px] bg-success-subtle px-3.5 py-3 text-[13px] leading-[18px] text-success">
          <span className="font-semibold">
            <Money value={feeAvoided.amount} /> fee avoided
          </span>{" "}
          — paid from a same-currency balance. <span className="text-fg-2">{feeAvoided.basis}</span>
        </div>
      )}
    </div>
  );
}
