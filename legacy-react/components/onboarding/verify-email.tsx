"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RiRefreshLine } from "@remixicon/react";
import { toast } from "sonner";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { CheckingOverlay, OnboardingFrame } from "./frame";
import { useSignupGuard } from "./guard";

const LENGTH = 6;
const RESEND_AFTER = 30;

/** kar****@gmail.com */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 3)}****@${domain}`;
}

export function VerifyEmail() {
  const router = useRouter();
  const ok = useSignupGuard("/onboarding/verify-email");
  const email = useOnboarding((s) => s.email);
  const set = useOnboarding((s) => s.set);
  const [digits, setDigits] = React.useState<string[]>(() => Array(LENGTH).fill(""));
  const [error, setError] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [wait, setWait] = React.useState(RESEND_AFTER);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = React.useCallback(
    (code: string) => {
      setChecking(true);
      setError(null);
      setTimeout(() => {
        if (code === "000000") {
          setChecking(false);
          setError("That code isn’t right. Check the latest email we sent, or resend the code.");
          setDigits(Array(LENGTH).fill(""));
          refs.current[0]?.focus();
          return;
        }
        set({ emailVerified: true });
        toast.success("Email has been confirmed", { description: "Your email has been verified successfully." });
        router.push("/onboarding/identity");
      }, 1200);
    },
    [router, set]
  );

  if (!ok) return null;

  const update = (next: string[], focus?: number) => {
    setDigits(next);
    setError(null);
    if (focus !== undefined) refs.current[Math.min(focus, LENGTH - 1)]?.focus();
    if (next.every((d) => d)) verify(next.join(""));
  };

  const onChange = (i: number, raw: string) => {
    const only = raw.replace(/\D/g, "");
    if (!only) return update(digits.map((d, j) => (j === i ? "" : d)));
    // Typing or autofill can deliver several digits at once: spread them forward.
    const next = [...digits];
    let k = i;
    for (const ch of only) {
      if (k >= LENGTH) break;
      next[k++] = ch;
    }
    update(next, k);
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      update(digits.map((d, j) => (j === i - 1 ? "" : d)), i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(LENGTH)
      .fill("")
      .map((_, j) => text[j] ?? "");
    update(next, text.length);
  };

  return (
    <OnboardingFrame
      step="account"
      back="/onboarding/account"
      title="Enter the verification code we sent to your email"
      description={
        <>
          We sent a code to <span className="font-semibold text-fg">{maskEmail(email)}</span>. This keeps your account secure by checking it’s really you.
        </>
      }
    >
      <div className="flex flex-col items-center gap-6 rounded-[24px] bg-surface px-4 py-6">
        <fieldset className="flex flex-col items-center gap-3">
          <legend className="mb-3 text-center text-[14px] leading-[21px] font-medium text-fg">Verification code</legend>
          <div className="flex gap-2" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={LENGTH}
                autoFocus={i === 0}
                disabled={checking}
                aria-label={`Digit ${i + 1} of ${LENGTH}`}
                aria-invalid={!!error || undefined}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={cn(
                  "size-11 rounded-[12px] border bg-subtle text-center text-[20px] font-semibold text-fg tabular-nums outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20 sm:size-12",
                  error ? "border-error" : "border-line"
                )}
              />
            ))}
          </div>
        </fieldset>
        <p role={error ? "alert" : undefined} className={cn("text-center text-[12px] leading-[18px] font-medium", error ? "text-error" : "text-fg-2")}>
          {error ?? "Didn’t get it? Check spam, or resend below."}
        </p>
        <button
          type="button"
          disabled={wait > 0 || checking}
          onClick={() => {
            setWait(RESEND_AFTER);
            toast(`We sent a new code to ${maskEmail(email)}`);
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--color-foren-bg-button-secondary)] px-3 text-[12px] leading-[18px] font-medium text-fg-2 outline-none hover:bg-[var(--color-foren-bg-button-secondary-hover)] focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:text-fg-3"
        >
          <RiRefreshLine className="size-3.5" aria-hidden />
          {wait > 0 ? `Resend code (${wait}s)` : "Resend code"}
        </button>
        <p className="text-[11px] leading-4 text-fg-3">Prototype: any 6 digits work. 000000 shows the error.</p>
      </div>
      {checking && <CheckingOverlay label="Checking your code" />}
    </OnboardingFrame>
  );
}
