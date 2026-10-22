"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RiCheckLine, RiCloseLine, RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { DIAL_CODE } from "@/domain/onboarding";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Field, FormCard, OnboardingFrame, fieldCls } from "./frame";
import { useSignupGuard } from "./guard";
import { EMAIL_RE } from "./welcome-requirements";

const CRITERIA: [string, (p: string) => boolean][] = [
  ["Minimum 8 characters", (p) => p.length >= 8],
  ["Uppercase", (p) => /[A-Z]/.test(p)],
  ["Lowercase", (p) => /[a-z]/.test(p)],
  ["Number", (p) => /\d/.test(p)],
  ["Special character", (p) => /[^A-Za-z0-9]/.test(p)],
];

const STRENGTH = ["Weak", "Weak", "Weak", "Fair", "Good", "Strong"];

export function CreateAccount() {
  const router = useRouter();
  const ok = useSignupGuard("/onboarding/account");
  const set = useOnboarding((s) => s.set);
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
  const [show, setShow] = React.useState(false);
  const [emailTouched, setEmailTouched] = React.useState(false);
  const pwRef = React.useRef<HTMLInputElement>(null);

  if (!ok) return null;

  const met = CRITERIA.map(([, test]) => test(password));
  const score = met.filter(Boolean).length; // 0–5
  const segments = password ? Math.max(1, score - 1) : 0;
  const strong = met.every(Boolean);
  const emailOk = EMAIL_RE.test(email.trim());
  const emailError = emailTouched && email && !emailOk ? "Enter a valid email, like name@company.com" : undefined;
  const digits = phone.replace(/\D/g, "");
  const phoneOk = digits.length >= 7 && digits.length <= 12;
  const phoneError = phoneTouched && phone && !phoneOk ? "Enter a valid phone number" : undefined;
  const valid = emailOk && firstName.trim() && lastName.trim() && position.trim() && phoneOk && strong;

  const submit = () => {
    set({
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
            <div className="relative">
              <input
                ref={pwRef}
                id="ob-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                aria-describedby="ob-password-rules"
                onChange={(e) => setPassword(e.target.value)}
                className={cn(fieldCls, "pr-20", !show && password && "text-[20px] tracking-[0.15em]")}
              />
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShow((x) => !x)}
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                  className="grid size-8 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {show ? <RiEyeLine className="size-[18px]" aria-hidden /> : <RiEyeOffLine className="size-[18px]" aria-hidden />}
                </button>
                {password && (
                  <button
                    type="button"
                    onClick={() => {
                      setPassword("");
                      pwRef.current?.focus();
                    }}
                    aria-label="Clear password"
                    className="grid size-8 place-items-center rounded-full text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <RiCloseLine className="size-5" aria-hidden />
                  </button>
                )}
              </div>
            </div>
            {password && (
              <div className="flex items-center gap-1 px-1" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-[4px] transition-colors",
                      i < segments ? (strong ? "bg-[#4c9a4e]" : score >= 3 ? "bg-warning" : "bg-error") : "bg-line"
                    )}
                  />
                ))}
                <span className="w-14 text-right text-[12px] leading-[18px] font-medium text-fg-2">{STRENGTH[score]}</span>
              </div>
            )}
            <ul id="ob-password-rules" className="flex flex-wrap gap-2" aria-label="Password rules">
              {CRITERIA.map(([label], i) => (
                <li
                  key={label}
                  className="inline-flex h-5 items-center gap-1.5 rounded-full bg-[var(--color-foren-bg-button-secondary)] pr-2 pl-1.5 text-[12px] leading-[18px] font-medium text-fg-2"
                >
                  {met[i] ? <RiCheckLine className="size-3 text-success" aria-hidden /> : <span className="size-3" aria-hidden />}
                  {label}
                  <span className="sr-only">{met[i] ? " (met)" : " (not met)"}</span>
                </li>
              ))}
            </ul>
            <p className="sr-only" aria-live="polite">
              {password ? `Password strength: ${STRENGTH[score]}` : ""}
            </p>
          </Field>
        </FormCard>
      </form>
    </OnboardingFrame>
  );
}
