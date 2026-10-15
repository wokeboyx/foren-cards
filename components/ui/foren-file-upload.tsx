"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ForenButton } from "./foren-button";
import { RiUploadCloud2Line } from "@remixicon/react";
export interface ForenFileUploadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  /** Layout: full drag-and-drop zone, or a compact inline field. */
  variant?: "dropzone" | "compact";
  /** Dropzone headline. */
  title?: string;
  /** Dropzone helper line — put the size/format limits here. */
  description?: string;
  /** Browse button label. */
  browseLabel?: string;
  /** Compact placeholder shown before a file is chosen. */
  placeholder?: string;
  /** Selected file name — switches compact/dropzone into the "filled" look. */
  fileName?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Error message. Renders error styling and shows the text below. */
  error?: string;
  /** Force the drag-over visual (used by docs; real drag-over is automatic). */
  forceDragover?: boolean;
  /** Called with the chosen/dropped files. */
  onFiles?: (files: FileList) => void;
}
/**
 * File upload trigger. `dropzone` is a dashed drag-and-drop area; `compact`
 * is an inline field + browse button. Render selected files with `ForenFileItem`.
 */
export const ForenFileUpload = React.forwardRef<HTMLDivElement, ForenFileUploadProps>(
  function ForenFileUpload(
    {
      className,
      variant = "dropzone",
      title = "Drag & drop files here",
      description = "or click to browse. Max 10MB per file.",
      browseLabel = "Browse files",
      placeholder = "Choose file…",
      fileName,
      accept,
      multiple,
      disabled = false,
      error,
      forceDragover = false,
      onFiles,
      ...props
    },
    ref
  ) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = React.useState(false);
    const active = dragging || forceDragover;
    const openPicker = () => {
      if (!disabled) inputRef.current?.click();
    };
    const handleFiles = (files: FileList | null) => {
      if (files && files.length) onFiles?.(files);
    };
    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    };
    const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragging(true);
    };
    const hiddenInput = (
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    );
    if (variant === "compact") {
      const borderColor = error
        ? "border-[var(--color-foren-error)]"
        : active
          ? "border-[var(--color-foren-border-strong)]"
          : disabled
            ? "border-[var(--color-foren-border-disabled)]"
            : "border-[var(--color-foren-border-muted)]";
      return (
        <div ref={ref} className={cn("w-full", className)} {...props}>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={() => setDragging(false)}
            className={cn(
              "flex items-center gap-3 w-full h-12 pl-4 pr-1.5 rounded-xl border bg-[var(--color-foren-bg-default)] transition-colors",
              borderColor,
              disabled && "opacity-60"
            )}
          >
            <span
              className={cn(
                "flex-1 min-w-0 truncate text-[14px] leading-[21px]",
                fileName
                  ? "text-[var(--color-foren-text-primary)] font-medium"
                  : "text-[var(--color-foren-text-tertiary)]"
              )}
            >
              {fileName ?? placeholder}
            </span>
            <ForenButton size="xs" variant="primary" disabled={disabled} onClick={openPicker}>
              {fileName ? "Change" : browseLabel}
            </ForenButton>
          </div>
          {error && (
            <p className="mt-1.5 text-[12px] leading-[18px] font-medium text-[var(--color-foren-error)]">
              {error}
            </p>
          )}
          {hiddenInput}
        </div>
      );
    }
    // dropzone
    const borderColor = error
      ? "border-[var(--color-foren-error)]"
      : active
        ? "border-[var(--color-foren-border-strong)]"
        : disabled
          ? "border-[var(--color-foren-border-disabled)]"
          : "border-[var(--color-foren-border-muted)]";
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setDragging(false)}
          className={cn(
            "w-full rounded-xl border-2 border-dashed bg-[var(--color-foren-bg-default)] flex flex-col items-center justify-center gap-3 px-6 py-8 text-center transition-colors outline-none",
            "focus-visible:border-[var(--color-foren-border-strong)]",
            borderColor,
            active && "bg-[var(--color-foren-bg-subtle)]",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          )}
        >
          <span className="size-12 rounded-full bg-[var(--color-foren-bg-subtle)] flex items-center justify-center text-[var(--color-foren-text-secondary)]">
            <RiUploadCloud2Line size={20} />
          </span>
          <div className="flex flex-col gap-2 items-center">
            <p className="text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-[var(--color-foren-text-primary)]">
              {fileName ?? title}
            </p>
            <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-[var(--color-foren-text-tertiary)]">
              {description}
            </p>
          </div>
          <ForenButton size="xs" variant="primary" disabled={disabled} tabIndex={-1}>
            {browseLabel}
          </ForenButton>
        </div>
        {error && (
          <p className="mt-2 text-[12px] leading-[18px] font-medium text-[var(--color-foren-error)]">
            {error}
          </p>
        )}
        {hiddenInput}
      </div>
    );
  }
);