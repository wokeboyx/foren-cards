"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { DIAL_CODE } from "@/domain/onboarding";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Field, FormCard, OnboardingFrame, fieldCls } from "./frame";
import { useSignupGuard } from "./guard";
import { PasswordInput, PasswordStrength, isStrongPassword } from "./password";
import { EMAIL_RE } from "./welcome-requirements";

export function CreateAccount() {
  const router = useRouter();
  const ok = useSignupGuard("/onboarding/account");
  const startAccount = useOnboarding((s) => s.startAccount);
  const [email, setEmail] = React.useState(() => useOnboarding.getState().email);
  const [firstName, setFirst] = React.useState(() => useOnboarding.getState().firstName);
  const [lastName, setLast] = React.useState(() => useOnboarding.getState().lastName);
  const country = useOnboarding((s) => s.country);
  const dial = country ? DIAL_CODE[country] : "+";
  const [position, setPosition] = React.useState(() => useOnboarding.getState().position);
  // Stored with the dialling code ("+234 803 555 0142"); edited without it.
  const [phone, setPhone] = React.useState(() => useOnboarding.getState().phone.replace(/^\+\d+\s*/, ""));
  const [phoneTouched, setPhoneTouched] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [emailTouched, setEmailTouched] = React.useState(false);

  if (!ok) return null;

  const strong = isStrongPassword(password);
  const emailOk = EMAIL_RE.test(email.trim());
  const emailError = emailTouched && email && !emailOk ? "Enter a valid email, like name@company.com" : undefined;
  const digits = phone.replace(/\D/g, "");
  const phoneOk = digits.length >= 7 && digits.length <= 12;
  const phoneError = phoneTouched && phone && !phoneOk ? "Enter a valid phone number" : undefined;
  const valid = emailOk && firstName.trim() && lastName.trim() && position.trim() && phoneOk && strong;

  const submit = () => {
    // A new account starts clean, so an earlier sign-up's review or documents can't carry over.
    startAccount({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      position: position.trim(),
      phone: `${dial} ${phone.trim().replace(/^0/, "")}`,
      emailVerified: false,
    });
    router.push("/onboarding/verify-email");
  };

  return (
    <OnboardingFrame
      step="account"
      back="/onboarding/use"
      title="Create your account"
      description="This is what you’ll use to log in and manage your business account."
      footer={{ primary: { label: "Continue", disabled: !valid, onClick: submit } }}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) submit();
        }}
      >
        <FormCard>
          <Field label="Email" htmlFor="ob-email" error={emailError}>
            <input
              id="ob-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Enter a valid email address"
              value={email}
              aria-invalid={!!emailError || undefined}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              className={fieldCls}
            />
          </Field>
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-4">
            <Field label="First name" htmlFor="ob-first">
              <input id="ob-first" autoComplete="given-name" value={firstName} onChange={(e) => setFirst(e.target.value)} className={fieldCls} />
            </Field>
            <Field label="Last name" htmlFor="ob-last">
              <input id="ob-last" autoComplete="family-name" value={lastName} onChange={(e) => setLast(e.target.value)} className={fieldCls} />
            </Field>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-4">
            <Field label="Job title" htmlFor="ob-position" hint="You’re the authorised representative on the declaration.">
              <input id="ob-position" autoComplete="organization-title" placeholder="e.g. Finance Director" value={position} onChange={(e) => setPosition(e.target.value)} className={fieldCls} />
            </Field>
            <Field label="Phone number" htmlFor="ob-phone" error={phoneError}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[14px] font-medium text-fg-2">{dial}</span>
                <input
                  id="ob-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={phone}
                  aria-invalid={!!phoneError || undefined}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                  onBlur={() => setPhoneTouched(true)}
                  className={cn(fieldCls, "pl-14")}
                />
              </div>
            </Field>
          </div>
          <Field label="Password" htmlFor="ob-password">
            <PasswordInput id="ob-password" autoComplete="new-password" clearable value={password} onValueChange={setPassword} aria-describedby="ob-password-rules" />
            <PasswordStrength password={password} id="ob-password-rules" />
          </Field>
        </FormCard>
      </form>
    </OnboardingFrame>
  );
}
