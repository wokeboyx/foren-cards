"use client";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import { CurrencyFlag } from "@/components/currency-flag";
import { Money } from "@/components/money";
import { CURRENCY_NAME } from "@/domain/money";
import type { Balance, Currency } from "@/domain/types";
import { cn } from "@/lib/utils";

/** "United States dollar (USD)" */
export const currencyLabel = (c: Currency) => `${CURRENCY_NAME[c]} (${c})`;

/** Currency dropdown with flag, full name + code, and the available balance. */
export function CurrencySelect({
  label,
  value,
  options,
  balances,
  onChange,
}: {
  label: string;
  value: Currency | undefined;
  options: Currency[];
  balances: Balance[];
  onChange: (c: Currency) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const labelId = React.useId();
  const listId = React.useId();
  const bal = (c: Currency) => balances.find((b) => b.currency === c)?.available;

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-[14px] font-medium text-fg">
        {label}
      </span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          role="combobox"
          aria-labelledby={labelId}
          aria-expanded={open}
          aria-controls={listId}
          className="relative flex h-14 w-full items-center gap-3 rounded-[16px] border border-transparent bg-subtle pr-10 pl-3 text-left text-[14px] outline-none focus-visible:border-focus focus-visible:bg-surface"
        >
          {value ? (
            <>
              <CurrencyFlag currency={value} size={28} />
              <span className="min-w-0 flex-1 truncate font-medium text-fg">{currencyLabel(value)}</span>
              {bal(value) && <Money value={bal(value)!} className="tnum shrink-0 text-[13px] text-fg-2" />}
            </>
          ) : (
            <span className="text-fg-3">Choose a currency</span>
          )}
          <RiArrowDownSLine className={cn("absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-fg-3 transition-transform", open && "rotate-180")} aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={6} className="z-50 w-[var(--radix-popover-trigger-width)] rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none">
            <div id={listId} role="listbox" aria-labelledby={labelId} className="max-h-[320px] overflow-y-auto">
              {options.map((c) => {
                const on = c === value;
                return (
                  <button
                    key={c}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                    className={cn("flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left outline-none hover:bg-subtle focus-visible:bg-subtle", on && "bg-subtle")}
                  >
                    <CurrencyFlag currency={c} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-fg">{currencyLabel(c)}</span>
                      {bal(c) && (
                        <span className="block text-[12px] text-fg-3">
                          Balance <Money value={bal(c)!} className="tnum" />
                        </span>
                      )}
                    </span>
                    {on && <RiCheckLine className="size-[18px] shrink-0 text-success" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
