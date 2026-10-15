"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const avatarVariants = cva(
  "relative inline-flex items-center justify-center rounded-full shrink-0 overflow-visible select-none",
  {
    variants: {
      size: {
        xs: "size-6 text-[10px]",
        sm: "size-8 text-[12px]",
        md: "size-10 text-[14px]",
        lg: "size-12 text-[16px]",
        xl: "size-14 text-[18px]",
        "2xl": "size-16 text-[20px]",
      },
    },
    defaultVariants: { size: "md" },
  }
);
const innerBgVariants = cva(
  "absolute inset-0 rounded-full flex items-center justify-center overflow-hidden font-medium tracking-[0.01em]",
  {
    variants: {
      tone: {
        dark: "bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]",
        muted: "bg-[var(--color-foren-bg-subtle)] text-[var(--color-foren-text-secondary)]",
      },
    },
    defaultVariants: { tone: "dark" },
  }
);
const PersonIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
export type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>["size"]>;
export type AvatarTone = NonNullable<VariantProps<typeof innerBgVariants>["tone"]>;
export interface ForenAvatarProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  size?: AvatarSize;
  /** Image URL. If present, renders the image. */
  src?: string;
  /** Alt text + initial source if `initials` isn't provided. */
  name?: string;
  /** Override displayed initials. Otherwise derived from `name`. */
  initials?: string;
  /** Render generic person icon when no src/initials given. */
  fallback?: "icon" | "initials";
  /** Show status dot, bottom-right. */
  status?: "online" | "away" | "busy" | "offline";
  /** Tone for the inner bg when rendering initials/icon. */
  tone?: AvatarTone;
}
function initialsFromName(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
// Visual proportions per avatar size — status dot + person icon scale with the avatar.
const meta: Record<
  AvatarSize,
  { px: number; dot: number; ringPx: number; iconPx: number }
> = {
  xs: { px: 24, dot: 7, ringPx: 1.5, iconPx: 14 },
  sm: { px: 32, dot: 9, ringPx: 1.5, iconPx: 18 },
  md: { px: 40, dot: 11, ringPx: 2, iconPx: 22 },
  lg: { px: 48, dot: 13, ringPx: 2, iconPx: 26 },
  xl: { px: 56, dot: 15, ringPx: 2.5, iconPx: 30 },
  "2xl": { px: 64, dot: 17, ringPx: 2.5, iconPx: 36 },
};
const statusColor: Record<NonNullable<ForenAvatarProps["status"]>, string> = {
  online: "var(--color-foren-success)",
  away: "var(--color-foren-warning)",
  busy: "var(--color-foren-error)",
  offline: "var(--color-foren-text-tertiary)",
};
export const ForenAvatar = React.forwardRef<HTMLSpanElement, ForenAvatarProps>(function ForenAvatar(
  {
    className,
    size = "md",
    src,
    name,
    initials,
    fallback = "icon",
    status,
    tone = "dark",
    ...props
  },
  ref
) {
  const m = meta[size];
  const resolvedInitials = initials ?? initialsFromName(name);
  const hasInitials = resolvedInitials.length > 0;
  const showImage = !!src;
  const showInitials = !showImage && (hasInitials || fallback === "initials");
  const showIcon = !showImage && !showInitials;
  return (
    <span ref={ref} className={cn(avatarVariants({ size }), className)} {...props}>
      <span className={innerBgVariants({ tone })}>
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name ?? "Avatar"} className="w-full h-full object-cover" />
        )}
        {showInitials && <span className="leading-none">{resolvedInitials || "?"}</span>}
        {showIcon && (
          <span className="text-[var(--color-foren-text-inverse)]" style={{ width: m.iconPx, height: m.iconPx }}>
            <PersonIcon size={m.iconPx} />
          </span>
        )}
      </span>
      {status && (
        <span
          className="absolute rounded-full"
          style={{
            width: m.dot,
            height: m.dot,
            bottom: 0,
            right: 0,
            backgroundColor: statusColor[status],
            boxShadow: `0 0 0 ${m.ringPx}px var(--color-foren-bg-default)`,
          }}
          aria-label={status}
        />
      )}
    </span>
  );
});
export interface ForenAvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: AvatarSize;
  /** Maximum avatars to render before showing "+N". */
  max?: number;
  /** Overlap amount as fraction of avatar size. Default 0.3 = avatars overlap by 30%. */
  overlap?: number;
  /** Children should be <ForenAvatar /> elements. */
  children: React.ReactNode;
}
/** Stacked, overlapping avatars with optional "+N" trailing chip. */
export function ForenAvatarGroup({
  size = "md",
  max,
  overlap = 0.3,
  className,
  children,
  ...props
}: ForenAvatarGroupProps) {
  const arr = React.Children.toArray(children);
  const visible = max != null ? arr.slice(0, max) : arr;
  const hidden = max != null ? Math.max(arr.length - max, 0) : 0;
  const m = meta[size];
  const offset = -Math.round(m.px * overlap);
  return (
    <div className={cn("inline-flex items-center", className)} {...props}>
      {visible.map((child, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            marginLeft: i === 0 ? 0 : offset,
            boxShadow: `0 0 0 2px var(--color-foren-bg-default)`,
          }}
        >
          {React.isValidElement<ForenAvatarProps>(child)
            ? React.cloneElement(child, { size })
            : child}
        </span>
      ))}
      {hidden > 0 && (
        <span
          className="rounded-full"
          style={{ marginLeft: offset, boxShadow: `0 0 0 2px var(--color-foren-bg-default)` }}
        >
          <ForenAvatar size={size} tone="muted" initials={`+${hidden}`} fallback="initials" />
        </span>
      )}
    </div>
  );
}