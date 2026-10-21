"use client";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RiAsterisk, RiCameraLine, RiErrorWarningLine, RiShieldCheckLine, RiUserSmileLine } from "@remixicon/react";
import { Modal } from "@/components/overlay";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenSpinner } from "@/components/ui/foren-spinner";
import { acceptedIds, countryInfo, type CountryCode } from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { OnboardingFrame } from "./frame";
import { useSignupGuard } from "./guard";

function idTypes(country: CountryCode | null) {
  return country === "NG" ? ["International passport", "Driver’s licence"] : ["Passport", "National ID card", "Driving licence"];
}

export function VerifyIdentity() {
  const ok = useSignupGuard("/onboarding/identity");
  const country = useOnboarding((s) => s.country);
  const [open, setOpen] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [run, setRun] = React.useState(0);
  if (!ok) return null;

  return (
    <OnboardingFrame
      step="identity"
      back="/onboarding/account"
      title="Verify your identity"
      description={`Have a valid ID ready (${country ? acceptedIds(country) : "Passport or driving licence"}), then do a quick face check. About 2 mins.`}
    >
      <div className="flex flex-col gap-10">
        <div className="relative aspect-[310/156] w-full max-w-[310px] overflow-hidden rounded-[16px] bg-subtle sm:max-w-[310px]">
          <Image src={asset("/onboarding/verify-identity.jpg")} alt="" fill sizes="310px" className="object-cover" priority />
        </div>

        {failed && (
          <div role="alert" className="flex items-start gap-2 rounded-[16px] bg-error-subtle px-3 py-3 text-[13px] leading-[18px] font-medium text-error">
            <RiErrorWarningLine className="mt-px size-4 shrink-0" aria-hidden />
            We couldn’t read your ID. Make sure all 4 edges are visible and the photo is sharp.
          </div>
        )}

        <ul className="flex flex-col gap-4">
          {["You’ll be taken to our verification partner to finish this step.", "Your face scan is encrypted and only used to confirm it’s you."].map((t) => (
            <li key={t} className="flex items-start gap-2 text-[12px] leading-[18px] font-medium text-fg">
              <RiAsterisk className="mt-px size-3.5 shrink-0 text-success" aria-hidden />
              {t}
            </li>
          ))}
        </ul>

        <ForenButton
          size="xs"
          className="w-fit px-6"
          onClick={() => {
            setRun((r) => r + 1);
            setFailed(false);
            setOpen(true);
          }}
        >
          {failed ? "Try again" : "Start verification"}
        </ForenButton>
      </div>

      {/* Remounted per attempt so every run starts at the first step. */}
      <PartnerFlow
        key={run}
        open={open}
        onOpenChange={setOpen}
        country={country}
        onFailed={() => {
          setOpen(false);
          setFailed(true);
        }}
      />
    </OnboardingFrame>
  );
}

type PartnerStep = "consent" | "document" | "photo" | "selfie" | "checking";

