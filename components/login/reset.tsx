"use client";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormCard, Field } from "@/components/onboarding/frame";
import { PasswordInput, PasswordStrength, isStrongPassword } from "@/components/onboarding/password";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenSpinner } from "@/components/ui/foren-spinner";
import { asset } from "@/lib/base-path";
import { AuthFrame, AuthHeading } from "./auth-frame";

/** Create password from the reset link (Figma 8751:110950): same rules as Create account, plus a confirm field. */
export function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<{ password?: string; confirm?: string }>({});
  const [saving, setSaving] = React.useState(false);
  const pwRef = React.useRef<HTMLInputElement>(null);
  const confirmRef = React.useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!password) next.password = "Enter a new password";
    else if (!isStrongPassword(password)) next.password = "Your password needs to meet every rule above";
    if (!confirm) next.confirm = "Enter your new password again";
    else if (confirm !== password) next.confirm = "Passwords don’t match";
    setErrors(next);
    if (next.password) return pwRef.current?.focus();
    if (next.confirm) return confirmRef.current?.focus();

    setSaving(true);
    setTimeout(() => router.push("/login/reset/done"), 900);
  };

  return (
    <AuthFrame>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2.5">
          <AuthHeading title="Create password" />
          <p className="text-[16px] leading-6 font-medium tracking-[0.005em] text-fg-2">Please create a strong password</p>
        </div>
        <form noValidate onSubmit={submit}>
          <FormCard>
            <Field label="Password" htmlFor="reset-password" error={errors.password}>
              <PasswordInput
                ref={pwRef}
                id="reset-password"
                autoComplete="new-password"
                autoFocus
                value={password}
                aria-invalid={!!errors.password || undefined}
                aria-describedby="reset-password-rules"
                onValueChange={(v) => {
                  setPassword(v);
                  setErrors((x) => ({ ...x, password: undefined }));
                }}
              />
              <PasswordStrength password={password} id="reset-password-rules" />
            </Field>
            <Field label="Confirm password" htmlFor="reset-confirm" error={errors.confirm}>
              <PasswordInput
                ref={confirmRef}
                id="reset-confirm"
                autoComplete="new-password"
                value={confirm}
                aria-invalid={!!errors.confirm || undefined}
                onValueChange={(v) => {
                  setConfirm(v);
                  setErrors((x) => ({ ...x, confirm: undefined }));
                }}
              />
            </Field>
            <div className="flex flex-col gap-4">
              <ForenButton
                type="submit"
                className="w-full"
                disabled={saving}
                aria-busy={saving || undefined}
                leadingIcon={saving ? <ForenSpinner size="sm" className="text-current" /> : undefined}
              >
                Create password
              </ForenButton>
              <ForenButton type="button" variant="ghost" className="w-full" onClick={() => router.push("/login")}>
                Return to login
              </ForenButton>
            </div>
          </FormCard>
        </form>
      </div>
    </AuthFrame>
  );
}

/** You’ve updated your password successfully (Figma 8751:111035). */
export function ResetDone() {
  const router = useRouter();
  return (
    <AuthFrame className="lg:pt-[161px]">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex w-full flex-col items-center">
          {/* Figma crops the tick render to 110% inside a 250px frame. */}
          <div className="relative size-[250px] overflow-hidden">
            <Image src={asset("/login/check.png")} alt="" fill sizes="275px" className="!-top-[5%] !-left-[5%] !h-[110%] !w-[110%] max-w-none" />
          </div>
          <div className="flex flex-col gap-2 px-4 pt-6 pb-2">
            <h1 className="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] text-fg [font-synthesis:none]">You’ve updated your password successfully</h1>
            <p className="text-[16px] leading-6 font-medium tracking-[0.005em] text-fg-2">You can now use it to log in to your account.</p>
          </div>
        </div>
        <ForenButton autoFocus onClick={() => router.push("/login")}>
          Continue to login
        </ForenButton>
      </div>
    </AuthFrame>
  );
}
