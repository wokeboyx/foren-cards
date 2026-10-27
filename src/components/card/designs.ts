import type { CardDesign } from "@/domain/types";

// Card artwork built only from Foren palette primitives. `text` must keep ≥ 4.5:1 contrast
// against every stop — enforced by tests/unit/contrast.test.ts.
export const DESIGNS: Record<CardDesign, { stops: string[]; text: string; muted: string; pattern: "rings" | "grid" | "waves" | "none" }> = {
  midnight: { stops: ["#241c15", "#17120d", "#090705"], text: "#f4f4f3", muted: "#b2b0ad", pattern: "rings" },
  skyline: { stops: ["#296092", "#1c476f", "#102e4c"], text: "#fdfeff", muted: "#d2e7f7", pattern: "waves" },
  aurora: { stops: ["#5d4fc9", "#55526e", "#323141"], text: "#fdfeff", muted: "#e9e7fd", pattern: "rings" },
  cream: { stops: ["#fffbe2", "#fff1a8", "#ffe660"], text: "#241c15", muted: "#544e48", pattern: "grid" },
  lime: { stops: ["#f9fee7", "#ecfcb5", "#dcf978"], text: "#241c15", muted: "#544e48", pattern: "waves" },
  titanium: { stops: ["#fbfbfb", "#ededed", "#d8d6d5"], text: "#241c15", muted: "#544e48", pattern: "grid" },
};

/** Emergency cards must never look like a normal reusable card. */
export const EMERGENCY = { stops: ["#fef3c7", "#fef3c7"], text: "#241c15", stripe: "#b45309" };
