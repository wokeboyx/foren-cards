"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, fieldCls } from "@/components/onboarding/frame";
import { EMAIL_RE } from "@/components/onboarding/welcome-requirements";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenSpinner } from "@/components/ui/foren-spinner";
import { useLogin } from "@/lib/login-store";
import { AuthArt, AuthFrame, AuthHeading, PrototypeHint, textLinkCls } from "./auth-frame";

/** Reset your password: enter the email (Figma 8751:110800 empty, 8751:110855 filled). */
export function ForgotPassword() {
  const router = useRouter();
  const set = useLogin((s) => s.set);
  const [email, setEmail] = React.useState(() => useLogin.getState().resetEmail);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Invalid email");
      ref.current?.focus();
      return;
    }
    setSending(true);
    setTimeout(() => {
      set({ resetEmail: email.trim() });
      router.push("/login/forgot/sent");
    }, 900);
  };

  return (
    <AuthFrame>
      <div className="flex flex-col gap-6">
        <AuthArt src="/login/lock-large.png" size={212} />
        <AuthHeading title="Reset your password">
          <p>To protect your account you won’t be able to withdraw funds for 24 hours after you reset or change your account password.</p>
        </AuthHeading>
        <form noValidate onSubmit={submit} className="flex flex-col gap-10 rounded-[24px] bg-surface px-4 py-6">
          <Field
            htmlFor="reset-email"
            error={error}
            label={<span className="text-fg-2">Enter the email address associated with your account, we will send you a link to reset your password.</span>}
          >
            <input
              ref={ref}
              id="reset-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              aria-invalid={!!error || undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className={fieldCls}
            />
          </Field>
          <ForenButton
            type="submit"
            className="w-full"
            disabled={!email.trim() || sending}
            aria-busy={sending || undefined}
            leadingIcon={sending ? <ForenSpinner size="sm" className="text-current" /> : undefined}
          >
            Send password reset link
          </ForenButton>
        </form>
        <Link href="/login" className={`${textLinkCls} self-center`}>
          Return to login
        </Link>
      </div>
    </AuthFrame>
  );
}

/** Check your email (Figma 8751:110910). */
export function ResetLinkSent() {
  const router = useRouter();
  const email = useLogin((s) => s.resetEmail);

  React.useEffect(() => {
    if (!email) router.replace("/login/forgot");
  }, [email, router]);
  if (!email) return null;

  return (
    <AuthFrame className="lg:pt-[248px]">
      <div className="flex flex-col gap-6">
        <AuthArt src="/login/envelope.png" size={212} />
        <AuthHeading title="Check your email">
          <div className="flex flex-col gap-2">
            <p>
              We sent an email to <span className="break-all text-fg">{email}</span>
            </p>
            <p>If you don’t get the email soon, check your spam folder.</p>
            <p>
              Still need help?{" "}
              <button type="button" onClick={() => toast("Support chat opens here. It isn’t part of the prototype.")} className={textLinkCls}>
                Contact Support
              </button>
            </p>
          </div>
        </AuthHeading>
        <div className="flex flex-col items-start gap-2 border-t border-line pt-6">
          <PrototypeHint>Prototype: there’s no real email. Open the link from here.</PrototypeHint>
          <ForenButton variant="secondary" size="sm" onClick={() => router.push("/login/reset")}>
            Open the reset link
          </ForenButton>
        </div>
      </div>
    </AuthFrame>
  );
}
