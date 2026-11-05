"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ACCEPT, MAX_KB, fmtSize } from "@/components/get-started/documents";
import { ForenFileItem } from "@/components/ui/foren-file-item";
import { ForenFileUpload } from "@/components/ui/foren-file-upload";
import { useOnboarding } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { FormCard, OnboardingFrame } from "./frame";
import { useSignupGuard } from "./guard";
import { Note } from "./shared";

const ACCEPTED = [
  "Utility bill (electricity, water, gas, internet or landline)",
  "Bank statement from a regulated bank",
  "Tax bill or letter from a government agency",
];

/**
 * Sole proprietors only, straight after the ID check: their own proof of address.
 * Compliance asks every stakeholder for one, and a sole trader has no stakeholder step to collect it later.
 * Same upload rules as the in-app documents screen (PDF, JPG or PNG, up to 10 MB).
 */
export function OwnerAddress() {
  const ok = useSignupGuard("/onboarding/identity/address");
  const router = useRouter();
  const doc = useOnboarding((s) => s.ownerAddress);
  const set = useOnboarding((s) => s.set);
  const [uploading, setUploading] = React.useState<{ name: string; kb: number; progress: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tried, setTried] = React.useState(false);
  if (!ok) return null;

  const onFiles = (files: FileList) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    const kb = f.size / 1024;
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return setError("Use a PDF, JPG or PNG file.");
    if (kb > MAX_KB) return setError(`That file is ${fmtSize(kb)}. The limit is 10 MB.`);
    // Prototype: fake a short upload so the progress state is visible.
    setUploading({ name: f.name, kb, progress: 10 });
    let p = 10;
    const t = window.setInterval(() => {
      p += 30;
      if (p >= 100) {
        window.clearInterval(t);
        setUploading(null);
        set({ ownerAddress: { fileName: f.name, sizeKb: Math.round(kb), status: "uploaded" } });
      } else setUploading((u) => (u ? { ...u, progress: p } : u));
    }, 220);
  };

  const fieldError = error ?? (tried && !doc ? "Upload your proof of address" : undefined);

  return (
    <OnboardingFrame
      headerGap={40}
      step="identity"
      back="/onboarding/identity"
      title="Confirm your home address"
      description="As the owner of the business, we also need proof of where you live. It must show your name and your current address."
      footer={{
        cancel: false,
        primary: {
          label: "Continue",
          disabled: !!uploading,
          onClick: () => {
            setTried(true);
            if (doc) router.push("/onboarding/identity/confirmed");
          },
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <FormCard className="gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] leading-[24px] font-medium tracking-[0.015em] text-fg">Proof of address</h2>
            <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">Dated within the last 3 months, in your name. All 4 edges visible. Mobile phone bills aren’t accepted.</p>
          </div>

          {uploading ? (
            <ForenFileItem state="uploading" fileName={uploading.name} fileSize={`${fmtSize(uploading.kb)} · Uploading`} progress={uploading.progress} />
          ) : doc ? (
            <ForenFileItem state="ready" fileName={doc.fileName} fileSize={fmtSize(doc.sizeKb)} onRemove={() => set({ ownerAddress: null })} />
          ) : (
            <div className="flex flex-col gap-1">
              <ForenFileUpload
                variant="compact"
                accept={ACCEPT}
                placeholder="Choose file…"
                onFiles={onFiles}
                error={fieldError}
                aria-label="Upload proof of address"
                className={cn("[&>div:first-child]:bg-sunken [&>div:first-child]:pl-3", !fieldError && "[&>div:first-child]:border-transparent")}
              />
              {!fieldError && <p className="px-3 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">Max 10MB per file. Allowed: PDF, JPG, PNG</p>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-[12px] leading-[18px] font-semibold tracking-[0.01em] text-fg-3 uppercase">We accept</p>
            <ul className="flex flex-col gap-1.5">
              {ACCEPTED.map((a) => (
                <li key={a} className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </FormCard>
        <Note intent="info">This is your personal address. Your business address is checked separately, from the documents you upload after sign-up.</Note>
      </div>
    </OnboardingFrame>
  );
}
