"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { CodeInput, ResendCodeButton, emptyCode, type CodeInputHandle } from "./code-input";
import { CheckingOverlay, OnboardingFrame } from "./frame";
import { useSignupGuard } from "./guard";

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
  const [digits, setDigits] = React.useState<string[]>(emptyCode);
  const [error, setError] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);
  const codeRef = React.useRef<CodeInputHandle>(null);
  // After a wrong code the boxes are cleared and re-enabled: put the cursor back in the first one.
  React.useEffect(() => {
    if (error && !checking && digits.every((d) => !d)) codeRef.current?.focus(0);
  }, [error, checking, digits]);

  const verify = React.useCallback(
    (code: string) => {
      setChecking(true);
      setError(null);
      setTimeout(() => {
        if (code === "000000") {
          setChecking(false);
          setError("That code isn’t right. Check the latest email we sent, or resend the code.");
          setDigits(emptyCode());
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

  const onDigitsChange = (next: string[]) => {
    setDigits(next);
    setError(null);
    if (next.every((d) => d)) verify(next.join(""));
  };

  return (
    <OnboardingFrame
      titleMaxWidth={480}
      headerGap={24}
      step="account"
      back="/onboarding/account"
      title="Enter the verification code we sent to your email"
      description={
        <>
          We have sent a code to <span className="font-semibold text-fg">{email}</span>
          <br />
          This helps us keep your account secure by verifying that it’s really you.
        </>
      }
    >
      <div className="flex flex-col items-center gap-8 rounded-[24px] bg-surface px-4 py-6">
        <div className="flex flex-col items-center gap-[26px]">
          <CodeInput ref={codeRef} digits={digits} onDigitsChange={onDigitsChange} disabled={checking} invalid={!!error} autoFocus describedBy="ve-code-hint" />
          <p id="ve-code-hint" role={error ? "alert" : undefined} className={cn("text-center text-[12px] leading-[18px] font-medium tracking-[0.01em]", error ? "text-error" : "text-fg-3")}>
            {error ?? "Didn’t get it? Check spam, or resend below."}
          </p>
        </div>
        <ResendCodeButton disabled={checking} onResend={() => toast(`We sent a new code to ${maskEmail(email)}`)} />
        <p className="text-[11px] leading-4 text-fg-3">Prototype: any 6 digits work. 000000 shows the error.</p>
      </div>
      {checking && <CheckingOverlay label="Checking your code" />}
    </OnboardingFrame>
  );
}
