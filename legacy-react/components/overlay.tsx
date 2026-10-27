"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { RiCloseLine } from "@remixicon/react";
import { ForenButton } from "@/components/ui/foren-button";
import { cn } from "@/lib/utils";

/**
 * Side sheet: a right-hand panel on desktop, full-screen on narrow screens (§4, §11).
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = 489,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#241c15]/30 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        {/* Figma drawer: full height, square edges, 489px; white header with 40px round close and a muted divider. */}
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-surface shadow-[var(--shadow-foren-xl)] outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[var(--w)] data-[state=open]:animate-[sheet-in_220ms_cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ "--w": `${width}px` } as React.CSSProperties}
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 pt-6 pb-5">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-[18px] leading-[28px] font-semibold tracking-[-0.01em] text-fg">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-[14px] leading-[21px] text-fg-3">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Details</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
            >
              <RiCloseLine className="size-[22px]" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="flex min-h-[84px] items-center border-t border-line px-5 py-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Centered modal dialog for confirmations and short tasks. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-[#241c15]/40" />
        <Dialog.Content
          className={cn(
            // Phones: bottom sheet with rounded top (Figma responsive "Modal"); larger screens: centred.
            "fixed inset-x-0 bottom-0 z-[70] max-h-[calc(100dvh-24px)] w-full overflow-y-auto rounded-t-[24px] bg-surface p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[var(--shadow-foren-xl)] outline-none",
            "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[calc(100dvh-32px)] sm:w-[calc(100vw-32px)] sm:max-w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] sm:pb-6",
            className
          )}
        >
          <Dialog.Close
            aria-label="Close"
            className="absolute top-5 right-5 grid size-8 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
          >
            <RiCloseLine className="size-[18px]" aria-hidden />
          </Dialog.Close>
          <Dialog.Title className="pr-10 text-[18px] leading-[28px] font-semibold tracking-[-0.01em] text-fg">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description asChild>
              <div className="mt-2 text-[14px] leading-[22px] text-fg-2">{description}</div>
            </Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">Dialog</Dialog.Description>
          )}
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Confirmation that states the consequence before a risky or destructive action (§4). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  consequence,
  confirmLabel,
  destructive,
  pending,
  error,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  consequence: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={consequence}>
      {children}
      {error && (
        <p role="alert" className="mb-4 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] leading-[18px] text-error">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
          Keep as is
        </ForenButton>
        <ForenButton size="sm" destructive={destructive} onClick={onConfirm} disabled={pending}>
          {pending ? "Working…" : confirmLabel}
        </ForenButton>
      </div>
    </Modal>
  );
}

/** Bottom sheet for the phone-only personal track: slides up, dismiss by tapping outside or Close. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-[#241c15]/40 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-[28px] bg-surface shadow-[var(--shadow-foren-xl)] outline-none data-[state=open]:animate-[sheet-up_260ms_cubic-bezier(0.2,0.8,0.2,1)]">
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-2" aria-hidden />
          <div className="flex items-start justify-between gap-4 px-5 pt-3 pb-2">
            <div className="min-w-0">
              <Dialog.Title className="text-[18px] leading-[24px] font-semibold tracking-[-0.01em] text-fg">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-[13px] leading-[18px] text-fg-3">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Details</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <ForenButton variant="ghost" size="xs" aria-label="Close" className="-mr-2 px-2.5" leadingIcon={<RiCloseLine />} />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-[max(20px,env(safe-area-inset-bottom))]">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
