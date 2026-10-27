"use client";
import * as React from "react";
import Image from "next/image";
import { asset } from "@/lib/base-path";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { RiAddLine, RiArrowLeftLine, RiArrowRightLine, RiCloseLine, RiDeleteBinLine, RiSave3Line, RiNotification3Line, RiSearchEyeLine } from "@remixicon/react";
import { toast } from "sonner";
import { ForenButton } from "@/components/ui/foren-button";
import { LinkButton } from "@/components/link-button";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import { ForenInput } from "@/components/ui/foren-input";
import { ForenToggle } from "@/components/ui/foren-toggle";
import { CardArt } from "@/components/card/card-art";
import { lockText } from "@/components/card/status-badge";
import { DESIGNS } from "@/components/card/designs";
import { permissionSentence } from "@/components/card/funding-path";
import { MerchantChecker } from "@/components/merchant/merchant-checker";
import { POLICY } from "@/config/policy";
import { COPY } from "@/content/copy";
import { DESIGN_LABEL, PERIOD_LABEL, PERIOD_PHRASE, strategyLabel } from "@/domain/labels";
import { format, parseAmount } from "@/domain/money";
import type { Card, CardDesign, CardDraft, Currency, LimitPeriod } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { nameOnCard, usedBy } from "@/components/card/holder";
import { deleteCardDraft, issueCards, newCardDraft, randomLast4, saveCard, saveCardDraft } from "@/lib/actions";
import { useAction } from "@/lib/api";
import { visibleCards } from "@/lib/permissions";
import { now, personById, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FundingEditor } from "./funding-editor";
import { HolderPicker } from "./holder-picker";
import { PermissionsEditor } from "./permissions-editor";
import { ChoiceCard } from "./choice-card";

type Errors = Partial<Record<"nickname" | "holderId" | "limit" | "permissions", string>>;

