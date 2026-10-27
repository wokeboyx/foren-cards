import { cva } from "class-variance-authority";
import { RiFileImageFill, RiFilePdf2Fill } from "@remixicon/vue";
import type { Component } from "vue";

// File-type logos from Remix Icon, keyed off the extension. Remix has no
// SVG-specific glyph, so SVG maps to the image-file logo.
export const FILE_TYPE_ICON: Record<string, { Icon: Component; fg: string }> = {
  PDF: { Icon: RiFilePdf2Fill, fg: "text-[var(--color-foren-error)]" },
  SVG: { Icon: RiFileImageFill, fg: "text-[var(--color-foren-indigo)]" },
};

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > -1 ? fileName.slice(dot + 1).toUpperCase() : "";
}

export const fileItemVariants = cva("flex items-center gap-3 p-3 rounded-2xl w-full", {
  variants: {
    state: {
      ready: "bg-[var(--color-foren-bg-subtle)]",
      uploading: "bg-[var(--color-foren-bg-subtle)]",
      success: "bg-[var(--color-foren-bg-success-subtle)]",
      error: "bg-[var(--color-foren-bg-error-subtle)]",
    },
  },
  defaultVariants: { state: "ready" },
});

export type FileItemState = "ready" | "uploading" | "success" | "error";
