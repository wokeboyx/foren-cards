import { cva, type VariantProps } from "class-variance-authority";

export const avatarVariants = cva(
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
  },
);
export const innerBgVariants = cva(
  "absolute inset-0 rounded-full flex items-center justify-center overflow-hidden font-medium tracking-[0.01em]",
  {
    variants: {
      tone: {
        dark: "bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]",
        muted:
          "bg-[var(--color-foren-bg-subtle)] text-[var(--color-foren-text-secondary)]",
      },
    },
    defaultVariants: { tone: "dark" },
  },
);
export type AvatarSize = NonNullable<
  VariantProps<typeof avatarVariants>["size"]
>;
export type AvatarTone = NonNullable<
  VariantProps<typeof innerBgVariants>["tone"]
>;
export type AvatarStatus = "online" | "away" | "busy" | "offline";

export function initialsFromName(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
// Visual proportions per avatar size — status dot + person icon scale with the avatar.
export const avatarMeta: Record<
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
export const statusColor: Record<AvatarStatus, string> = {
  online: "var(--color-foren-success)",
  away: "var(--color-foren-warning)",
  busy: "var(--color-foren-error)",
  offline: "var(--color-foren-text-tertiary)",
};
