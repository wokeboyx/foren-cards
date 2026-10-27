"use client";
import * as React from "react";
import { ForenButton } from "@/components/ui/foren-button";
import { Modal } from "@/components/overlay";
import { cn } from "@/lib/utils";

/** Prototype rule: any 4 digits work except this one, which shows the wrong-PIN state. */
const WRONG_PIN = "0000";
const LENGTH = 4;

/**
 * Transaction PIN check before approving (Figma Settings › Security: "Transaction PIN — Required to approve
 * payments"). Four single-digit boxes; the decision only runs once the PIN is confirmed.
 */
export function TransactionPinDialog({
  open,
  onOpenChange,
  action,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** What the PIN approves, e.g. "Approve once". */
  action: string;
  onConfirm: () => Promise<boolean>;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Enter your transaction PIN" description="Your PIN is needed to approve requests.">
      {open && <PinForm action={action} onCancel={() => onOpenChange(false)} onConfirm={onConfirm} />}
    </Modal>
  );
}

function PinForm({ action, onCancel, onConfirm }: { action: string; onCancel: () => void; onConfirm: () => Promise<boolean> }) {
  const [digits, setDigits] = React.useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const pin = digits.join("");

  React.useEffect(() => refs.current[0]?.focus(), []);

  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setError(null);
    setDigits((prev) => prev.map((x, j) => (j === i ? d : x)));
    if (d && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < LENGTH) return setError("Enter all 4 digits.");
    if (pin === WRONG_PIN) {
      setDigits(Array(LENGTH).fill(""));
      refs.current[0]?.focus();
      return setError("That PIN isn’t right. Try again.");
    }
    setBusy(true);
    const ok = await onConfirm();
    setBusy(false);
    if (!ok) setError("We couldn’t approve this. Try again.");
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset>
        <legend className="sr-only">Transaction PIN</legend>
        <div className="flex gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              value={d}
              aria-label={`PIN digit ${i + 1}`}
              aria-invalid={!!error || undefined}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
              }}
              onPaste={(e) => {
                const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
                if (!p) return;
                e.preventDefault();
                setDigits(Array.from({ length: LENGTH }, (_, j) => p[j] ?? ""));
                refs.current[Math.min(p.length, LENGTH - 1)]?.focus();
              }}
              className={cn(
                "tnum h-14 w-14 rounded-[16px] bg-subtle text-center text-[22px] font-semibold text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus",
                error && "ring-2 ring-error"
              )}
            />
          ))}
        </div>
        <p role={error ? "alert" : undefined} className={cn("mt-2 min-h-[18px] text-[13px]", error ? "text-error" : "text-fg-3")}>
          {error ?? "Test PIN: any 4 digits except 0000."}
        </p>
      </fieldset>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton type="button" variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </ForenButton>
        <ForenButton type="submit" size="sm" disabled={busy || pin.length < LENGTH}>
          {busy ? "Approving…" : action}
        </ForenButton>
      </div>
    </form>
  );
}
