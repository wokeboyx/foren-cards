"use client";
import * as React from "react";
import { RiCloseLine } from "@remixicon/react";
import { ForenButton } from "@/components/ui/foren-button";

/** Mercury-style inline detail panel beside a list (desktop). Phones use a full-screen Sheet instead. */
export function SidePanel({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <aside aria-label={label} className="sticky top-[84px] max-h-[calc(100dvh-100px)] overflow-y-auto rounded-[20px] bg-surface shadow-[var(--shadow-foren-sm)] ring-1 ring-line">
      <div className="sticky top-0 z-10 flex justify-end px-3 pt-3">
        <ForenButton variant="ghost" size="xxs" aria-label={`Close ${label.toLowerCase()}`} className="bg-surface px-2" leadingIcon={<RiCloseLine />} onClick={onClose} />
      </div>
      <div className="-mt-6">{children}</div>
    </aside>
  );
}
