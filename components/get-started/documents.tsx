"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RiDownloadLine, RiQuestionLine } from "@remixicon/react";
import { toast } from "sonner";
import { ForenBadge } from "@/components/ui/foren-badge";
import { ForenButton } from "@/components/ui/foren-button";
import { ForenFileItem } from "@/components/ui/foren-file-item";
import { ForenFileUpload } from "@/components/ui/foren-file-upload";
import { uploadRequirements, type Requirement } from "@/domain/onboarding";
import { useOnboarding, useRequirementContext, type UploadedDoc } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Note, SetupColumn, SetupHeader } from "./shared";

const MAX_KB = 10 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

const fmtSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`);

export function DocumentsPage() {
  const ctx = useRequirementContext();
  const s = useOnboarding();
  const router = useRouter();
  const [tried, setTried] = React.useState(false);

  if (!ctx || !s.signedUpAt)
    return (
      <SetupColumn>
        <SetupHeader back="/get-started" title="Business document verification" description="Finish sign-up first." />
      </SetupColumn>
    );

  const reqs = uploadRequirements(ctx);
  const required = reqs.filter((r) => !r.optional);
  const missing = required.filter((r) => !s.documents[r.id] || s.documents[r.id].status === "needs_attention");
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
    <SetupColumn>
      <SetupHeader
        back="/get-started"
        title="Business document verification"
        description="Upload the documents below. We’ll check them for common issues before compliance review."
      />
      <p className="sr-only" aria-live="polite">
        {required.length - missing.length} of {required.length} required documents uploaded
      </p>
      <ul className="flex flex-col gap-4">
        {reqs.map((r) => (
          <li key={r.id}>
            <DocCard req={r} doc={s.documents[r.id]} showError={tried && missing.includes(r)} locked={resubmitting && s.documents[r.id]?.status !== "needs_attention" && s.documents[r.id]?.status !== "uploaded"} />
          </li>
        ))}
      </ul>
      {tried && missing.length > 0 && (
        <Note intent="error" className="mt-6">
          Upload {missing.length === 1 ? `“${missing[0].title}”` : `the ${missing.length} documents marked above`} to continue.
        </Note>
      )}
      <ForenButton size="md" className="mt-6 w-full" disabled={resubmitting && !canSubmit} onClick={submit}>
        {resubmitting ? "Send updated documents" : "Submit documents"}
      </ForenButton>
    </SetupColumn>
  );
}

function DocCard({ req, doc, showError, locked }: { req: Requirement; doc?: UploadedDoc; showError: boolean; locked: boolean }) {
  const setDocument = useOnboarding((s) => s.setDocument);
  const [alts, setAlts] = React.useState(false);
  const [uploading, setUploading] = React.useState<{ name: string; kb: number; progress: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const altId = React.useId();
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
        setDocument(req.id, { fileName: f.name, sizeKb: Math.round(kb), status: "uploaded" });
      } else setUploading((u) => (u ? { ...u, progress: p } : u));
    }, 220);
  };

  const attention = doc?.status === "needs_attention";

  return (
    <section aria-labelledby={titleId} className={cn("overflow-hidden rounded-[16px] bg-surface", (showError || attention) && "ring-1 ring-error/30")}>
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={titleId} className="text-[14px] leading-[21px] font-medium text-fg">
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
          <p className="text-[12px] leading-[18px] font-medium text-fg-3">{req.description}</p>
          {req.because && (
            <span className="mt-1 w-fit rounded-full bg-info-subtle px-2 py-0.5 text-[11px] leading-[16px] font-semibold text-info">{req.because}</span>
          )}
        </div>

        {attention && doc?.note && <Note intent="error">{doc.note}</Note>}

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
          <div className="flex flex-col gap-1.5">
            <ForenFileUpload
              variant="compact"
              accept={ACCEPT}
              placeholder={attention ? "Choose a new file…" : "Choose file…"}
              onFiles={onFiles}
              error={error ?? (showError ? "Upload this document" : undefined)}
              aria-label={`Upload ${req.title}`}
              className="[&>div:first-child]:border-line [&>div:first-child]:bg-subtle"
            />
            {!error && !showError && <p className="text-[12px] leading-[18px] font-medium text-fg-3">Max 10 MB per file. PDF, JPG or PNG.</p>}
          </div>
        )}

        {req.id === "ubo_declaration" && !doc && (
          <button
            type="button"
            onClick={() => downloadTemplate()}
            className="inline-flex w-fit items-center gap-1.5 text-[12px] leading-[18px] font-semibold text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <RiDownloadLine className="size-3.5" aria-hidden />
            Download the UBO declaration template
          </button>
        )}
      </div>

      {req.accepted && (
        <div className="bg-sunken px-4 py-3">
          <p className="flex items-center gap-1.5 text-[12px] leading-[18px] font-medium text-fg-2">
            <RiQuestionLine className="size-3.5" aria-hidden />
            Don’t have this document?{" "}
            <button
              type="button"
              aria-expanded={alts}
              aria-controls={altId}
              onClick={() => setAlts((a) => !a)}
              className="font-semibold text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {alts ? "Hide alternatives" : "View alternatives"}
            </button>
          </p>
          {alts && (
            <div id={altId} className="mt-2">
              <p className="mb-1 text-[12px] leading-[18px] font-medium text-fg-3">We accept any one of these:</p>
              <ul className="list-disc space-y-1 pl-5 text-[12px] leading-[18px] font-medium text-fg-2">
                {req.accepted.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function downloadTemplate() {
  const body = [
    "ULTIMATE BENEFICIAL OWNER (UBO) DECLARATION",
    "",
    "Company name:",
    "Registration number:",
    "",
    "We declare that the people below are the ultimate beneficial owners of the company:",
    "",
    "Full name | Date of birth | Nationality | Ownership % | Nature of control",
    "",
    "Signed (director):                 Date:",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "foren-ubo-declaration-template.txt";
  a.click();
  URL.revokeObjectURL(url);
  toast("Template downloaded", { description: "Fill it in, get a director to sign it, then upload it here." });
}