/** A stand-in for the verification partner's hosted flow (the real one opens in their SDK). */
function PartnerFlow({
  open,
  onOpenChange,
  country,
  onFailed,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  country: CountryCode | null;
  onFailed: () => void;
}) {
  const router = useRouter();
  const set = useOnboarding((s) => s.set);
  const outcome = useOnboarding((s) => s.demo.identity);
  const [step, setStep] = React.useState<PartnerStep>("consent");
  const [residence, setResidence] = React.useState<"home" | "other">("home");
  const [consent, setConsent] = React.useState(false);
  const [idType, setIdType] = React.useState<string | null>(null);
  const [captured, setCaptured] = React.useState(false);
  const name = countryInfo(country)?.name ?? "your country";

  React.useEffect(() => {
    if (step !== "checking") return;
    const t = setTimeout(() => {
      if (outcome === "retry") return onFailed();
      set({ identityVerified: true });
      onOpenChange(false);
      router.push("/onboarding/identity/confirmed");
    }, 1800);
    return () => clearTimeout(t);
  }, [step, outcome, onFailed, onOpenChange, router, set]);

  const titles: Record<PartnerStep, string> = {
    consent: "Confirm your country of residence",
    document: "Choose your ID",
    photo: "Take a photo of your ID",
    selfie: "Take a selfie",
    checking: "Checking your details",
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={titles[step]} className="sm:max-w-[400px]">
      <div className="flex min-h-[340px] flex-col gap-5">
        {step === "consent" && (
          <>
            <p className="text-[14px] leading-[21px] text-fg-2">This decides how your personal data is processed.</p>
            <div role="radiogroup" aria-label="Country of residence" className="flex flex-col gap-2">
              {(["home", "other"] as const).map((v) => (
                <label key={v} className={cn("flex h-12 cursor-pointer items-center justify-between rounded-[12px] border px-3 text-[14px] font-medium text-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus", residence === v ? "border-fg" : "border-line bg-subtle")}>
                  {v === "home" ? name : "Somewhere else"}
                  <input type="radio" name="residence" checked={residence === v} onChange={() => setResidence(v)} className="size-4 accent-[var(--color-foren-bg-button-primary)]" />
                </label>
              ))}
            </div>
            <div className="mt-auto border-t border-line pt-4">
              <ForenCheckbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                label="I agree to my personal data, including a face scan, being processed to verify my identity."
              />
            </div>
            <ForenButton size="sm" disabled={!consent} onClick={() => setStep("document")}>
              Continue
            </ForenButton>
          </>
        )}

        {step === "document" && (
          <>
            <p className="text-[14px] leading-[21px] text-fg-2">Use an original, in-date document. No photocopies or screenshots.</p>
            <div role="radiogroup" aria-label="ID type" className="flex flex-col gap-2">
              {idTypes(country).map((t) => (
                <label key={t} className={cn("flex h-12 cursor-pointer items-center justify-between rounded-[12px] border px-3 text-[14px] font-medium text-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus", idType === t ? "border-fg" : "border-line bg-subtle")}>
                  {t}
                  <input type="radio" name="idtype" checked={idType === t} onChange={() => setIdType(t)} className="size-4 accent-[var(--color-foren-bg-button-primary)]" />
                </label>
              ))}
            </div>
            <ForenButton size="sm" className="mt-auto" disabled={!idType} onClick={() => setStep("photo")}>
              Continue
            </ForenButton>
          </>
        )}

        {step === "photo" && (
          <>
            <p className="text-[14px] leading-[21px] text-fg-2">Place your {idType?.toLowerCase()} in the frame with all 4 edges showing.</p>
            <div className={cn("grid aspect-[1.6] place-items-center rounded-[16px] border-2 border-dashed text-fg-3", captured ? "border-success bg-success-subtle text-success" : "border-line-2 bg-subtle")}>
              {captured ? <RiShieldCheckLine className="size-10" aria-label="Photo taken" /> : <RiCameraLine className="size-10" aria-hidden />}
            </div>
            {captured ? (
              <div className="mt-auto flex gap-2">
                <ForenButton variant="outline" size="sm" className="flex-1" onClick={() => setCaptured(false)}>
                  Retake
                </ForenButton>
                <ForenButton size="sm" className="flex-1" onClick={() => setStep("selfie")}>
                  Use this photo
                </ForenButton>
              </div>
            ) : (
              <ForenButton size="sm" className="mt-auto" onClick={() => setCaptured(true)}>
                Take photo
              </ForenButton>
            )}
          </>
        )}

        {step === "selfie" && (
          <>
            <p className="text-[14px] leading-[21px] text-fg-2">Look straight at the camera and slowly turn your head when asked. Good light helps.</p>
            <div className="mx-auto grid size-40 place-items-center rounded-full border-2 border-dashed border-line-2 bg-subtle text-fg-3">
              <RiUserSmileLine className="size-12" aria-hidden />
            </div>
            <ForenButton size="sm" className="mt-auto" onClick={() => setStep("checking")}>
              Start face check
            </ForenButton>
          </>
        )}

        {step === "checking" && (
          <div role="status" aria-live="polite" className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ForenSpinner size="lg" />
            <p className="text-[14px] leading-[21px] text-fg-2">This usually takes a few seconds.</p>
          </div>
        )}

        <p className="text-center text-[11px] leading-4 font-medium text-fg-3">Powered by our verification partner</p>
      </div>
    </Modal>
  );
}

export function IdentityConfirmed() {
  const router = useRouter();
  const ok = useSignupGuard("/onboarding/identity/confirmed");
  if (!ok) return null;
  return (
    <OnboardingFrame step="identity" bare completed>
      <div className="flex flex-col items-center gap-6 pt-[120px] text-center lg:pt-[140px]">
        <Image src={asset("/onboarding/check.png")} alt="" width={96} height={96} priority />
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none] lg:text-[28px] lg:leading-[36px]">Identity confirmed</h1>
          <p className="max-w-[300px] text-[14px] leading-[21px] font-medium text-fg-2">Your verification is complete. Next, add your official business details.</p>
        </div>
        <ForenButton size="xs" className="px-5" onClick={() => router.push("/onboarding/business")}>
          Continue to business details
        </ForenButton>
      </div>
    </OnboardingFrame>
  );
}
