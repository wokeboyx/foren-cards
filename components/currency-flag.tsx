import Image from "next/image";
import type { Currency } from "@/domain/types";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/base-path";

const PNG: Partial<Record<Currency, string>> = { USD: asset("/foren/wallet/flag-usd.png"), GBP: asset("/foren/wallet/flag-gbp.png"), CAD: asset("/foren/wallet/flag-cad.png") };

/** Round currency flag. Decorative: the currency is always named next to it. */
export function CurrencyFlag({ currency, size = 24, className }: { currency: Currency; size?: number; className?: string }) {
  const box = cn("inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-black/10", className);
  const png = PNG[currency];
  if (png) return <Image src={png} alt="" width={size} height={size} className={box} aria-hidden />;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={box} aria-hidden>
      {currency === "NGN" ? (
        <>
          <rect width="8" height="24" fill="#008751" />
          <rect x="8" width="8" height="24" fill="#ffffff" />
          <rect x="16" width="8" height="24" fill="#008751" />
        </>
      ) : (
        <>
          <rect width="24" height="24" fill="#003399" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return <circle key={i} cx={12 + 6.5 * Math.sin(a)} cy={12 - 6.5 * Math.cos(a)} r="1" fill="#ffcc00" />;
          })}
        </>
      )}
    </svg>
  );
}
