"use client";
import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";

/**
 * Login & password reset layout (Figma iZ2xmXeaxOGR9vzf2vSWfn · 8751:110154).
 * Desktop: a 546px dark brand panel (wordmark, headline, coin artwork) beside a sunken content area with a
 * 558px column 148px from the top and the legal links pinned to the bottom.
 * Below lg (Figma 11212:149980, 402px): the panel becomes a 221px image banner above the form.
 */
export function AuthFrame({
  children,
  alert,
  className,
}: {
  children: React.ReactNode;
  /** Pinned to the top right of the content area (Figma "Toast"). */
  alert?: React.ReactNode;
  /** Extra classes for the content column, e.g. a different top offset. */
  className?: string;
}) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-sunken lg:flex">
      <BrandPanel />
      <div className="relative flex min-h-dvh min-w-0 flex-1 flex-col max-lg:min-h-[calc(100dvh-221px)]">
        {alert && <div className="absolute inset-x-4 top-4 z-10 lg:inset-x-auto lg:top-10 lg:right-10 lg:w-[min(633px,calc(100%-80px))]">{alert}</div>}
        <main id="main" className={cn("mx-auto w-full max-w-[558px] flex-1 px-5 pt-10 pb-12 lg:px-0 lg:pt-[148px]", className)}>
          {children}
        </main>
        <LegalLinks />
      </div>
    </div>
  );
}

/** Midnight espresso 700 → 500 (Figma "LINEAR COLOR"). */
const PANEL_BG = "bg-[linear-gradient(180deg,#17120d_50%,#241c15_87.226%)]";

function BrandPanel() {
  return (
    <>
      {/* Desktop: sticky full-height panel. The artwork is scaled to two thirds of Figma's and pinned to the bottom, so it stays clear of the copy. */}
      <aside aria-label="Foren" className={cn("sticky top-0 hidden h-dvh w-[min(546px,38vw)] shrink-0 overflow-hidden px-10 pt-10 lg:block", PANEL_BG)}>
        <Image src={asset("/login/foren-wordmark-light.svg")} alt="Foren" width={100} height={24} preload />
        <div className="relative z-10 mt-20 flex flex-col gap-4 text-[var(--color-foren-text-inverse)]">
          <p className="font-display text-[32px] leading-[56px] font-medium tracking-[-0.4px] [font-synthesis:none]">Global payments and accessibility on one platform.</p>
          <p className="text-[20px] leading-[36px] font-medium opacity-80">We offer global accounts, transfers, and infrastructure for people and businesses that don’t stop at borders.</p>
        </div>
        <Image src={asset("/login/coin-artwork.png")} alt="" width={820} height={820} sizes="820px" className="pointer-events-none absolute bottom-[-468px] left-[-70px] size-[820px] max-w-none select-none [mask-image:linear-gradient(to_bottom,transparent,black_22%)]" />
      </aside>

      {/* Phones and tablets: image banner. */}
      <div className={cn("relative h-[221px] overflow-hidden lg:hidden", PANEL_BG)}>
        <Image src={asset("/login/foren-wordmark-light.svg")} alt="Foren" width={100} height={24} preload className="absolute top-10 left-10 z-10" />
        <Image src={asset("/login/coin-artwork-banner.png")} alt="" width={621} height={621} sizes="621px" className="pointer-events-none absolute top-0 left-[52px] size-[621px] max-w-none select-none" />
      </div>
    </>
  );
}

const LEGAL = ["Legal Agreements", "Complaints", "Privacy", "Customer Vulnerability"];

function LegalLinks() {
  return (
    <footer className="px-5 pt-2 pb-6 lg:pb-[33px]">
      <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
        {LEGAL.map((label) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => toast(`${label} opens on foren.co. It isn’t part of the prototype.`)}
              className="rounded-[4px] py-1 text-[14px] leading-5 tracking-[0.24px] text-fg-2 outline-none hover:text-fg hover:underline focus-visible:ring-2 focus-visible:ring-focus"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </footer>
  );
}

/** Megafield title with optional copy under it (Figma "Megafield/Title small"). */
export function AuthHeading({ title, children, className }: { title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h1 className="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] text-black [font-synthesis:none]">{title}</h1>
      {children && <div className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg-2">{children}</div>}
    </div>
  );
}

/** Decorative 3D illustration above a title (lock, envelope, tick). */
export function AuthArt({ src, size, className }: { src: string; size: number; className?: string }) {
  return <Image src={asset(src)} alt="" width={size} height={size} sizes={`${size}px`} className={cn("shrink-0 select-none", className)} style={{ width: size, height: size }} />;
}

/** Error toast from Figma 8751:110786: red-tinted halo around a white card, info icon, title, copy and a close button. */
export function AuthAlert({ title, description, onDismiss }: { title: string; description?: string; onDismiss: () => void }) {
  return (
    <div role="alert" className="rounded-[24px] bg-[var(--color-foren-bg-error-subtle)] p-3 backdrop-blur-[12px] animate-[fade-in_150ms_ease-out]">
      <div className="flex items-start justify-between gap-2 rounded-[16px] bg-white p-3 shadow-[0_2px_2px_rgba(36,28,21,0.08)]">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span className="grid size-8 shrink-0 place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- 20px static icon from the design file. */}
            <img src={asset("/login/error-info.svg")} alt="" width={20} height={20} />
          </span>
          <div className="min-w-0 flex-1 px-1">
            <p className="text-[16px] leading-6 font-medium tracking-[0.005em] text-fg">{title}</p>
            {description && <p className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg-3">{description}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="grid size-8 shrink-0 place-items-center rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white shadow-[0_2px_0.75px_rgba(0,0,0,0.03)] outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 18px static icon from the design file. */}
          <img src={asset("/login/close.svg")} alt="" width={18} height={18} />
        </button>
      </div>
    </div>
  );
}

/** Small "Prototype: …" note for testers, like the one on Verify email. */
export function PrototypeHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[11px] leading-4 text-fg-3", className)}>{children}</p>;
}

/** Underlined 14px text link/button (Figma "Create account", "Forgot password?", "Use Backup Code"). */
export const textLinkCls =
  "rounded-[4px] text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg underline underline-offset-[3px] outline-none hover:text-black focus-visible:ring-2 focus-visible:ring-focus";
