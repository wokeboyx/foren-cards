"use client";
import * as React from "react";
import { RiErrorWarningLine } from "@remixicon/react";
import { ForenButton } from "@/components/ui/foren-button";
import { COPY } from "@/content/copy";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  body,
  action,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      {icon && <div className="mb-4 grid size-14 place-items-center rounded-full bg-subtle text-fg-2 [&_svg]:size-6">{icon}</div>}
      <h2 className="text-[20px] leading-[26px] font-semibold tracking-[-0.01em] text-fg">{title}</h2>
      <p className="mt-2 max-w-md text-[14px] leading-[22px] text-fg-2">{body}</p>
      {action && <div className="mt-6">{action}</div>}
      {children}
    </div>
  );
}

export function ErrorState({ onRetry, message = COPY.genericError, className }: { onRetry?: () => void; message?: string; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-error-subtle text-error">
        <RiErrorWarningLine className="size-6" aria-hidden />
      </div>
      <p className="text-[14px] leading-[22px] font-medium text-fg">{message}</p>
      {onRetry && (
        <ForenButton variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </ForenButton>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-subtle", className)} />;
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label={COPY.loading} className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-8 w-12 rounded-[6px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
      <span className="sr-only">{COPY.loading}</span>
    </div>
  );
}

/** A white rounded surface — the standard Foren panel. */
export function Panel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-[20px] bg-surface", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h3 className="text-[16px] leading-[22px] font-semibold tracking-[0.005em] text-fg">{children}</h3>
      {action}
    </div>
  );
}

/** Route-level fallback while client-only state (URL params, local data) resolves. */
export function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="h-64 w-full rounded-[20px]" />
      <span className="sr-only">{COPY.loading}</span>
    </div>
  );
}
