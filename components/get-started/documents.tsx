"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ChatsIcon, QuestionIcon, WarningFillIcon } from "@/components/icons";
import { toast } from "sonner";
import { Modal } from "@/components/overlay";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenFileItem } from "@/components/ui/foren-file-item";
import { ForenFileUpload } from "@/components/ui/foren-file-upload";
import { ForenInput } from "@/components/ui/foren-input";
import { ageLabel, uploadRequirements, type Requirement } from "@/domain/onboarding";
import { useOnboarding, useRequirementContext, type OnboardingDemo, type UploadedDoc } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Note, SetupColumn, SetupHeader } from "./shared";

export const MAX_KB = 10 * 1024;
export const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export const fmtSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`);

/** Sample numbers the upload check "finds" in the prototype, by the label a requirement reads. */
const SAMPLE_NUMBER: Record<string, string> = { "NEPZA number": "NEPZA/FTZ/2021/0147" };

/**
 * Prototype stand-in for the automatic check on each upload. It reads the document's date and flags it when
 * it's too old, and reads the number a requirement needs off it. The Demo panel picks what it finds.
 */
function checkUpload(req: Requirement, doc: UploadedDoc, demo: OnboardingDemo): UploadedDoc {
  if (req.maxAgeDays && demo.docDate === "expired") {
    const age = ageLabel(req.maxAgeDays);
    return { ...doc, status: "needs_attention", note: `This document is dated more than ${age} ago. Upload one from the last ${age}.` };
  }
  if (req.reads && demo.docNumber === "found") return { ...doc, number: SAMPLE_NUMBER[req.reads], numberSource: "document" };
  return doc;
}

/** Still needed: no upload, an upload that needs replacing, or a number we couldn't read and nobody entered. */
const incomplete = (r: Requirement, doc: UploadedDoc | undefined) => !doc || doc.status === "needs_attention" || (!!r.reads && !doc.number?.trim());

export function DocumentsPage() {
  const ctx = useRequirementContext();
  const s = useOnboarding();
  const router = useRouter();
  const [tried, setTried] = React.useState(false);

  if (!ctx || !s.signedUpAt)
    return (
      <SetupColumn size="md">
        <SetupHeader back="/get-started" title="Business document verification" description="Finish sign-up first." />
      </SetupColumn>
    );

  const reqs = uploadRequirements(ctx);
  const required = reqs.filter((r) => !r.optional);
  const missing = required.filter((r) => incomplete(r, s.documents[r.id]));
  const fresh = reqs.filter((r) => s.documents[r.id]?.status === "uploaded");
  const resubmitting = s.documentsSubmitted;
  const canSubmit = missing.length === 0 && (!resubmitting || fresh.length > 0);

  const submit = () => {
    setTried(true);
    if (missing.length) return;
    const documents: Record<string, UploadedDoc> = { ...s.documents };
    for (const r of reqs) if (documents[r.id]?.status === "uploaded") documents[r.id] = { ...documents[r.id], status: "in_review", note: undefined };
    s.set({ documents, documentsSubmitted: true });
    toast.success(resubmitting ? "Updated documents sent" : "Documents submitted", { description: "We check them for common issues before compliance review." });
    router.push("/get-started");
  };

  return (
    <SetupColumn size="md">
      <SetupHeader
        back="/get-started"
        title="Business document verification"
        description="Upload the required documents. We’ll check them for common issues before compliance review."
      />
      <p className="sr-only" aria-live="polite">
        {required.length - missing.length} of {required.length} required documents uploaded
      </p>
      <ul className="flex flex-col gap-8">
        {reqs.map((r) => (
          <li key={r.id}>
            <DocCard req={r} doc={s.documents[r.id]} showError={tried && missing.includes(r)} locked={resubmitting && s.documents[r.id]?.status !== "needs_attention" && s.documents[r.id]?.status !== "uploaded"} />
          </li>
        ))}
      </ul>
      {tried && missing.length > 0 && (
        <Note intent="error" className="mt-6">
          Complete {missing.length === 1 ? `“${missing[0].title}”` : `the ${missing.length} documents marked above`} to continue.
        </Note>
      )}
      <ForenButton size="md" className="mt-8 w-full" disabled={resubmitting && !canSubmit} onClick={submit}>
        {resubmitting ? "Send updated documents" : "Submit documents"}
      </ForenButton>
    </SetupColumn>
  );
}

function DocCard({ req, doc, showError, locked }: { req: Requirement; doc?: UploadedDoc; showError: boolean; locked: boolean }) {
  const setDocument = useOnboarding((s) => s.setDocument);
  const demo = useOnboarding((s) => s.demo);
  const [alts, setAlts] = React.useState(false);
  const [support, setSupport] = React.useState(false);
  // The alternative document they chose to upload instead (prototype: kept on this screen only).
  const [instead, setInstead] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState<{ name: string; kb: number; progress: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const titleId = React.useId();

  const onFiles = (files: FileList) => {
    const f = files[0];
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
        setDocument(req.id, checkUpload(req, { fileName: f.name, sizeKb: Math.round(kb), status: "uploaded" }, demo));
      } else setUploading((u) => (u ? { ...u, progress: p } : u));
    }, 220);
  };

  const attention = doc?.status === "needs_attention";
  const fieldError = error ?? (showError ? "Upload this document" : undefined);

  return (
    <section aria-labelledby={titleId}>
      {/* Figma document card: white, 20px corners, hairline border; the alternatives strip is tucked under it. */}
      <div className="relative z-[1] flex flex-col gap-4 rounded-[20px] border-[0.7px] border-line bg-surface px-3 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={titleId} className="text-[16px] leading-[24px] font-medium tracking-[0.015em] text-fg">
              {req.title}
            </h2>
            {req.optional && <ForenBadge size="sm">Optional</ForenBadge>}
            {doc?.status === "in_review" && (
              <ForenBadge size="sm" color="orange">
                In review
              </ForenBadge>
            )}
            {doc?.status === "accepted" && (
              <ForenBadge size="sm" color="success">
                Accepted
              </ForenBadge>
            )}
          </div>
          <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">{req.description}</p>
          {req.because && (
            <span className="mt-1 w-fit rounded-full bg-info-subtle px-2 py-0.5 text-[11px] leading-[16px] font-semibold text-info">{req.because}</span>
          )}
          {instead && !doc && (
            <p className="mt-1 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">
              Uploading instead: <span className="text-fg">{instead}</span>{" "}
              <button type="button" onClick={() => setInstead(null)} className="font-semibold underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus">
                Undo
              </button>
            </p>
          )}
        </div>

        {/* Figma "Error handlers": the rejected file in the error state, the reason underneath, then a new upload. */}
        {attention && doc && (
          <div className="flex flex-col gap-1">
            <ForenFileItem state="error" fileName={doc.fileName} fileSize={fmtSize(doc.sizeKb)} />
            {doc.note && (
              <p role="alert" className="flex items-start gap-1 px-3 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-error">
                <WarningFillIcon className="mt-px size-3.5 shrink-0" aria-hidden />
                {doc.note}
              </p>
            )}
          </div>
        )}

        {uploading ? (
          <ForenFileItem state="uploading" fileName={uploading.name} fileSize={`${fmtSize(uploading.kb)} · Uploading`} progress={uploading.progress} />
        ) : doc && !attention ? (
          <ForenFileItem
            state={doc.status === "accepted" ? "success" : "ready"}
            fileName={doc.fileName}
            fileSize={fmtSize(doc.sizeKb)}
            onRemove={locked ? undefined : () => setDocument(req.id, null)}
          />
        ) : (
          <div className="flex flex-col gap-1">
            <ForenFileUpload
              variant="compact"
              accept={ACCEPT}
              placeholder={attention ? "Choose a new file…" : "Choose file…"}
              onFiles={onFiles}
              error={fieldError}
              aria-label={`Upload ${req.title}`}
              // Figma "File Upload / Compact": sunken fill, no border (the red border stays for errors).
              className={cn("[&>div:first-child]:bg-sunken [&>div:first-child]:pl-3", !fieldError && "[&>div:first-child]:border-transparent")}
            />
            {!fieldError && <p className="px-3 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">Max 10MB per file. Allowed: PDF, JPG, PNG</p>}
          </div>
        )}

        {!uploading && doc && !attention && req.reads && <ReadNumber req={req} doc={doc} showError={showError} locked={locked} />}
      </div>

      {req.accepted && !locked && (
        <div className="-mt-5 rounded-b-[20px] bg-subtle px-4 pt-9 pb-4">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">
            <span className="flex items-center gap-1">
              <QuestionIcon className="size-[18px]" aria-hidden />
              Don’t have this document?
            </span>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setAlts(true)}
              className="font-medium text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              View alternatives
            </button>
          </p>
        </div>
      )}

      {alts && req.accepted && (
        <AlternativesDialog
          title={req.title}
          options={req.accepted}
          onClose={() => setAlts(false)}
          onPick={(a) => {
            setAlts(false);
            setInstead(a);
          }}
          onNone={() => {
            setAlts(false);
            setSupport(true);
          }}
        />
      )}
      <SupportDialog open={support} onClose={() => setSupport(false)} />
    </section>
  );
}

const NONE = "__none__";

/** Figma "Don’t have {Document name}": pick one accepted alternative, or say you have none (then support). */
function AlternativesDialog({
  title,
  options,
  onClose,
  onPick,
  onNone,
}: {
  title: string;
  options: string[];
  onClose: () => void;
  onPick: (alternative: string) => void;
  onNone: () => void;
}) {
  const [picked, setPicked] = React.useState<string | null>(null);
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={`Don’t have the ${title}?`} description="Select an alternative document below to upload." className="sm:max-w-[470px]">
      <div className="-mx-6 flex flex-col gap-4 border-y border-line px-6 py-4">
        {[...options, NONE].map((o) => (
          <ForenCheckbox
            key={o}
            checked={picked === o}
            onCheckedChange={(c) => setPicked(c === true ? o : null)}
            label={o === NONE ? "I don’t have an alternative document" : o}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <ForenButton variant="outline" size="xs" className="text-fg-2" onClick={onClose}>
          Cancel
        </ForenButton>
        <ForenButton size="xs" disabled={!picked} onClick={() => (picked === NONE ? onNone() : picked && onPick(picked))}>
          {picked === NONE ? "Continue" : "Replace document"}
        </ForenButton>
      </div>
    </Modal>
  );
}

/** Figma "Need a hand?": shown when they have none of the accepted documents, or a stakeholder's check is rejected. */
export function SupportDialog({
  open,
  onClose,
  sentDescription = "We’ve let our team know you don’t have this document.",
}: {
  open: boolean;
  onClose: () => void;
  /** Toast shown after "Contact support": what we told the team. */
  sentDescription?: string;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={
        <span className="flex flex-col items-center gap-6 pt-6 pl-10 text-center">
          <span aria-hidden className="grid size-14 place-items-center rounded-full bg-success-subtle text-success">
            <ChatsIcon className="size-6" />
          </span>
          <span className="text-[16px] leading-[24px] font-semibold tracking-[0.015em]">Need a hand?</span>
        </span>
      }
      className="sm:max-w-[470px]"
    >
      <p className="-mt-3 text-center text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">
        Get 24/7 assistance from our support team via live chat, email or phone.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <ForenButton
          variant="outline"
          size="xxs"
          className="font-medium tracking-[0.01em] text-fg-2"
          onClick={() => {
            onClose();
            toast("Help centre opens in a new tab", { description: "Prototype: there’s no help centre yet." });
          }}
        >
          Visit help centre
        </ForenButton>
        <ForenButton
          size="xxs"
          className="font-medium tracking-[0.01em]"
          onClick={() => {
            onClose();
            toast.success("Support will be in touch", { description: sentDescription });
          }}
        >
          Contact support
        </ForenButton>
      </div>
    </Modal>
  );
}

/** The number read off the document, or a field to enter it when the check couldn't find it. */
function ReadNumber({ req, doc, showError, locked }: { req: Requirement; doc: UploadedDoc; showError: boolean; locked: boolean }) {
  const setDocument = useOnboarding((s) => s.setDocument);
  const label = req.reads!;
  if (doc.numberSource === "document")
    return (
      <p className="text-[12px] leading-[18px] font-medium text-fg-2">
        {label}: <span className="text-fg">{doc.number}</span>, read from this document.
      </p>
    );
  const empty = !doc.number?.trim();
  return (
    <ForenInput
      label={label}
      description={`We couldn’t find your ${label} on this document. Enter it as it appears on your certificate.`}
      value={doc.number ?? ""}
      disabled={locked}
      onChange={(e) => setDocument(req.id, { ...doc, number: e.target.value, numberSource: "entered" })}
      aria-invalid={showError && empty}
      error={showError && empty ? `Enter your ${label}` : undefined}
    />
  );
}
