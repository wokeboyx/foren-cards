"use client";
import * as React from "react";
import { CheckBoldIcon, EyeClosedIcon, EyeIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { fieldCls } from "./frame";

/**
 * Password pieces shared by Create account (sign-up) and Create password (reset):
 * the DS input with a show/hide toggle (and optional clear), and the strength meter + rule chips.
 */

export const PASSWORD_RULES: [string, (p: string) => boolean][] = [
  ["Minimum 8 characters", (p) => p.length >= 8],
  ["Uppercase", (p) => /[A-Z]/.test(p)],
  ["Lowercase", (p) => /[a-z]/.test(p)],
  ["Number", (p) => /\d/.test(p)],
  ["Special character", (p) => /[^A-Za-z0-9]/.test(p)],
];

const STRENGTH = ["Weak", "Weak", "Weak", "Fair", "Good", "Strong"];

export const isStrongPassword = (p: string) => PASSWORD_RULES.every(([, test]) => test(p));

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: string;
  onValueChange: (next: string) => void;
  /** Show the × button that empties the field (sign-up). */
  clearable?: boolean;
};

/** DS Input with the password eye (Figma "Trailing Icon"): dots while hidden, plain text when shown. */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { value, onValueChange, clearable, className, ...props },
  ref
) {
  const [show, setShow] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(fieldCls, clearable ? "pr-20" : "pr-12", !show && value && "text-[20px] tracking-[0.15em]", className)}
        {...props}
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        <button
          type="button"
          onClick={() => setShow((x) => !x)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="grid size-8 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
        >
          {show ? <EyeIcon className="size-[18px]" aria-hidden /> : <EyeClosedIcon className="size-[18px]" aria-hidden />}
        </button>
        {clearable && value && (
          <button
            type="button"
            onClick={() => {
              onValueChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear password"
            className="grid size-8 place-items-center rounded-full text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
          >
            <XIcon className="size-5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
});

/** Strength meter (4 bars + label) and the five rule chips. Point the input's aria-describedby at `id`. */
export function PasswordStrength({ password, id }: { password: string; id: string }) {
  const met = PASSWORD_RULES.map(([, test]) => test(password));
  const score = met.filter(Boolean).length; // 0–5
  const segments = password ? Math.max(1, score - 1) : 0;
  const strong = met.every(Boolean);

  return (
    <>
      {password && (
        <div className="flex items-center gap-1 px-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn("h-1 flex-1 rounded-[4px] transition-colors", i < segments ? (strong ? "bg-[#4c9a4e]" : score >= 3 ? "bg-warning" : "bg-error") : "bg-line")}
            />
          ))}
          <span className="w-14 text-right text-[12px] leading-[18px] font-medium text-fg-2">{STRENGTH[score]}</span>
        </div>
      )}
      <ul id={id} className="flex flex-wrap gap-2" aria-label="Password rules">
        {PASSWORD_RULES.map(([label], i) => (
          <li
            key={label}
            className={cn(
              "inline-flex h-5 items-center gap-1.5 rounded-full bg-[var(--color-foren-bg-button-secondary)] pr-2 text-[12px] leading-[18px] font-medium text-fg-2",
              password ? "pl-1.5" : "pl-2"
            )}
          >
            {/* Figma: no icon until they type, then a tick or a red cross per rule. */}
            {password && (met[i] ? <CheckBoldIcon className="size-3 text-fg-2" aria-hidden /> : <XIcon className="size-3 text-error" aria-hidden />)}
            {label}
            <span className="sr-only">{met[i] ? " (met)" : " (not met)"}</span>
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {password ? `Password strength: ${STRENGTH[score]}` : ""}
      </p>
    </>
  );
}
