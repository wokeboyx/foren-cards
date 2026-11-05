"use client";
import * as React from "react";
import { ArrowClockwiseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Six-box verification code (Figma "Code box": 56px boxes, 8px apart, subtle fill, 26px semibold).
 * Used by Verify email (sign-up) and the login two-factor screens.
 * Typing moves forward, Backspace moves back, arrows move between boxes, and a pasted or autofilled code spreads across them.
 */

export const CODE_LENGTH = 6;

export const emptyCode = () => Array<string>(CODE_LENGTH).fill("");

export type CodeInputHandle = { focus: (index?: number) => void };

export const CodeInput = React.forwardRef<
  CodeInputHandle,
  {
    digits: string[];
    onDigitsChange: (next: string[]) => void;
    legend?: string;
    disabled?: boolean;
    invalid?: boolean;
    autoFocus?: boolean;
    /** id of the hint/error under the boxes. */
    describedBy?: string;
  }
>(function CodeInput({ digits, onDigitsChange, legend = "Verification code", disabled, invalid, autoFocus, describedBy }, ref) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  React.useImperativeHandle(ref, () => ({ focus: (i = 0) => refs.current[i]?.focus() }), []);

  const update = (next: string[], focus?: number) => {
    onDigitsChange(next);
    if (focus !== undefined) refs.current[Math.min(focus, CODE_LENGTH - 1)]?.focus();
  };

  const onChange = (i: number, raw: string) => {
    const only = raw.replace(/\D/g, "");
    if (!only) return update(digits.map((d, j) => (j === i ? "" : d)));
    // Typing or autofill can deliver several digits at once: spread them forward.
    const next = [...digits];
    let k = i;
    for (const ch of only) {
      if (k >= CODE_LENGTH) break;
      next[k++] = ch;
    }
    update(next, k);
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      update(digits.map((d, j) => (j === i - 1 ? "" : d)), i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!text) return;
    e.preventDefault();
    update(emptyCode().map((_, j) => text[j] ?? ""), text.length);
  };

  return (
    <fieldset className="flex min-w-0 flex-col items-center">
      <legend className="mb-2 text-center text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">{legend}</legend>
      <div className="flex gap-1.5 sm:gap-2" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={CODE_LENGTH}
            autoFocus={autoFocus && i === 0}
            disabled={disabled}
            aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={cn(
              "size-12 rounded-[16px] border bg-subtle text-center text-[22px] leading-10 font-semibold tracking-[-0.015em] text-fg tabular-nums outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20 sm:size-14 sm:text-[26px]",
              invalid ? "border-error" : "border-line"
            )}
          />
        ))}
      </div>
    </fieldset>
  );
});

const RESEND_AFTER = 30;

/** "Resend code (30s)" pill: disabled while the countdown runs, restarts it on click. */
export function ResendCodeButton({ onResend, disabled, seconds = RESEND_AFTER }: { onResend: () => void; disabled?: boolean; seconds?: number }) {
  const [wait, setWait] = React.useState(seconds);
  React.useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  return (
    <button
      type="button"
      disabled={wait > 0 || disabled}
      onClick={() => {
        setWait(seconds);
        onResend();
      }}
      className="inline-flex h-[38px] items-center gap-2 rounded-full bg-[var(--color-foren-bg-button-secondary)] px-3 text-[12px] leading-[18px] font-medium text-fg-2 outline-none hover:bg-[var(--color-foren-bg-button-secondary-hover)] focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:text-fg-3"
    >
      <ArrowClockwiseIcon className="size-3.5" aria-hidden />
      {wait > 0 ? `Resend code (${wait}s)` : "Resend code"}
    </button>
  );
}
