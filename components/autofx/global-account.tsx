"use client";
import { PageHeader } from "@/components/page-header";
import * as React from "react";
import { LinkButton } from "@/components/link-button";
import {
  RiAddLine,
  RiArrowUpDownLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDeleteBinLine,
  RiExchangeDollarLine,
  RiFlashlightLine,
  RiPlaneLine,
  RiPlayLine,
  RiScales3Line,
  RiShieldCheckLine,
  RiTimeLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { ForenAccountWallet } from "@/components/ui/foren-account-wallet";
import { ForenBadge, type BadgeColor } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenInput } from "@/components/ui/foren-input";
import { ForenProgress } from "@/components/ui/foren-progress";
import { NotAllowed } from "@/components/create/route-pages";
import { ChoiceCard } from "@/components/create/choice-card";
import { Money } from "@/components/money";
import { ConfirmDialog, Modal } from "@/components/overlay";
import { EmptyState, ErrorState, LoadingRows, Panel } from "@/components/states";
import { POLICY } from "@/config/policy";
import { COPY } from "@/content/copy";
import { evaluateGoal, goalSentence } from "@/domain/autofx";
import { CURRENCY_NAME, format, formatRate, parseAmount, rate } from "@/domain/money";
import type { AutoFxGoal, Currency, GoalStatus, GoalType } from "@/domain/types";
import { call, useAction, useLoad } from "@/lib/api";
import { can } from "@/lib/permissions";
import { now, uid, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/base-path";

const GOAL_TYPES: Record<GoalType, { title: string; line: string; icon: React.ReactNode }> = {
  keep_min: { title: "Keep a minimum balance", line: "Top a currency up from another balance when it drops below a floor.", icon: <RiShieldCheckLine /> },
  target_rate: { title: "Convert at a target rate", line: "Convert an amount automatically once the exchange rate reaches your target.", icon: <RiArrowUpDownLine /> },
  cap: { title: "Cap a balance", line: "Move anything above a ceiling into another currency.", icon: <RiScales3Line /> },
};

const STATUS: Record<GoalStatus, { label: string; color: BadgeColor; icon: React.ReactNode }> = {
  on_track: { label: "On track", color: "success", icon: <RiCheckboxCircleLine aria-hidden /> },
  waiting_for_rate: { label: "Waiting for rate", color: "indigo", icon: <RiTimeLine aria-hidden /> },
  action_taken: { label: "Action taken", color: "primary", icon: <RiFlashlightLine aria-hidden /> },
  unable_to_act: { label: "Unable to act", color: "error", icon: <RiCloseCircleLine aria-hidden /> },
};

const FLAGS: Partial<Record<Currency, string>> = { USD: asset("/foren/wallet/flag-usd.png"), GBP: asset("/foren/wallet/flag-gbp.png"), CAD: asset("/foren/wallet/flag-cad.png") };

export function GlobalAccount() {
  const role = useStore((s) => s.role);
  const balances = useStore((s) => s.balances);
  const goals = useStore((s) => s.goals);
  useStore((s) => s.rates); // re-render when demo rates move
  const runAutoFx = useStore((s) => s.runAutoFx);
  const { status, retry } = useLoad("global");
  const [editing, setEditing] = React.useState<GoalType | "choose" | null>(null);
  const [running, setRunning] = React.useState(false);

  if (!can(role, "autofx")) return <NotAllowed body="Only the account owner and finance lead can see the Global account." />;

  const affected = new Set(goals.flatMap((g) => [g.currency, g.counterCurrency]));
  const sorted = [...balances].sort((a, b) => b.available.minor / rate("USD", b.currency) - a.available.minor / rate("USD", a.currency));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global account"
        description="Balances your cards pay from."
        actions={
          <LinkButton href="/travel" variant="outline" size="xxs" leadingIcon={<RiPlaneLine />}>
            Spending abroad
          </LinkButton>
        }
      />

      {status === "loading" && (
        <Panel>
          <LoadingRows rows={4} />
        </Panel>
      )}
      {status === "error" && (
        <Panel>
          <ErrorState onRetry={retry} />
        </Panel>
      )}
      {status === "ready" && (
        <>
          <Panel className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[356px_1fr] lg:items-center">
            <div className="mx-auto hidden overflow-hidden sm:block">
              <ForenAccountWallet
                accounts={sorted
                  .filter((b) => FLAGS[b.currency])
                  .slice(0, 3)
                  .map((b) => ({ label: `${b.currency} account balance`, amount: format(b.available), flagSrc: FLAGS[b.currency]! }))}
                moreCount={balances.length - 3}
                onViewAll={() => document.getElementById("balances")?.scrollIntoView({ behavior: "smooth" })}
              />
            </div>
            <ul id="balances" className="divide-y divide-line">
              {balances.map((b) => (
                <li key={b.currency} className="flex items-center gap-3 py-3">
                  <span className="grid size-9 place-items-center rounded-full bg-subtle text-[12px] font-bold text-fg-2">{b.currency}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[14px] font-medium text-fg">
                      {CURRENCY_NAME[b.currency]}
                      {affected.has(b.currency) && (
                        <ForenBadge size="sm" color="primary" leadingIcon={<RiExchangeDollarLine aria-hidden />}>
                          AutoFX
                        </ForenBadge>
                      )}
                    </div>
                    {b.currency !== "USD" && <div className="tnum text-[12px] text-fg-3">{formatRate("USD", b.currency, rate("USD", b.currency))}</div>}
                  </div>
                  <Money value={b.available} className="text-[15px] font-semibold text-fg" />
                </li>
              ))}
            </ul>
          </Panel>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[20px] leading-[26px] font-semibold tracking-[-0.01em] text-fg">AutoFX goals</h2>
              {goals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <ForenButton
                    size="sm"
                    variant="outline"
                    leadingIcon={<RiPlayLine />}
                    disabled={running}
                    onClick={async () => {
                      setRunning(true);
                      try {
                        const n = await call(() => runAutoFx());
                        toast(n ? `${n} ${n === 1 ? "goal" : "goals"} took action` : "No goals needed to act");
                      } catch {
                        toast.error("We couldn’t run the check. Nothing was converted. Try again.");
                      } finally {
                        setRunning(false);
                      }
                    }}
                  >
                    {running ? "Checking…" : "Run goal check (demo)"}
                  </ForenButton>
                  {role === "owner" && (
                    <ForenButton size="sm" leadingIcon={<RiAddLine />} onClick={() => setEditing("choose")}>
                      New goal
                    </ForenButton>
                  )}
                </div>
              )}
            </div>
            {goals.length === 0 ? (
              <Panel>
                <EmptyState icon={<RiExchangeDollarLine />} title={COPY.autoFxEmpty.title} body={COPY.autoFxEmpty.body}>
                  {role === "owner" ? (
                    <div className="mt-6 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
                      {(Object.keys(GOAL_TYPES) as GoalType[]).map((t) => (
                        <button key={t} onClick={() => setEditing(t)} className="rounded-[18px] border border-line p-4 text-left outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-focus">
                          <span className="text-fg-2 [&_svg]:size-5" aria-hidden>
                            {GOAL_TYPES[t].icon}
                          </span>
                          <span className="mt-2 block text-[14px] font-semibold text-fg">{GOAL_TYPES[t].title}</span>
                          <span className="mt-1 block text-[13px] leading-[18px] text-fg-2">{GOAL_TYPES[t].line}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-[13px] text-fg-3">The account owner can set up currency goals.</p>
                  )}
                </EmptyState>
              </Panel>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {goals.map((g) => (
                  <GoalCard key={g.id} goal={g} canEdit={role === "owner"} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <GoalEditor
        open={editing !== null}
        initialType={editing === "choose" ? null : editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}

function GoalCard({ goal, canEdit }: { goal: AutoFxGoal; canEdit: boolean }) {
  const balances = useStore((s) => s.balances);
  const removeGoal = useStore((s) => s.removeGoal);
  const ev = evaluateGoal(goal, balances);
  const st = STATUS[ev.status];
  const [confirm, setConfirm] = React.useState(false);
  return (
    <Panel className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.06em] text-fg-3 uppercase">
          <span className="[&_svg]:size-4" aria-hidden>
            {GOAL_TYPES[goal.type].icon}
          </span>
          {GOAL_TYPES[goal.type].title}
        </div>
        <ForenBadge size="sm" color={st.color} leadingIcon={st.icon}>
          {st.label}
        </ForenBadge>
      </div>
      <p className="mt-2 text-[16px] leading-[22px] font-semibold text-fg">{goalSentence(goal)}</p>
      {ev.progress !== null && (
        <ForenProgress
          className="mt-3"
          size="sm"
          value={ev.progress * 100}
          hideValue
          aria-label="Goal progress"
          fillColor={ev.status === "unable_to_act" ? "var(--color-foren-error)" : undefined}
        />
      )}
      <p className="tnum mt-2 text-[13px] leading-[18px] text-fg-2">{ev.message}</p>
      {ev.nextStep && <p className="mt-1 text-[13px] font-medium text-fg">Next: {ev.nextStep}</p>}
      {goal.actions.length > 0 && (
        <details className="mt-3 text-[13px]">
          <summary className="cursor-pointer font-medium text-fg-2">Activity ({goal.actions.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {[...goal.actions].reverse().map((a) => (
              <li key={a.at} className="tnum text-fg-2">
                <span className="text-fg-3">{new Date(a.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span> · {a.text}
              </li>
            ))}
          </ul>
        </details>
      )}
      {canEdit && (
        <div className="mt-auto pt-3">
          <ForenButton size="xxs" variant="ghost" destructive leadingIcon={<RiDeleteBinLine />} onClick={() => setConfirm(true)}>
            Remove goal
          </ForenButton>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Remove this goal?"
        consequence="Foren will stop managing this balance. Conversions that already happened aren’t reversed."
        confirmLabel="Remove goal"
        destructive
        onConfirm={() => {
          removeGoal(goal.id);
          setConfirm(false);
          toast("Goal removed");
        }}
      />
    </Panel>
  );
}

function GoalEditor({ open, onOpenChange, initialType }: { open: boolean; onOpenChange: (o: boolean) => void; initialType: GoalType | null }) {
  const addGoal = useStore((s) => s.addGoal);
  const [type, setType] = React.useState<GoalType | null>(initialType);
  const [currency, setCurrency] = React.useState<Currency>("GBP");
  const [counter, setCounter] = React.useState<Currency>("USD");
  const [amount, setAmount] = React.useState("");
  const [targetRate, setTargetRate] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const save = useAction(async (g: AutoFxGoal) => call(() => addGoal(g)));

  React.useEffect(() => {
    if (open) {
      setType(initialType);
      setErrors({});
      setAmount("");
      setTargetRate("");
      if (initialType === "target_rate") {
        setCurrency("USD");
        setCounter("NGN");
      } else {
        setCurrency(initialType === "cap" ? "CAD" : "GBP");
        setCounter("USD");
      }
    }
  }, [open, initialType]);

  const amt = parseAmount(amount, currency);
  const tr = Number(targetRate.replace(/,/g, ""));
  const draft = type
    ? {
        type,
        currency,
        counterCurrency: counter,
        threshold: type !== "target_rate" && amt && amt.minor > 0 ? amt : undefined,
        amount: type === "target_rate" && amt && amt.minor > 0 ? amt : undefined,
        targetRate: type === "target_rate" && tr > 0 ? tr : undefined,
      }
    : null;

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!amount.trim()) e.amount = "Enter an amount.";
    else if (!amt || amt.minor <= 0) e.amount = "Enter an amount above zero, using numbers only.";
    if (currency === counter) e.counter = "Choose a different currency.";
    if (type === "target_rate" && !(tr > 0)) e.rate = "Enter a target rate above zero.";
    setErrors(e);
    if (Object.keys(e).length || !draft) return;
    const r = await save.run({ ...draft, id: uid("g"), createdAt: now().toISOString(), actions: [] } as AutoFxGoal);
    if (r.ok) {
      toast("Goal saved. Nothing has been converted yet.");
      onOpenChange(false);
    }
  };

  const select = (id: string, label: string, value: Currency, onChange: (c: Currency) => void, error?: string) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-medium text-fg">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as Currency)} aria-invalid={!!error} className={cn("h-12 rounded-[16px] border bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus", error ? "border-error" : "border-transparent")}>
        {POLICY.launchCurrencies.map((c) => (
          <option key={c} value={c}>
            {c} — {CURRENCY_NAME[c]}
          </option>
        ))}
      </select>
      {error && <p className="text-[12px] text-error">{error}</p>}
    </div>
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={type ? GOAL_TYPES[type].title : "New currency goal"} className="sm:max-w-[520px]">
      {!type ? (
        <div role="radiogroup" className="grid gap-2">
          {(Object.keys(GOAL_TYPES) as GoalType[]).map((t) => (
            <ChoiceCard key={t} name="goal-type" value={t} checked={false} onChange={() => setType(t)} title={GOAL_TYPES[t].title} description={GOAL_TYPES[t].line} icon={GOAL_TYPES[t].icon} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {type === "keep_min" && (
            <>
              {select("g-cur", "Currency to protect", currency, setCurrency)}
              <ForenInput label={`Minimum ${currency} balance`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} className="tnum" />
              {select("g-counter", "Top up from", counter, setCounter, errors.counter)}
            </>
          )}
          {type === "target_rate" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {select("g-cur", "Convert from", currency, setCurrency)}
                {select("g-counter", "Convert to", counter, setCounter, errors.counter)}
              </div>
              <ForenInput label={`Amount of ${currency} to convert`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} className="tnum" />
              <ForenInput
                label={`Target rate (${counter} per 1 ${currency})`}
                inputMode="decimal"
                value={targetRate}
                onChange={(e) => setTargetRate(e.target.value)}
                error={errors.rate}
                className="tnum"
                description={currency !== counter ? `Today: ${formatRate(currency, counter, rate(currency, counter))}` : undefined}
              />
            </>
          )}
          {type === "cap" && (
            <>
              {select("g-cur", "Currency to cap", currency, setCurrency)}
              <ForenInput label={`Maximum ${currency} balance`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} className="tnum" />
              {select("g-counter", "Move the excess to", counter, setCounter, errors.counter)}
            </>
          )}
          {draft && (
            <div className="rounded-[16px] bg-primary-subtle px-4 py-3">
              <div className="text-[12px] font-semibold tracking-[0.06em] text-fg-3 uppercase">Your goal</div>
              <p className="mt-1 text-[15px] leading-[22px] font-semibold text-fg">{goalSentence(draft)}</p>
              <p className="mt-1 text-[12px] text-fg-2">Saving doesn’t convert anything now. Foren acts only when the rule is met, at the rate at that time, with the usual FX fee.</p>
            </div>
          )}
          {save.error && <p role="alert" className="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t save this goal. Try again.</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <ForenButton variant="ghost" size="sm" onClick={() => setType(null)}>
              Change goal type
            </ForenButton>
            <ForenButton size="sm" onClick={submit} disabled={save.pending || !draft}>
              {save.pending ? "Saving…" : "Save goal"}
            </ForenButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
