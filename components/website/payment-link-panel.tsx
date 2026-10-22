"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RiImageAddLine, RiLockLine, RiShoppingBag3Line } from "@remixicon/react";
import { asset } from "@/lib/base-path";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { CURRENCIES, formatAmount } from "./data";
import { CurrencyPill, FieldLabel, Flag, GlassCard, Intro, Panel, StepList, inputCls, ink, muted, primaryBtn, secondaryBtn } from "./shared";

const LINK_CURRENCIES = ["NGN", "USD", "GBP", "EUR", "CAD"];
/** Link types, worded as in the in-app flow ("How will this link be used"). */
const LINK_TYPES = [
  {
    id: "single",
    title: "Single-use link",
    description: "Valid for one transaction only; the link expires after use.",
  },
  {
    id: "reusable",
    title: "Reusable link",
    description: "For multiple transactions. Any number of customers can use it.",
  },
] as const;

type View = "details" | "preview";

/** Sample branding until the business adds its own. */
const SAMPLE_LOGO = asset("/foren-logo.svg");
const SAMPLE_COVER = asset("/website/foren-cover.webp");
const MAX_IMAGE_MB = 5;

/**
 * Try Payment Links before signing up. A short version of the in-app flow (Business Banking Figma 4504:121971):
 * the details, then the customer's checkout as on "Review payment link", then open an account to make it live.
 */