function expiryFromYears(years: number) {
  const d = now();
  d.setFullYear(d.getFullYear() + years);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const expiryLabel = (e: string) => {
  const [y, m] = e.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

/**
 * Create / edit card as a full-screen focus view (Mercury layout): section labels on the left,
 * fields on the right, and a tinted live preview + summary that doubles as the review (AC 2.1).
 */
export function CardForm({ mode, initial, prefill, fromDraft }: { mode: "create" | "edit"; initial?: Card; prefill?: Partial<Card>; fromDraft?: CardDraft }) {
  const router = useRouter();
  const allCards = useStore((s) => s.cards);
  const role = useStore((s) => s.role);
  const [draft, setDraft] = React.useState<Card>(() => initial ?? fromDraft?.card ?? { ...newCardDraft(""), ...prefill });
  const [amountText, setAmountText] = React.useState(() => (initial ? String(initial.limit.amount.minor / 100) : (fromDraft?.amountText ?? "5000")));
  const [pane, setPane] = React.useState<"form" | "preview">("form");
  /** Bulk create (Revolut "Name company cards"): extra card names that get the same settings. */
  const [extraNames, setExtraNames] = React.useState<string[]>(() => fromDraft?.names ?? []);
  const [draftId] = React.useState(() => fromDraft?.id ?? `d_${Math.random().toString(36).slice(2, 8)}`);
  const saveDraft = useAction(saveCardDraft);
  const [periodOn, setPeriodOn] = React.useState(() => !!(fromDraft?.card.activeFrom || fromDraft?.card.activeUntil));
  const [years, setYears] = React.useState<number>(() => fromDraft?.years ?? 3);
  const stepped = mode === "create";
  const [step, setStep] = React.useState(() => fromDraft?.step ?? 0);
  const show = (i: number) => !stepped || step === i;
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  // Move focus to the new step's heading so screen readers announce it (not on first load).
  const lastStep = React.useRef(step);
  React.useEffect(() => {
    if (lastStep.current === step) return;
    lastStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);
  const [errors, setErrors] = React.useState<Errors>({});
  const [done, setDone] = React.useState<Card[] | null>(null);
  const [checkerOpen, setCheckerOpen] = React.useState(false);
  const issue = useAction(issueCards);
  const save = useAction(saveCard);
  const reduce = useReducedMotion();
  const closeHref = mode === "edit" ? `/cards/${draft.id}` : "/cards";

  const set = (patch: Partial<Card>) => setDraft((d) => ({ ...d, ...patch }));
  const holder = personById(draft.holderId);
  const amount = parseAmount(amountText, draft.limit.amount.currency);
  const expiry = mode === "create" ? expiryFromYears(years) : draft.expiry;
  const limitSentence = amount && amount.minor > 0 ? `Up to ${format(amount)} ${PERIOD_PHRASE[draft.limit.period]}` : null;

  function computeErrors(): Errors {
    const e: Errors = {};
    if (!draft.nickname.trim()) e.nickname = "Give the card a name so your team can recognise it.";
    else if (draft.nickname.trim().length > 40) e.nickname = "Use 40 characters or fewer.";
    if (!draft.holderId) e.holderId = draft.companyCard ? "Choose at least one person to use and manage this card." : "Choose who will use this card, or add someone who isn’t on Foren.";
    const max = POLICY.maxLimitMajor[draft.limit.amount.currency];
    if (!amountText.trim()) e.limit = "Enter a spending limit.";
    else if (!amount) e.limit = "Enter an amount using numbers only, like 2,500.00.";
    else if (amount.minor <= 0) e.limit = "The limit must be more than zero.";
    else if (amount.minor > max * 100) e.limit = `The most you can set is ${format({ minor: max * 100, currency: amount.currency })}.`;
    if (draft.permissions.mode === "merchants" && !draft.permissions.allowedMerchantIds.length) e.permissions = "Add at least one approved merchant, or choose another option.";
    if (draft.permissions.mode === "categories" && !draft.permissions.allowedCategories.length) e.permissions = "Choose at least one allowed category, or choose another option.";
    if (extraNames.some((n) => !n.trim())) e.nickname = "Give every card a name, or remove the empty one.";
    if (periodOn && draft.activeFrom && draft.activeUntil && draft.activeUntil < draft.activeFrom) e.limit = "The spending period must end on or after it starts.";
    return e;
  }

  // The primary action stays disabled until this step (or, when editing, the whole form) is complete.
  const pendingErrors = computeErrors();
  const ready = stepped ? STEPS[step].fields.every((k) => !pendingErrors[k]) : Object.keys(pendingErrors).length === 0;

  const top = () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });

  /** Stepped create: check only the current step's answers before moving on. */
  function next() {
    const all = computeErrors();
    const mine: Errors = {};
    for (const k of STEPS[step].fields) if (all[k]) mine[k] = all[k];
    setErrors(mine);
    if (Object.keys(mine).length) return;
    const n = step + 1;
    setStep(n);
    top();
  }

  function validate(): Card | null {
    const e = computeErrors();
    setErrors(e);
    const first = Object.keys(e)[0] as keyof Errors | undefined;
    if (first && stepped) {
      setStep(STEPS.findIndex((x) => x.fields.includes(first)));
      top();
      return null;
    }
    if (first) {
      const target = first === "nickname" || first === "holderId" ? "basics" : first === "limit" ? "limits" : "controls";
      document.getElementById(`section-${target}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      return null;
    }
    return {
      ...draft,
      nickname: draft.nickname.trim(),
      limit: { ...draft.limit, amount: amount! },
      expiry,
      activeFrom: periodOn ? draft.activeFrom || undefined : undefined,
      activeUntil: periodOn ? draft.activeUntil || undefined : undefined,
    };
  }

  const submit = async () => {
    const v = validate();
    if (!v) return;
    setDraft(v);
    if (mode === "create") {
      const all = [v, ...extraNames.map((n) => ({ ...v, id: `c_${Math.random().toString(36).slice(2, 9)}`, last4: randomLast4(), nickname: n.trim() }))];
      if ((await issue.run(all)).ok) {
        deleteCardDraft(draftId);
        setDone(all);
      }
    } else if ((await save.run(v)).ok) {
      toast("Changes saved");
      router.push(`/cards/${v.id}`);
    }
  };

  if (done)
    return (
      <Success
        cards={done}
        onAnother={() => {
          setDraft(newCardDraft(""));
          setExtraNames([]);
          setPeriodOn(false);
          setAmountText("5000");
          setYears(3);
          setStep(0);
          setErrors({});
          setDone(null);
        }}
      />
    );

  const others = visibleCards(role, allCards).filter((c) => c.status === "active" && c.id !== draft.id);
  const pending = issue.pending || save.pending;

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Form pane */}
      <div className={cn("flex min-w-0 flex-col lg:flex-1", pane === "form" && "flex-1")}>
        <header className="flex h-16 items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5 text-[14px] font-medium text-fg">
            <Image src={asset("/foren-logo.svg")} alt="" width={22} height={22} />
            {COMPANY.name}
          </div>
          <Link href={closeHref} aria-label="Close" className="grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus lg:hidden">
            <RiCloseLine className="size-5" aria-hidden />
          </Link>
        </header>
        {/* Phones/tablets: switch between the form and the live preview (desktop shows both side by side). */}
        <div className="px-5 pb-2 sm:px-8 lg:hidden">
          <ForenSegmentedControl
            size="lg"
            fullWidth
            ariaLabel="Show"
            options={[
              { value: "form", label: "Details" },
              { value: "preview", label: "Preview" },
            ]}
            value={pane}
            onChange={(v) => setPane(v as "form" | "preview")}
          />
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (stepped && step < STEPS.length - 1) next();
            else submit();
          }}
          className={cn("w-full flex-1 flex-col lg:flex", pane === "form" ? "flex" : "hidden")}
        >
          <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 pb-8 sm:px-8">
          {stepped ? (
            <>
              <StepProgress step={step} />
              <p className="mt-6 text-[13px] font-medium text-fg-3">
                Step {step + 1} of {STEPS.length}
              </p>
              <h1 className="mt-1 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg outline-none" tabIndex={-1} ref={headingRef}>
                {STEPS[step].title}
              </h1>
              <p className="mt-1 mb-2 text-[14px] leading-[21px] text-fg-2">{STEPS[step].desc}</p>
            </>
          ) : (
            <>
              <h1 className="mt-4 mb-2 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg">{`Edit ${initial?.nickname}`}</h1>
              <p className="mb-4 text-[14px] text-fg-2">Changes apply to new charges as soon as you save.</p>
            </>
          )}
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="mb-2 rounded-[14px] bg-error-subtle px-4 py-2.5 text-[13px] font-medium text-error">
              Check the highlighted fields.
            </p>
          )}

          {show(0) && <Row id="basics" label="Card for" stepped={stepped}>
            <HolderPicker card={draft} onChange={set} error={errors.holderId} disabled={mode === "edit"} hideTitle={stepped} />
            <ForenInput label="Nickname" placeholder="e.g. Ops travel" value={draft.nickname} maxLength={60} onChange={(e) => set({ nickname: e.target.value })} error={errors.nickname} description="Shown on the card and in your card list." />
            {mode === "create" && (
              <div className="space-y-2">
                {extraNames.map((n, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <ForenInput
                      containerClassName="flex-1"
                      label={`Card ${i + 2} nickname`}
                      placeholder="e.g. AWS"
                      value={n}
                      maxLength={60}
                      autoFocus={!n}
                      onChange={(e) => setExtraNames((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))}
                    />
                    <ForenButton type="button" variant="ghost" size="sm" aria-label={`Remove card ${i + 2}`} leadingIcon={<RiDeleteBinLine />} className="mb-0.5 px-3" onClick={() => setExtraNames((xs) => xs.filter((_, j) => j !== i))} />
                  </div>
                ))}
                {extraNames.length < 9 && (
                  <button type="button" onClick={() => setExtraNames((xs) => [...xs, ""])} className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-[13px] font-semibold text-fg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus">
                    <RiAddLine className="size-4" aria-hidden />
                    Add another card with the same settings
                  </button>
                )}
                {extraNames.length > 0 && <p className="text-[12px] leading-[17px] text-fg-3">Each card gets its own number. Handy for giving each subscription or supplier its own card.</p>}
              </div>
            )}
          </Row>}

          {show(1) && <Row id="controls" label="Spend controls" stepped={stepped}>
            <PermissionsEditor value={draft.permissions} onChange={(permissions) => set({ permissions })} error={errors.permissions} />
            <div className="rounded-[16px] bg-subtle p-4">
              <button type="button" aria-expanded={checkerOpen} onClick={() => setCheckerOpen((o) => !o)} className="flex w-full items-center gap-2 text-left text-[14px] font-semibold text-fg outline-none focus-visible:underline">
                <RiSearchEyeLine className="size-[18px]" aria-hidden />
                Check a merchant <span className="font-normal text-fg-3">(optional)</span>
              </button>
              {checkerOpen && (
                <div className="mt-3">
                  <MerchantChecker
                    card={{ ...draft, status: "active" }}
                    alternatives={others}
                    compact
                    canFix
                    onFix={(m, fix) => {
                      const p = draft.permissions;
                      if (fix === "allow_merchant")
                        set({
                          permissions: {
                            ...p,
                            blockedMerchantIds: p.blockedMerchantIds.filter((x) => x !== m.id),
                            allowedMerchantIds: p.mode === "merchants" && !p.allowedMerchantIds.includes(m.id) ? [...p.allowedMerchantIds, m.id] : p.allowedMerchantIds,
                          },
                        });
                      if (fix === "allow_category")
                        set({
                          permissions: {
                            ...p,
                            blockedCategories: p.blockedCategories.filter((x) => x !== m.category),
                            allowedCategories: p.mode === "categories" && !p.allowedCategories.includes(m.category) ? [...p.allowedCategories, m.category] : p.allowedCategories,
                          },
                        });
                      toast(`Updated permissions for ${m.name}. Review the change above.`);
                    }}
                  />
                </div>
              )}
            </div>
          </Row>}

          {show(2) && <Row label="Funding" stepped={stepped}>
            <FundingEditor value={draft.funding} onChange={(funding) => set({ funding })} />
          </Row>}

          {show(3) && <Row id="limits" label="Spending limit" stepped={stepped} sub>
            <div className="flex flex-col gap-2">
              <label htmlFor="limit-type" className="text-[14px] font-medium text-fg">
                Limit type
              </label>
              <select
                id="limit-type"
                value={draft.limit.period}
                onChange={(e) => set({ limit: { ...draft.limit, period: e.target.value as LimitPeriod } })}
                className="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus"
              >
                {(Object.keys(PERIOD_LABEL) as LimitPeriod[]).map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <ForenInput
                label={`${PERIOD_LABEL[draft.limit.period]} spending limit`}
                inputMode="decimal"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                error={errors.limit}
                className="tnum"
                description={!errors.limit ? (limitSentence ? `${limitSentence}.` : "Enter an amount.") : undefined}
              />
              <div className="flex flex-col gap-2">
                <label htmlFor="limit-cur" className="text-[14px] font-medium text-fg">
                  Currency
                </label>
                <select
                  id="limit-cur"
                  value={draft.limit.amount.currency}
                  onChange={(e) => set({ limit: { ...draft.limit, amount: { ...draft.limit.amount, currency: e.target.value as Currency } } })}
                  className="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus"
                >
                  {POLICY.launchCurrencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </Row>}

          {mode === "create" && show(3) && (
            <Row label="Expiry" stepped={stepped} sub>
              <fieldset>
                <legend className="mb-2 text-[14px] font-medium text-fg">When should the card expire?</legend>
                <div className="grid gap-2">
                  {[
                    [3, "In 3 years", "The default. Good for cards you’ll keep using."],
                    [2, "In 2 years", ""],
                    [1, "In 1 year", "For short projects or temporary spend."],
                  ].map(([y, t, d]) => (
                    <ChoiceCard key={y} name="expiry" value={String(y)} checked={years === y} onChange={() => setYears(y as number)} title={`${t} · ${expiryLabel(expiryFromYears(y as number))}`} description={(d as string) || undefined} />
                  ))}
                </div>
              </fieldset>
            </Row>
          )}

          {mode === "create" && show(3) && (
            <Row label="Spending period" stepped={stepped} sub>
              <ForenToggle
                reverse
                className="w-full justify-between"
                label="Only allow spending between certain dates"
                description="For a trip, an event or a short project. Payments outside the dates are declined."
                checked={periodOn}
                onCheckedChange={setPeriodOn}
              />
              {periodOn && (
                <div className="grid grid-cols-2 gap-3">
                  <ForenInput label="From" type="date" value={draft.activeFrom ?? ""} onChange={(e) => set({ activeFrom: e.target.value || undefined })} />
                  <ForenInput label="Until" type="date" value={draft.activeUntil ?? ""} onChange={(e) => set({ activeUntil: e.target.value || undefined })} />
                </div>
              )}
            </Row>
          )}

          {show(4) && <Row label="Design" hint="Optional" stepped={stepped}>
            <div role="radiogroup" aria-label="Card design" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {(Object.keys(DESIGNS) as CardDesign[]).map((d) => (
                <label key={d} className="flex cursor-pointer flex-col items-center gap-1.5">
                  <input type="radio" name="design" value={d} checked={draft.design === d} onChange={() => set({ design: d })} className="peer sr-only" />
                  <span
                    className={cn(
                      "block aspect-[1.586] w-full rounded-[8px] ring-offset-2 ring-offset-surface peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
                      draft.design === d ? "ring-2 ring-[var(--color-foren-brand-green)]" : "ring-1 ring-line"
                    )}
                    style={{ background: `linear-gradient(135deg, ${DESIGNS[d].stops.join(", ")})` }}
                  />
                  <span className={cn("text-[12px] font-medium", draft.design === d ? "text-fg" : "text-fg-3")}>{DESIGN_LABEL[d]}</span>
                </label>
              ))}
            </div>
            {stepped && <p className="text-[13px] leading-[18px] text-fg-2">Check the summary beside the card. Use Back to change anything before you create it.</p>}
          </Row>}

          </div>

          {/* Floating action bar (Figma "Floating button"): full content width, pinned to the bottom. */}
          <div className="sticky bottom-0 z-20 border-t border-line bg-surface px-5 py-3 sm:min-h-[84px] sm:px-8 sm:py-5">
            {(issue.error || save.error) && (
              <p role="alert" className="mb-3 rounded-[14px] bg-error-subtle px-4 py-2.5 text-[13px] leading-[18px] text-error">
                {mode === "create" ? "We couldn’t issue this card. Nothing was created, and your answers are still here. Try again." : COPY.saveFailure}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              {stepped && step < STEPS.length - 1 ? (
                <ForenButton type="submit" size="sm" className="w-full sm:order-last sm:flex-1" disabled={!ready} trailingIcon={<RiArrowRightLine />}>
                  Continue
                </ForenButton>
              ) : (
                <ForenButton type="submit" size="sm" className="w-full sm:order-last sm:flex-1" disabled={pending || !ready}>
                  {mode === "create" ? (issue.pending ? "Creating card…" : issue.error ? "Try again" : COPY.createCard) : save.pending ? "Saving…" : save.error ? "Try again" : "Save changes"}
                </ForenButton>
              )}
              <div className="flex gap-2 sm:contents">
                {stepped && step > 0 ? (
                  <ForenButton type="button" variant="outline" size="sm" className="flex-1" leadingIcon={<RiArrowLeftLine />} onClick={() => { setErrors({}); setStep(step - 1); top(); }}>
                    Back
                  </ForenButton>
                ) : (
                  <LinkButton href={closeHref} variant="outline" size="sm" className="flex-1">
                    Cancel
                  </LinkButton>
                )}
                {stepped && (
                  <ForenButton
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    leadingIcon={<RiSave3Line />}
                    disabled={saveDraft.pending}
                    onClick={async () => {
                      const r = await saveDraft.run({ id: draftId, savedAt: new Date().toISOString(), step, card: draft, names: extraNames, amountText, years });
                      if (r.ok) {
                        toast("Draft saved. Find it in your card list.");
                        router.push("/cards");
                      }
                    }}
                  >
                    Save and finish later
                  </ForenButton>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Preview + summary pane — doubles as the review before issuing */}
      <aside aria-label="Card summary" className={cn("mx-5 mt-2 mb-5 flex-1 rounded-[20px] bg-subtle sm:mx-8 lg:sticky lg:top-2 lg:m-2 lg:block lg:h-[calc(100dvh-16px)] lg:w-[44%] lg:max-w-[600px] lg:flex-none lg:overflow-y-auto", pane === "preview" ? "block" : "hidden")}>
        <div className="hidden h-16 items-center justify-end px-6 lg:flex">
          <Link href={closeHref} aria-label="Close" className="grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus">
            <RiCloseLine className="size-5" aria-hidden />
          </Link>
        </div>
        <div className="mx-auto flex max-w-[380px] flex-col items-center gap-5 px-6 py-8 lg:py-6">
          <CardArt card={{ ...draft, nickname: draft.nickname.trim() || "Card nickname" }} size="lg" holderName={nameOnCard(draft) ?? "Cardholder"} lockText={lockText(draft)} />
          <dl className="w-full divide-y divide-line rounded-[20px] bg-surface px-4 text-[13px] ring-1 ring-line">
            <Sum label={extraNames.length ? `Cards (${extraNames.length + 1})` : "Nickname"}>
              {[draft.nickname, ...extraNames].map((n) => n.trim() || "—").join(", ")}
            </Sum>
            <Sum label={draft.companyCard ? "Company card, used by" : "Cardholder"}>
              {draft.holderId ? usedBy(draft) : "—"}
              {holder?.invited && <span className="block text-[12px] text-fg-3">Invite pending</span>}
            </Sum>
            <Sum label="Money comes from">
              {strategyLabel(draft.funding)}
              <span className="block text-[12px] text-fg-3">Your Foren balances</span>
            </Sum>
            <Sum label="Where it works">{permissionSentence(draft)}</Sum>
            <Sum label="Spending limit">{limitSentence ?? "—"}</Sum>
            {periodOn && (draft.activeFrom || draft.activeUntil) && (
              <Sum label="Works between">
                {draft.activeFrom ?? "now"} – {draft.activeUntil ?? "no end"}
              </Sum>
            )}
            {mode === "create" && <Sum label="Expiration date">{expiryLabel(expiry)}</Sum>}
          </dl>
        </div>
      </aside>
    </div>
  );
}

function Row({ id, label, hint, stepped, sub, children }: { id?: string; label: string; hint?: string; stepped?: boolean; sub?: boolean; children: React.ReactNode }) {
  if (stepped)
    return (
      <section id={id ? `section-${id}` : undefined} aria-label={label} className="scroll-mt-6 space-y-4 py-4">
        {sub && <h2 className="text-[15px] font-semibold text-fg">{label}</h2>}
        {children}
      </section>
    );
  return (
    <section id={id ? `section-${id}` : undefined} aria-label={label} className="grid scroll-mt-6 gap-3 border-b border-line py-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
      <h2 className="pt-0.5 text-[14px] font-medium text-fg-2">
        {label}
        {hint && <span className="block text-[12px] font-normal text-fg-3">{hint}</span>}
      </h2>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

type StepField = keyof Errors;
const STEPS: { title: string; desc: string; fields: StepField[] }[] = [
  { title: "Who’s this card for?", desc: "A card in a team member’s name, or a company card for shared spend. Then give it a name your team will recognise.", fields: ["holderId", "nickname"] },
  { title: "Where can it be used?", desc: "Decide whether the card is for one merchant or many. Risky categories are blocked either way.", fields: ["permissions"] },
  { title: "Where does the money come from?", desc: "Cards only pay from your Foren balances. Choose which balance is used first.", fields: [] },
  { title: "How much can it spend?", desc: "Set a spending limit and when the card expires.", fields: ["limit"] },
  { title: "Choose a design and review", desc: "Pick a look for the card, check the summary, then create it.", fields: [] },
];

/** One progress bar for the create flow. */
function StepProgress({ step }: { step: number }) {
  const pct = ((step + 1) / STEPS.length) * 100;
  return (
    <div role="progressbar" aria-label="Create card progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${STEPS.length}`} className="mt-2 h-1 overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-[var(--color-foren-bg-button-primary)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Sum({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-fg-3">{label}</dt>
      <dd className="tnum text-right text-fg">{children}</dd>
    </div>
  );
}

/** Centered success with one optional follow-up setting (Mercury "You’re all set"). */
function Success({ cards, onAnother }: { cards: Card[]; onAnother: () => void }) {
  const card = cards[0];
  const reduce = useReducedMotion();
  const router = useRouter();
  const patchCard = useStore((s) => s.patchCard);
  const live = useStore((s) => s.cards.find((c) => c.id === card.id)) ?? card;
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-subtle px-5 py-16 text-center">
      <Link href="/cards" aria-label="Close" className="fixed top-5 right-5 grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus">
        <RiCloseLine className="size-5" aria-hidden />
      </Link>
      <motion.div initial={reduce ? false : { opacity: 0, y: 24, rotate: -6, scale: 0.92 }} animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}>
        <CardArt card={card} size="md" holderName={nameOnCard(card)} />
      </motion.div>
      <h1 className="mt-6 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg" tabIndex={-1} ref={(el) => el?.focus()}>
        {cards.length > 1 ? `${cards.length} cards created` : COPY.successTitle}
      </h1>
      <p className="mt-2 max-w-sm text-[14px] leading-[22px] text-fg-2">{cards.length > 1 ? `${cards.map((c) => c.nickname).join(", ")}. Each has its own number and the same settings.` : COPY.successBody}</p>
      {personById(card.holderId)?.invited && (
        <p className="mt-3 max-w-sm rounded-[14px] bg-surface px-4 py-2.5 text-[13px] leading-[18px] text-fg-2 ring-1 ring-line">
          We’ve emailed {personById(card.holderId)?.name} an invite. They can use this card once they’ve joined Foren.
        </p>
      )}
      {lockText(card) && <p className="mt-3 max-w-sm text-[13px] leading-[18px] text-fg-2">It locks to the first merchant that charges it.</p>}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <ForenButton variant="secondary" onClick={onAnother}>
          Create another
        </ForenButton>
        <ForenButton onClick={() => router.push(`/cards/${card.id}`)}>View card details</ForenButton>
      </div>
      <div className="mt-8 w-full max-w-[400px] rounded-[20px] bg-surface p-4 text-left ring-1 ring-line">
        <ForenToggle
          reverse
          className="w-full justify-between"
          label={
            <span className="inline-flex items-center gap-2">
              <RiNotification3Line className="size-4 text-fg-2" aria-hidden /> Remind me before subscriptions renew
            </span>
          }
          checked={!!live.renewalReminders}
          onCheckedChange={(v) => {
            patchCard(card.id, { renewalReminders: v });
            toast(v ? "Reminder rule enabled" : "Reminder rule turned off");
          }}
        />
        <p className="mt-2 text-[12px] leading-[16px] text-fg-3">Recommended for cards that pay software or other recurring merchants. Reminders use estimated dates, and you can change this from the card’s subscriptions.</p>
      </div>
    </div>
  );
}
