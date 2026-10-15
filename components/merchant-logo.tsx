import type { Merchant } from "@/domain/types";
import { cn } from "@/lib/utils";

/** Letter tile standing in for a merchant logo (prototype has no licensed logo assets). */
export function MerchantLogo({ merchant, size = 36, className }: { merchant?: Merchant; size?: number; className?: string }) {
  if (!merchant)
    return <span aria-hidden className={cn("inline-grid shrink-0 place-items-center rounded-full bg-subtle text-fg-3", className)} style={{ width: size, height: size }} />;
  const text = contrast("#ffffff", merchant.tint) >= contrast("#241c15", merchant.tint) ? "#ffffff" : "#241c15";
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-[0.01em]", className)}
      style={{ width: size, height: size, background: merchant.tint, color: text, fontSize: Math.round(size * 0.36) }}
    >
      {merchant.mark}
    </span>
  );
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio — pick whichever letter colour reads best on the brand tint. */
function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