export function PaymentLinkPanel() {
  const router = useRouter();
  const set = useOnboarding((s) => s.set);
  const useCases = useOnboarding((s) => s.useCases);
  const [view, setView] = React.useState<View>("details");
  const [business, setBusiness] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("NGN");
  const [logo, setLogo] = React.useState<string | null>(null);
  const [cover, setCover] = React.useState<string | null>(null);
  const [linkType, setLinkType] = React.useState<(typeof LINK_TYPES)[number]["id"]>("single");
  const [tried, setTried] = React.useState(false);

  // Uploaded images stay in the browser as object URLs; free them when replaced.
  React.useEffect(() => () => void (logo && URL.revokeObjectURL(logo)), [logo]);
  React.useEffect(() => () => void (cover && URL.revokeObjectURL(cover)), [cover]);

  const value = Number(amount.replace(/,/g, "")) || 0;
  const missing = {
    business: !business.trim(),
    title: !title.trim(),
    amount: value <= 0,
  };
  const c = CURRENCIES[currency];

  /** Show the first missing field; true when everything is filled in. */
  const check = () => {
    setTried(true);
    const first = (Object.keys(missing) as (keyof typeof missing)[]).find((k) => missing[k]);
    if (!first) return true;
    setView("details");
    requestAnimationFrame(() => document.getElementById(`pl-${first}`)?.focus());
    return false;
  };
  const ready = !missing.business && !missing.title && !missing.amount;
  // Creating the link means opening an account: sign-up starts with Payment Links already picked.
  const create = () => {
    if (!check()) return;
    set({
      useCases: useCases.includes("payment_links") ? useCases : [...useCases, "payment_links"],
    });
    router.push("/onboarding");
  };

  return (
    <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
      <Intro title={<>Get paid with a link.</>} description="Share a link and get paid in minutes. No code, no website needed.">
        <StepList steps={["Add the payment details", "Preview your customer’s checkout", "Create your link"]} current={view === "preview" && ready ? 1 : 0} />
      </Intro>

      <GlassCard>
        <div role="tablist" aria-label="Payment link" className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-white/70 p-1">
          {(["details", "preview"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              id={`pl-tab-${v}`}
              aria-selected={view === v}
              aria-controls={`pl-panel-${v}`}
              onClick={() => setView(v)}
              className={cn(
                "h-10 rounded-full text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30",
                view === v ? "bg-white text-[#2f2d2b] shadow-[0_1px_3px_rgba(23,18,13,0.12)]" : "text-[#6b6661] hover:text-[#2f2d2b]",
              )}
            >
              {v === "details" ? "Details" : "Preview"}
            </button>
          ))}
        </div>

        {view === "details" ? (
          <div role="tabpanel" id="pl-panel-details" aria-labelledby="pl-tab-details">
            <Panel className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3">
                <ImagePick id="pl-logo" label="Logo" hint="Square, PNG or JPG" value={logo} onChange={setLogo} shape="logo" />
                <ImagePick id="pl-cover" label="Cover image" hint="Wide, PNG or JPG" value={cover} onChange={setCover} shape="cover" />
              </div>
              <Field
                id="pl-business"
                label="Company name"
                placeholder="Kola Logistics"
                value={business}
                onChange={setBusiness}
                error={tried && missing.business ? "Enter your company name" : undefined}
              />
              <Field
                id="pl-title"
                label="Payment title"
                placeholder="Consultation fee"
                value={title}
                onChange={setTitle}
                error={tried && missing.title ? "Enter what the payment is for" : undefined}
              />
              <div>
                <FieldLabel htmlFor="pl-amount">Amount</FieldLabel>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-[16px] border bg-white py-1.5 pr-1.5 pl-4 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#2f2d2b]/15",
                    tried && missing.amount ? "border-[#d92d20]" : "border-[#e6e4e2] has-[input:focus-visible]:border-[#2f2d2b]",
                  )}
                >
                  <span className={cn("text-[15px] font-medium", muted)}>{c.symbol}</span>
                  <input
                    id="pl-amount"
                    inputMode="decimal"
                    placeholder="50,000"
                    value={amount}
                    aria-invalid={tried && missing.amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
                    onBlur={() =>
                      value &&
                      setAmount(
                        value.toLocaleString("en-GB", {
                          maximumFractionDigits: 2,
                        }),
                      )
                    }
                    className={cn("h-9 min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#b5b0ab]", ink)}
                  />
                  <CurrencyPill label="Currency" value={currency} options={LINK_CURRENCIES} onChange={setCurrency} />
                </div>
                {tried && missing.amount && <Error>Enter an amount</Error>}
              </div>
              <fieldset>
                <legend className={cn("mb-2 text-[14px] font-medium", ink)}>How will this link be used?</legend>
                <div className="flex flex-col gap-2">
                  {LINK_TYPES.map((t) => (
                    <label
                      key={t.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-[16px] border bg-white p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/30",
                        linkType === t.id ? "border-[#2f2d2b]" : "border-[#e6e4e2] hover:border-[#b5b0ab]",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-[14px] font-semibold", ink)}>{t.title}</span>
                        <span className={cn("mt-0.5 block text-[13px] leading-[19px]", muted)}>{t.description}</span>
                      </span>
                      <input
                        type="radio"
                        name="pl-type"
                        value={t.id}
                        checked={linkType === t.id}
                        onChange={() => setLinkType(t.id)}
                        className="mt-0.5 size-4 shrink-0 accent-[#1e1711]"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            </Panel>
            <button type="button" onClick={create} className={cn(primaryBtn, "mt-4 w-full")}>
              Create link
            </button>
            <p className={cn("mt-3 text-center text-[13px]", muted)}>You’ll open a Foren account to start getting paid.</p>
          </div>
        ) : (
          <div role="tabpanel" id="pl-panel-preview" aria-labelledby="pl-tab-preview">
            {!ready ? (
              <Panel className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(23,18,13,0.08)]">
                  <RiShoppingBag3Line className="size-6 text-[#95908b]" aria-hidden />
                </span>
                <p className={cn("mt-5 text-[18px] font-semibold tracking-[-0.2px]", ink)}>Your checkout appears here</p>
                <p className={cn("mt-1.5 max-w-[300px] text-[14px] leading-[21px]", muted)}>Add your company name, a payment title and an amount to see what customers will see.</p>
                <button type="button" onClick={() => setView("details")} className={cn(secondaryBtn, "mt-6 h-10 px-5")}>
                  Add details
                </button>
              </Panel>
            ) : (
              <>
                {/* The customer's checkout, branded for the business. Nothing in it is clickable. */}
                <div
                  className="pointer-events-none overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_-20px_rgba(23,18,13,0.3)] select-none"
                  aria-label="Checkout preview"
                >
                  <div className="relative h-40 bg-[#17120d]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover ?? SAMPLE_COVER} alt="" className="size-full object-cover" />
                    <span className="absolute -bottom-6 left-5 grid size-14 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo ?? SAMPLE_LOGO} alt="" className={cn("size-full", logo ? "object-cover" : "object-contain p-3.5")} />
                    </span>
                  </div>
                  <div className="px-5 pt-9 pb-5 sm:px-6">
                    <p className={cn("text-[13px] font-medium", muted)}>{business.trim()}</p>
                    <p className={cn("mt-0.5 text-[18px] font-semibold tracking-[-0.2px]", ink)}>{title.trim()}</p>
                    <div className="mt-4 flex items-center justify-between rounded-[20px] bg-[#f6f5f2] px-4 py-3">
                      <div>
                        <p className={cn("text-[12px]", muted)}>Amount due</p>
                        <p className={cn("text-[28px] leading-[36px] font-semibold tracking-[-0.5px]", ink)}>
                          {c.symbol}
                          {formatAmount(value)}
                        </p>
                      </div>
                      <span className={cn("inline-flex h-8 items-center gap-1.5 rounded-full bg-white pr-3 pl-1.5 text-[13px] font-semibold", ink)}>
                        <Flag code={currency} size={20} /> {currency}
                      </span>
                    </div>
                    <div className="mt-4 flex h-11 items-center justify-center rounded-full bg-[#ebe9e5] text-[14px] font-semibold text-[#95908b]" aria-hidden>
                      Pay {c.symbol}
                      {formatAmount(value)}
                    </div>
                    <p className={cn("mt-3 flex items-center justify-center gap-1 text-[12px]", muted)}>
                      <RiLockLine className="size-3.5" aria-hidden /> Secured by Foren
                    </p>
                  </div>
                </div>

                <button type="button" onClick={create} className={cn(primaryBtn, "mt-4 w-full")}>
                  Create link
                </button>
                <p className={cn("mt-3 text-center text-[13px]", muted)}>You’ll open a Foren account to start getting paid.</p>
              </>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input id={id} placeholder={placeholder} value={value} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      {error && <Error>{error}</Error>}
    </div>
  );
}

function Error({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-[12px] font-medium text-[#d92d20]">
      {children}
    </p>
  );
}

/** Pick an image from this device. It never leaves the browser in the prototype. */
function ImagePick({
  id,
  label,
  hint,
  value,
  onChange,
  shape,
}: {
  id: string;
  label: string;
  hint: string;
  value: string | null;
  onChange: (v: string | null) => void;
  shape: "logo" | "cover";
}) {
  const [error, setError] = React.useState<string>();
  const pick = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file");
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return setError(`Use an image under ${MAX_IMAGE_MB} MB`);
    setError(undefined);
    onChange(URL.createObjectURL(file));
  };
  return (
    <div>
      <p className={cn("mb-2 text-[14px] font-medium", ink)}>{label}</p>
      <label
        htmlFor={id}
        className="flex h-16 cursor-pointer items-center gap-3 rounded-[16px] border border-dashed border-[#d8d6d5] bg-white px-3 transition-colors hover:border-[#2f2d2b] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/30"
      >
        <span className={cn("grid shrink-0 place-items-center overflow-hidden bg-[#f6f5f2]", shape === "logo" ? "size-10 rounded-full" : "h-10 w-14 rounded-[8px]")}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <RiImageAddLine className="size-5 text-[#95908b]" aria-hidden />
          )}
        </span>
        <span className="min-w-0">
          <span className={cn("block truncate text-[13px] font-semibold", ink)}>{value ? "Change" : "Upload"}</span>
          <span className={cn("block truncate text-[12px]", muted)}>{hint}</span>
        </span>
        <input id={id} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="mt-1 px-1 text-[12px] font-medium text-[#6b6661] underline underline-offset-2 hover:text-[#2f2d2b]">
          Remove
        </button>
      )}
      {error && <Error>{error}</Error>}
    </div>
  );
}
