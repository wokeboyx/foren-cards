import { RiSnowflakeLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import type { Card } from "@/domain/types";
import { DESIGNS, EMERGENCY } from "./designs";

type Props = {
  card: Pick<Card, "design" | "nickname" | "last4" | "kind" | "status">;
  holderName?: string;
  merchantName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Shown under the nickname when there's no merchant yet, e.g. "Locks to first merchant". */
  lockText?: string;
  /** Wise-style: a frozen card shows a centred snowflake and "Frozen" over the art. */
  frozenOverlay?: boolean;
};

const SIZE = {
  xs: "w-12 rounded-[6px]",
  sm: "w-[72px] rounded-[8px]",
  md: "w-[280px] max-w-full rounded-[16px]",
  lg: "w-[340px] max-w-full rounded-[20px]",
};

/** Card artwork. Test data only — never renders a full card number. */
export function CardArt({ card, holderName, merchantName, size = "md", className, frozenOverlay, lockText }: Props) {
  const emergency = card.kind === "emergency";
  const d = DESIGNS[card.design];
  const text = emergency ? EMERGENCY.text : d.text;
  const muted = emergency ? EMERGENCY.text : d.muted;
  const small = size === "xs" || size === "sm";
  const dim = card.status === "canceled" || card.status === "frozen";

  return (
    <div
      role="img"
      aria-label={`${card.nickname} card ending ${card.last4}${emergency ? ", emergency card" : ""}`}
      className={cn("relative isolate aspect-[1.586] shrink-0 overflow-hidden shadow-[var(--shadow-foren-sm)]", SIZE[size], className)}
      style={{
        background: emergency
          ? `repeating-linear-gradient(135deg, ${EMERGENCY.stops[0]} 0 14px, color-mix(in srgb, ${EMERGENCY.stripe} 14%, ${EMERGENCY.stops[0]}) 14px 28px)`
          : `linear-gradient(135deg, ${d.stops.join(", ")})`,
        color: text,
        border: emergency ? `2px dashed ${EMERGENCY.stripe}` : undefined,
      }}
    >
      {!emergency && <Pattern kind={d.pattern} color={text} />}
      {dim && <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgba(255,255,255,0.18)_6px_8px)]" aria-hidden />}
      {frozenOverlay && card.status === "frozen" && !small && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-white/55 text-[#241c15] backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-1">
            <RiSnowflakeLine className="size-8" aria-hidden />
            <span className="text-[14px] font-semibold">Frozen</span>
          </div>
        </div>
      )}
      {!small && (
        <div className="relative z-10 flex h-full flex-col justify-between p-[7%]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {emergency ? (
                <span className="inline-flex items-center rounded-full bg-[#b45309] px-2 py-0.5 text-[11px] font-bold tracking-[0.08em] text-white uppercase">
                  Emergency · single use
                </span>
              ) : (
                <span className="block truncate text-[14px] font-semibold tracking-[0.01em]">{card.nickname}</span>
              )}
              {(merchantName || lockText) && (
                <span className="mt-0.5 block truncate text-[12px] font-medium" style={{ color: muted }}>
                  {merchantName ? `Locked to ${merchantName}` : lockText}
                </span>
              )}
            </div>
            <ForenMark color={text} />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              {holderName && (
                <span className="block truncate text-[12px] font-medium uppercase tracking-[0.06em]" style={{ color: muted }}>
                  {holderName}
                </span>
              )}
              <span className="tnum text-[16px] font-semibold tracking-[0.12em]">{card.last4 ? `•••• ${card.last4}` : "Requested"}</span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: muted }}>
              Virtual
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ForenMark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.6" opacity="0.9" />
      <path d="M9 7.5h6.5M9 7.5v9M9 12h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Pattern({ kind, color }: { kind: "rings" | "grid" | "waves" | "none"; color: string }) {
  if (kind === "none") return null;
  return (
    <svg className="absolute inset-0 -z-0 h-full w-full opacity-[0.09]" viewBox="0 0 340 214" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {kind === "rings" &&
        [40, 80, 120, 160, 200].map((r) => <circle key={r} cx="320" cy="-10" r={r} fill="none" stroke={color} strokeWidth="1.2" />)}
      {kind === "grid" &&
        Array.from({ length: 14 }).map((_, i) => <line key={i} x1={i * 26} y1="0" x2={i * 26 - 60} y2="214" stroke={color} strokeWidth="1" />)}
      {kind === "waves" &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M0 ${130 + i * 16} C 90 ${100 + i * 16}, 200 ${170 + i * 16}, 340 ${120 + i * 16}`} fill="none" stroke={color} strokeWidth="1.2" />
        ))}
    </svg>
  );
}
