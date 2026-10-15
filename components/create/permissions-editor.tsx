"use client";
import * as React from "react";
import { RiAddLine, RiCheckLine, RiCloseLine, RiInformationLine, RiLockLine, RiShieldLine, RiStore2Line } from "@remixicon/react";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenSearch } from "@/components/ui/foren-search";
import { ForenTag } from "@/components/ui/foren-tag";
import { cn } from "@/lib/utils";
import { MerchantLogo } from "@/components/merchant-logo";
import { ChoiceCard } from "./choice-card";
import { ConfirmDialog } from "@/components/overlay";
import { CATEGORY_LABEL, DEFAULT_BLOCKED_CATEGORIES } from "@/domain/labels";
import type { Category, PermissionConfig, PermissionMode } from "@/domain/types";
import { MERCHANTS, merchantById } from "@/fixtures/merchants";

const ALLOWABLE: Category[] = ["software", "travel", "advertising", "office", "food", "transport", "utilities", "entertainment"];

const RISK: Partial<Record<Category, string>> = {
  gambling: "Gambling payments are a common sign of misuse and are hard to dispute.",
  cash_atm: "Cash withdrawals can’t be traced to a merchant or receipt.",
  crypto: "Crypto purchases are usually irreversible and can’t be disputed.",
};

export function PermissionsEditor({ value, onChange, error }: { value: PermissionConfig; onChange: (p: PermissionConfig) => void; error?: string }) {
  const set = (patch: Partial<PermissionConfig>) => onChange({ ...value, ...patch });
  const [removing, setRemoving] = React.useState<Category | null>(null);

  const toggleCategory = (c: Category) =>
    set({ allowedCategories: value.allowedCategories.includes(c) ? value.allowedCategories.filter((x) => x !== c) : [...value.allowedCategories, c] });

  const locked = value.mode === "first_merchant";
  const [before, setBefore] = React.useState<PermissionMode>(locked ? "anywhere" : value.mode);

  return (
    <div className="space-y-5">
      <MerchantScope
        value={locked ? "one" : "many"}
        onChange={(v) => {
          if (v === "one" && !locked) setBefore(value.mode);
          set({ mode: v === "one" ? "first_merchant" : before });
        }}
      />
      {!locked && (
        <div>
          <fieldset>
            <legend className="mb-2 text-[14px] font-medium text-fg" id="mode-label">
              Which merchants can it pay?
            </legend>
            <div className="grid gap-2">
              {WHERE.map((o) => (
                <ChoiceCard key={o.mode} name="where" value={o.mode} checked={value.mode === o.mode} onChange={() => set({ mode: o.mode })} title={o.title} description={o.body} />
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {value.mode === "merchants" && (
        <div>
          <div className="mb-2 text-[14px] font-medium text-fg">Approved merchants</div>
          <MerchantPicker
            selected={value.allowedMerchantIds}
            onAdd={(id) => set({ allowedMerchantIds: [...value.allowedMerchantIds, id] })}
            onRemove={(id) => set({ allowedMerchantIds: value.allowedMerchantIds.filter((x) => x !== id) })}
            placeholder="Search merchants to allow"
          />
        </div>
      )}

      {value.mode === "categories" && (
        <fieldset>
          <legend className="mb-2 text-[14px] font-medium text-fg">Allowed categories</legend>
          <div className="flex flex-wrap gap-2">
            {ALLOWABLE.map((c) => (
              <ForenTag key={c} size="xs" selected={value.allowedCategories.includes(c)} aria-pressed={value.allowedCategories.includes(c)} onClick={() => toggleCategory(c)} type="button">
                {CATEGORY_LABEL[c]}
              </ForenTag>
            ))}
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      )}

      <div className="rounded-[16px] border border-line p-4">
        <div className="flex items-center gap-2 text-[14px] font-medium text-fg">
          <RiShieldLine className="size-[18px] text-fg-2" aria-hidden />
          Blocked categories
        </div>
        <p className="mt-1 mb-3 text-[13px] text-fg-2">Foren suggests blocking these on every card. They apply in every mode.</p>
        <ul className="flex flex-wrap gap-2">
          {DEFAULT_BLOCKED_CATEGORIES.map((c) => {
            const on = value.blockedCategories.includes(c);
            return (
              <li key={c}>
                {on ? (
                  <span className="inline-flex h-8 items-center gap-1 rounded-full bg-error-subtle pr-1 pl-3 text-[12px] font-semibold text-error">
                    Blocked · {CATEGORY_LABEL[c]}
                    <button
                      type="button"
                      onClick={() => setRemoving(c)}
                      className="grid size-6 place-items-center rounded-full outline-none hover:bg-[var(--color-foren-bg-error-subtle-hover)] focus-visible:ring-2 focus-visible:ring-focus"
                      aria-label={`Remove protection: ${CATEGORY_LABEL[c]}`}
                    >
                      <RiCloseLine className="size-3.5" aria-hidden />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => set({ blockedCategories: [...value.blockedCategories, c] })}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-line px-3 text-[12px] font-semibold text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <RiAddLine className="size-3.5" aria-hidden />
                    Block {CATEGORY_LABEL[c]} again
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <div className="mb-2 text-[13px] font-medium text-fg">Blocked merchants</div>
          <MerchantPicker
            tone="block"
            selected={value.blockedMerchantIds}
            onAdd={(id) => set({ blockedMerchantIds: [...value.blockedMerchantIds, id] })}
            onRemove={(id) => set({ blockedMerchantIds: value.blockedMerchantIds.filter((x) => x !== id) })}
            placeholder="Search a merchant to block"
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={removing ? `Allow ${CATEGORY_LABEL[removing]} payments?` : ""}
        consequence={
          removing && (
            <>
              {RISK[removing]} Removing this protection lets this card pay {CATEGORY_LABEL[removing].toLowerCase()} merchants. You can block it again at any time.
            </>
          )
        }
        confirmLabel="Remove protection"
        destructive
        onConfirm={() => {
          if (removing) set({ blockedCategories: value.blockedCategories.filter((x) => x !== removing) });
          setRemoving(null);
        }}
      />
    </div>
  );
}

function MerchantPicker({ selected, onAdd, onRemove, placeholder, tone = "allow" }: { selected: string[]; onAdd: (id: string) => void; onRemove: (id: string) => void; placeholder: string; tone?: "allow" | "block" }) {
  const [q, setQ] = React.useState("");
  return (
    <div>
      <ForenSearch
        ariaLabel={placeholder}
        placeholder={placeholder}
        value={q}
        onChange={setQ}
        onSearch={(raw) => {
          const s = raw.trim().toLowerCase();
          if (!s) return [];
          return MERCHANTS.filter((m) => !selected.includes(m.id) && m.name.toLowerCase().includes(s))
            .slice(0, 6)
            .map((m) => ({ value: m.id, label: m.name, description: CATEGORY_LABEL[m.category], icon: <MerchantLogo merchant={m} size={28} /> }));
        }}
        emptyState={<span className="text-[13px] text-fg-3">No matching merchants</span>}
        onSelect={(r) => {
          onAdd(r.value);
          setQ("");
        }}
      />
      {selected.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {selected.map((id) => {
            const m = merchantById(id);
            return (
              <li key={id} className={`inline-flex h-9 items-center gap-2 rounded-full pr-1 pl-1 text-[13px] font-medium ${tone === "block" ? "bg-error-subtle text-error" : "bg-subtle text-fg"}`}>
                <MerchantLogo merchant={m} size={26} />
                {tone === "block" ? "Blocked · " : ""}
                {m?.name}
                <ForenButton type="button" variant="ghost" size="xxs" className="h-7 px-1.5" aria-label={`Remove ${m?.name}`} onClick={() => onRemove(id)} leadingIcon={<RiCloseLine />} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const WHERE: { mode: PermissionMode; title: string; body: string }[] = [
  { mode: "anywhere", title: "Anywhere", body: "Any merchant, except the categories and merchants you block below." },
  { mode: "merchants", title: "Only merchants I choose", body: "Pick the merchants it can pay. Everyone else is declined." },
  { mode: "categories", title: "Only certain categories", body: "For example software or travel. Other categories are declined." },
];

const SCOPES = [
  {
    key: "one",
    title: "One merchant",
    line: "Locks to the first merchant that charges it.",
    best: "Best for a subscription or a supplier.",
    pros: ["If the details leak, no one else can use them.", "Stop one merchant without affecting anything else."],
    con: "Each other subscription needs its own card.",
  },
  {
    key: "many",
    title: "Many merchants",
    line: "Works wherever you allow: anywhere, selected merchants or categories.",
    best: "Best for travel and day-to-day team spending.",
    pros: ["One card covers many places.", "You choose where it works, below."],
    con: "Freezing it stops every merchant on it at once.",
  },
] as const;

/**
 * One merchant or many. Payments happen at the merchant's checkout, so a one-merchant card can't know
 * the merchant in advance: whoever charges it first becomes the only merchant that can use it.
 */
export function MerchantScope({ value, onChange }: { value: "one" | "many"; onChange: (v: "one" | "many") => void }) {
  const name = React.useId();
  return (
    <fieldset>
      <legend className="mb-2 text-[14px] font-medium text-fg">How many merchants will use this card?</legend>
      <div className="grid gap-2">
        {SCOPES.map((o) => {
          const checked = value === o.key;
          return (
            <label
              key={o.key}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-[16px] border bg-surface p-4 transition-[border-color,box-shadow] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                checked ? "border-[var(--color-foren-brand-green)] shadow-[var(--shadow-foren-xs)]" : "border-line hover:bg-sunken"
              )}
            >
              <input type="radio" name={name} value={o.key} checked={checked} onChange={() => onChange(o.key)} className="sr-only" />
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn("grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]", checked ? "border-[var(--color-foren-brand-green)] bg-[var(--color-foren-brand-green)]" : "border-line-2 bg-surface")}
                >
                  {checked && <span className="size-2 rounded-full bg-white" />}
                </span>
                <span className="flex items-center gap-1.5 text-[14px] font-semibold text-fg">
                  {o.key === "one" ? <RiLockLine className="size-4 text-fg-2" aria-hidden /> : <RiStore2Line className="size-4 text-fg-2" aria-hidden />}
                  {o.title}
                </span>
              </span>
              <span className="mt-1.5 text-[13px] leading-[18px] text-fg">{o.line}</span>
              <span className="text-[13px] leading-[18px] text-fg-3">{o.best}</span>
              <ul className="mt-2.5 space-y-1 border-t border-line pt-2.5 text-[12px] leading-[17px]">
                {o.pros.map((p) => (
                  <li key={p} className="flex gap-1.5 text-fg-2">
                    <RiCheckLine className="mt-px size-3.5 shrink-0 text-success" aria-hidden />
                    {p}
                  </li>
                ))}
                <li className="flex gap-1.5 text-fg-2">
                  <RiInformationLine className="mt-px size-3.5 shrink-0 text-fg-3" aria-hidden />
                  {o.con}
                </li>
              </ul>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
