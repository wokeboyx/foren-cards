"use client";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AsteriskBoldIcon, CameraIcon, IdentificationCardIcon, ShieldCheckIcon, WarningCircleIcon } from "@/components/icons";
import { Modal } from "@/components/overlay";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenInput } from "@/components/ui/foren-input";
import { ForenSpinner } from "@/components/ui/foren-spinner";
import { KRA_PIN_RE, acceptedIds, countryInfo, idTypes, needsOwnerAddress, type CountryCode } from "@/domain/onboarding";
import { asset } from "@/lib/base-path";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { OnboardingFrame } from "./frame";
import { useSignupGuard } from "./guard";


export function VerifyIdentity() {
  const ok = useSignupGuard("/onboarding/identity");
  const country = useOnboarding((s) => s.country);
  const ownerAddress = useOnboarding((s) => needsOwnerAddress(s.entity, s.category));
  const [open, setOpen] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [run, setRun] = React.useState(0);
  if (!ok) return null;

  return (
    <OnboardingFrame
      headerGap={64}
      step="identity"
      back="/onboarding/account"
      title="Verify your identity"
      description={`Prepare a valid government-issued ID (${country ? acceptedIds(country) : "Passport or national ID"}) and complete a facial liveness check.${ownerAddress ? " Then upload proof of your home address." : ""} ~2 mins`}
    >
      <div className="flex max-w-[496px] flex-col gap-10">
        <div className="flex flex-col gap-8">
        {/* Figma crops the illustration: 722×452 inside a 496×250 frame, offset right and down. */}
        <div className="relative aspect-[496/250] w-full overflow-hidden rounded-[20px] bg-sunken">
          <Image
            src={asset("/onboarding/verify-identity.jpg")}
            alt=""
            width={1024}
            height={640}
            sizes="(min-width: 640px) 722px, 146vw"
            className="absolute top-[-11.2%] left-[-16.33%] h-[180.8%] w-[145.56%] max-w-none object-cover"
            priority
          />
        </div>

        {failed && (
          <div role="alert" className="flex items-start gap-2 rounded-[16px] bg-error-subtle px-3 py-3 text-[13px] leading-[18px] font-medium text-error">
            <WarningCircleIcon className="mt-px size-4 shrink-0" aria-hidden />
            We couldn’t read your ID. Make sure all 4 edges are visible and the photo is sharp.
          </div>
        )}

        <ul className="flex flex-col gap-4">
          {["You’ll be redirected to our verification partner to complete this step.", "Your personal biometric data is encrypted and used strictly for identity authentication."].map((t) => (
            <li key={t} className="flex items-start gap-2 text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">
              <AsteriskBoldIcon className="mt-px size-[18px] shrink-0 text-[var(--color-foren-brand-green)]" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        </div>

        <ForenButton
          size="xs"
          className="w-fit min-w-[170px] px-6"
          onClick={() => {
            setRun((r) => r + 1);
            setFailed(false);
            setOpen(true);
          }}
        >
          {failed ? "Try again" : "Start Verification"}
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

type PartnerStep = "consent" | "document" | "photo" | "selfie" | "checking" | "kra";



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
  const [kraPin, setKraPin] = React.useState("");
  const [kraTried, setKraTried] = React.useState(false);
  const name = countryInfo(country)?.name ?? "your country";

  const finish = React.useCallback(
    (patch: Parameters<typeof set>[0]) => {
      set({ ...patch, identityVerified: true });
      onOpenChange(false);
      // Sole proprietors add their own proof of address next; everyone else goes straight to "Identity confirmed".
      router.push(needsOwnerAddress(useOnboarding.getState().entity, useOnboarding.getState().category) ? "/onboarding/identity/address" : "/onboarding/identity/confirmed");
    },
    [set, onOpenChange, router]
  );

  // Kenya: the KRA PIN isn't on Kenyan IDs, so we ask for it once the ID check passes.
  React.useEffect(() => {
    if (step !== "checking") return;
    const t = setTimeout(() => {
      if (outcome === "retry") return onFailed();
      if (country === "KE") return setStep("kra");
      finish({});
    }, 1800);
    return () => clearTimeout(t);
  }, [step, outcome, onFailed, country, finish]);

  const kraInvalid = !KRA_PIN_RE.test(kraPin.trim());

  const titles: Record<PartnerStep, string> = {
    consent: "Confirm your country of residence",
    document: "Choose your ID",
    photo: "Take a photo of your ID",
    selfie: "Take a selfie",
    checking: "Checking your details",
    kra: "Enter your KRA PIN",
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
              {captured ? <ShieldCheckIcon className="size-10" aria-label="Photo taken" /> : <CameraIcon className="size-10" aria-hidden />}
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
              <IdentificationCardIcon className="size-12" aria-hidden />
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

        {step === "kra" && (
          <form
            noValidate
            className="flex flex-1 flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              setKraTried(true);
              if (!kraInvalid) finish({ kraPin: kraPin.trim().toUpperCase() });
            }}
          >
            <p className="text-[14px] leading-[21px] text-fg-2">Your ID is verified. Now enter your KRA PIN as it appears on your PIN certificate.</p>
            <ForenInput
              label="KRA PIN"
              placeholder="A012345678Z"
              autoComplete="off"
              value={kraPin}
              onChange={(e) => setKraPin(e.target.value)}
              aria-invalid={kraTried && kraInvalid}
              error={kraTried && kraInvalid ? "Enter a KRA PIN like A012345678Z: a letter, 9 digits and a letter" : undefined}
            />
            <ForenButton type="submit" size="sm" className="mt-auto">
              Continue
            </ForenButton>
          </form>
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
    <OnboardingFrame step="identity" bare>
      <div className="flex flex-col items-center gap-6 pt-20 text-center lg:pt-16">
        {/* Figma "check 1": the artwork is drawn 120% in a 100px box, so its padding is cropped. */}
        <span className="relative size-[100px] shrink-0 overflow-hidden" aria-hidden>
          <Image src={asset("/onboarding/check.png")} alt="" width={120} height={120} priority className="absolute -top-[10px] -left-[10px] size-[120px] max-w-none" />
        </span>
        <div className="flex max-w-[392px] flex-col gap-2">
          <h1 className="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] text-black [font-synthesis:none]">Identity confirmed</h1>
          <p className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg-2">Your verification is complete. Proceed to enter your official business details.</p>
        </div>
        <ForenButton size="xs" onClick={() => router.push("/onboarding/business")}>
          Continue to business details
        </ForenButton>
      </div>
    </OnboardingFrame>
  );
}
