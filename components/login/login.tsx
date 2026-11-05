"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountryFlag } from "@/components/country-flag";
import { Field, FormCard, fieldCls } from "@/components/onboarding/frame";
import { PasswordInput } from "@/components/onboarding/password";
import { EMAIL_RE } from "@/components/onboarding/welcome-requirements";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import { ForenSelect, type ForenSelectOption } from "@/components/ui/foren-select";
import { ForenSpinner } from "@/components/ui/foren-spinner";
import { DEMO_PASSWORD, credentialsOk, useLogin, type LoginMethod } from "@/lib/login-store";
import { cn } from "@/lib/utils";
import { AuthAlert, AuthFrame, AuthHeading, PrototypeHint, textLinkCls } from "./auth-frame";

/** Countries Foren onboards, with their dialling codes (UK first, as in Figma). */
const DIAL: { value: string; flag: string; name: string; code: string }[] = [
  { value: "GB", flag: "GB", name: "United Kingdom", code: "+44" },
  { value: "NG", flag: "NG", name: "Nigeria", code: "+234" },
  { value: "KE", flag: "KE", name: "Kenya", code: "+254" },
  { value: "CA", flag: "CA", name: "Canada", code: "+1" },
  { value: "US", flag: "United States", name: "United States", code: "+1" },
];

const DIAL_OPTIONS: ForenSelectOption[] = DIAL.map((d) => ({
  value: d.value,
  label: `${d.name} ${d.code}`,
  display: <span className="font-semibold">{d.code}</span>,
  leading: <CountryFlag country={d.flag} />,
}));

type Errors = { id?: string; password?: string };

export function Login() {
  const router = useRouter();
  const saved = useLogin();
  const [method, setMethod] = React.useState<LoginMethod>(saved.method);
  const [email, setEmail] = React.useState(saved.method === "email" ? saved.identifier : "");
  const [country, setCountry] = React.useState("GB");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(saved.remember);
  const [errors, setErrors] = React.useState<Errors>({});
  const [failed, setFailed] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const idRef = React.useRef<HTMLInputElement>(null);
  const pwRef = React.useRef<HTMLInputElement>(null);

  const dial = DIAL.find((d) => d.value === country)!;

  const validate = (): Errors => {
    const next: Errors = {};
    if (method === "email") {
      if (!email.trim()) next.id = "Enter your email";
      else if (!EMAIL_RE.test(email.trim())) next.id = "Invalid email";
    } else {
      const digits = phone.replace(/\D/g, "");
      if (!digits) next.id = "Enter your phone number";
      else if (digits.length < 7 || digits.length > 12) next.id = "Invalid phone number";
    }
    if (!password) next.password = "Enter your password";
    return next;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (next.id) return idRef.current?.focus();
    if (next.password) return pwRef.current?.focus();

    setChecking(true);
    setFailed(false);
    setTimeout(() => {
      setChecking(false);
      if (!credentialsOk(password)) {
        setFailed(true);
        pwRef.current?.focus();
        pwRef.current?.select();
        return;
      }
      const identifier = method === "email" ? email.trim() : `${dial.code} ${phone.trim().replace(/^0/, "")}`;
      saved.set({ method, identifier, remember });
      router.push("/login/verify");
    }, 900);
  };

  // Editing either field clears its error and the "incorrect" toast, which re-enables Login.
  const edit = (field: keyof Errors) => {
    setFailed(false);
    if (errors[field]) setErrors((x) => ({ ...x, [field]: undefined }));
  };

  return (
    <AuthFrame
      alert={failed && <AuthAlert title="Incorrect email or password" description="Enter a correct email and password to login" onDismiss={() => setFailed(false)} />}
    >
      <AuthHeading title="Welcome back">
        <p className="flex flex-wrap gap-2">
          <span>New to Foren?</span>
          <Link href="/onboarding" className={textLinkCls}>
            Create account
          </Link>
        </p>
      </AuthHeading>

      <div className="mt-[45px] flex flex-col gap-5">
        <ForenSegmentedControl
          fullWidth
          ariaLabel="Log in with"
          value={method}
          onChange={(m) => {
            setMethod(m);
            setErrors({});
            setFailed(false);
          }}
          options={[
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone number" },
          ]}
        />

        <form noValidate onSubmit={submit}>
          <FormCard className="gap-10">
            <div className="flex flex-col gap-6">
              {method === "email" ? (
                <Field label="Email" htmlFor="login-email" error={errors.id}>
                  <input
                    ref={idRef}
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    value={email}
                    aria-invalid={!!errors.id || undefined}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      edit("id");
                    }}
                    className={fieldCls}
                  />
                </Field>
              ) : (
                <Field label="Phone number" htmlFor="login-phone" error={errors.id}>
                  <div className="flex gap-2">
                    <ForenSelect
                      aria-label="Country code"
                      value={country}
                      onChange={setCountry}
                      options={DIAL_OPTIONS}
                      className="w-[118px] shrink-0"
                      menuClassName="w-[264px]"
                    />
                    <input
                      ref={idRef}
                      id="login-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={phone}
                      aria-invalid={!!errors.id || undefined}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/[^\d\s]/g, ""));
                        edit("id");
                      }}
                      className={cn(fieldCls, "min-w-0 flex-1")}
                    />
                  </div>
                </Field>
              )}

              <Field label="Password" htmlFor="login-password" error={errors.password}>
                <PasswordInput
                  ref={pwRef}
                  id="login-password"
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={!!errors.password || undefined}
                  onValueChange={(v) => {
                    setPassword(v);
                    edit("password");
                  }}
                />
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <ForenCheckbox size="sm" checked={remember} onCheckedChange={(c) => setRemember(c === true)} label={<span className="text-[12px] leading-[18px] text-fg">Remember me</span>} />
                <Link
                  href="/login/forgot"
                  onClick={() => method === "email" && EMAIL_RE.test(email.trim()) && saved.set({ resetEmail: email.trim() })}
                  className={textLinkCls}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <ForenButton
              type="submit"
              className="w-full"
              disabled={failed || checking}
              aria-busy={checking || undefined}
              leadingIcon={checking ? <ForenSpinner size="sm" className="text-current" /> : undefined}
            >
              {checking ? "Logging in…" : "Login"}
            </ForenButton>
          </FormCard>
        </form>

        <PrototypeHint className="text-center">
          Prototype: any email or phone number logs in with the password <span className="font-semibold text-fg-2 select-all">{DEMO_PASSWORD}</span>. Any other password shows the error.
        </PrototypeHint>
      </div>
    </AuthFrame>
  );
}
