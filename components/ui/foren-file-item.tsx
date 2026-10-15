"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ForenProgress } from "./foren-progress";
import {
  RiFileLine,
  RiFilePdf2Fill,
  RiFileImageFill,
  RiCloseLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiRefreshLine,
  type RemixiconComponentType,
} from "@remixicon/react";
// File-type logos from Remix Icon, keyed off the extension. Remix has no
// SVG-specific glyph, so SVG maps to the image-file logo.
const FILE_TYPE_ICON: Record<string, { Icon: RemixiconComponentType; fg: string }> = {
  PDF: { Icon: RiFilePdf2Fill, fg: "text-[var(--color-foren-error)]" },
  SVG: { Icon: RiFileImageFill, fg: "text-[var(--color-foren-indigo)]" },
};
function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > -1 ? fileName.slice(dot + 1).toUpperCase() : "";
}
function FileTypeIcon({ fileName, override }: { fileName: string; override?: React.ReactNode }) {
  const entry = FILE_TYPE_ICON[extensionOf(fileName)];
  const content = override ? (
    override
  ) : entry ? (
    <entry.Icon size={20} className={entry.fg} />
  ) : (
    <RiFileLine size={20} className="text-[var(--color-foren-text-secondary)]" />
  );
  return (
    <span className="shrink-0 size-9 rounded-xl bg-[var(--color-foren-bg-default)] flex items-center justify-center" aria-hidden>
      {content}
    </span>
  );
}
const itemVariants = cva(
  "flex items-center gap-3 p-3 rounded-2xl w-full",
  {
    variants: {
      state: {
        ready: "bg-[var(--color-foren-bg-subtle)]",
        uploading: "bg-[var(--color-foren-bg-subtle)]",
        success: "bg-[var(--color-foren-bg-success-subtle)]",
        error: "bg-[var(--color-foren-bg-error-subtle)]",
      },
    },
    defaultVariants: { state: "ready" },
  }
);
export interface ForenFileItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof itemVariants> {
  /** File name shown as the primary label. */
  fileName: string;
  /** Secondary meta line — size, status text, or error message. */
  fileSize?: string;
  /** 0–100. Shown as a progress bar when `state="uploading"`. */
  progress?: number;
  /** Renders a remove (X) button when provided. */
  onRemove?: () => void;
  /** Renders a retry button in the error state when provided. */
  onRetry?: () => void;
  /** Custom leading icon (defaults to a file glyph). */
  icon?: React.ReactNode;
}
/**
 * A single uploaded/uploading file row. Four states — ready, uploading
 * (with a real Progress bar), success, error. Pair with `ForenFileUpload`.
 */
export const ForenFileItem = React.forwardRef<HTMLDivElement, ForenFileItemProps>(
  function ForenFileItem(
    { className, state = "ready", fileName, fileSize, progress = 0, onRemove, onRetry, icon, ...props },
    ref
  ) {
    const metaColor =
      state === "success"
        ? "text-[var(--color-foren-success)]"
        : state === "error"
          ? "text-[var(--color-foren-error)]"
          : "text-[var(--color-foren-text-tertiary)]";
    return (
      <div ref={ref} className={cn(itemVariants({ state }), className)} {...props}>
        {/* File-type logo */}
        <FileTypeIcon fileName={fileName} override={icon} />
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)] truncate">
            {fileName}
          </p>
          {state === "uploading" ? (
            <>
              {fileSize && (
                <p className="text-[12px] leading-[18px] font-medium text-[var(--color-foren-text-tertiary)] truncate">
                  {fileSize}
                </p>
              )}
              <ForenProgress size="sm" value={progress} hideValue className="mt-0.5" />
            </>
          ) : (
            fileSize && (
              <p className={cn("text-[12px] leading-[18px] font-medium truncate", metaColor)}>
                {fileSize}
              </p>
            )
          )}
        </div>
        {/* Trailing status + actions */}
        <div className="shrink-0 flex items-center gap-1.5">
          {state === "success" && (
            <span className="text-[var(--color-foren-success)]" aria-hidden>
              <RiCheckboxCircleLine size={18} />
            </span>
          )}
          {state === "error" && (
            <span className="text-[var(--color-foren-error)]" aria-hidden>
              <RiErrorWarningLine size={18} />
            </span>
          )}
          {state === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              aria-label={`Retry upload of ${fileName}`}
              className="size-5 flex items-center justify-center rounded-[10px] text-[var(--color-foren-text-secondary)] hover:bg-[var(--color-foren-bg-button-secondary-active)] transition-colors"
            >
              <RiRefreshLine size={14} />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${fileName}`}
              className="size-5 flex items-center justify-center rounded-[10px] text-[var(--color-foren-text-tertiary)] hover:bg-[var(--color-foren-bg-button-secondary-active)] hover:text-[var(--color-foren-text-primary)] transition-colors"
            >
              <RiCloseLine size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }
);