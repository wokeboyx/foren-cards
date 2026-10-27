import { asset } from "@/lib/base-path";

/* ---------------------------------------------------------------------------
 * Geometry
 *
 * Every path below is exported Figma vector data or a value computed from it —
 * nothing here is eyeballed. The pocket's clip-path uses `path()`, which takes
 * absolute user units and ignores the element's size, so the panel must render
 * at exactly 365x172 and the wallet is fixed at 356x306.
 * ------------------------------------------------------------------------- */
export const WALLET_WIDTH = 356;
export const WALLET_HEIGHT = 306;
export const WALLET_RADIUS = 32;
/** The leather artwork is a 356x356 square anchored to the bottom, top 50px cropped. */
export const HIDE_SIZE = 356;
export const PANEL_WIDTH = 365;
export const PANEL_HEIGHT = 172;
/** Where the pocket's centre tab sits, from the wallet's top edge. */
export const POCKET_TOP = WALLET_HEIGHT - PANEL_HEIGHT; // 134
/** The panel's left edge in wallet space — negative, it is 9px wider and centred. */
export const PANEL_X = (WALLET_WIDTH - PANEL_WIDTH) / 2; // -4.5
/** One light source for the whole object, in CSS gradient degrees. */
export const LIGHT_ANGLE_DEG = 112;
/** Figma node 2425:149706 — the pocket outline, a rounded panel with a raised centre tab. */
export const NOTCH_PATH =
  "M304.232 0C311.327 0 317.142 5.30708 321.329 11.034C326.574 18.2076 335.052 22.8672 344.619 22.8672H350C358.284 22.8672 365 29.5829 365 37.8672V157C365 165.284 358.284 172 350 172H15C6.71574 172 0 165.284 0 157V37.8672C0 29.5829 6.71573 22.8672 15 22.8672H20.3809C29.9479 22.8672 38.4264 18.2076 43.6709 11.034C47.8578 5.30708 53.6734 0 60.7676 0H304.232Z";
/** NOTCH_PATH's top contour alone — sides and bottom omitted. */
export const TOP_CONTOUR_PATH =
  "M0 37.8672C0 29.5829 6.71573 22.8672 15 22.8672L20.3809 22.8672C29.9479 22.8672 38.4264 18.2076 43.6709 11.034C47.8578 5.30708 53.6734 0 60.7676 0L304.232 0C311.327 0 317.142 5.30708 321.329 11.034C326.574 18.2076 335.052 22.8672 344.619 22.8672L350 22.8672C358.284 22.8672 365 29.5829 365 37.8672";
/**
 * Pocket topstitch: a true 6px inward parallel offset of TOP_CONTOUR_PATH,
 * computed as a normal offset rather than a vertical shift — the shoulders run
 * at ~54deg, where a shift would pinch the inset to ~5.9px. Verified at
 * 6px +/- 0.05px along its length.
 *
 * The end arcs are then split (de Casteljau) at panel x = 10.5 and 354.5, which
 * is wallet x = 6 and 350 — the perimeter seam's verticals — so the two seams
 * meet in a T-junction instead of this one running off the wallet's edge.
 */
export const STITCH_PATH =
  "M10.5 30.106C11.827 29.326 13.366 28.874 15 28.867L20.381 28.867C31.449 28.84 41.962 23.494 48.515 14.575C51.353 10.702 55.539 6.02 60.768 6L304.232 6C309.461 6.02 313.647 10.702 316.485 14.575C323.038 23.494 333.551 28.84 344.619 28.867L350 28.867C351.634 28.874 353.172 29.326 354.5 30.107";
/**
 * Perimeter seam, closed around all four edges at the same 6px inset. Runs
 * across the top too: the back panel is two plies sewn together, so it carries
 * a seam even where the pocket does not reach.
 *
 * Unlike the pocket contour this offset is exact rather than fitted — the
 * parallel offset of a rounded rectangle is the same rectangle with the radius
 * reduced by the inset (32 - 6 = 26).
 */
export const WALLET_STITCH_PATH =
  "M32 6H324A26 26 0 0 1 350 32V274A26 26 0 0 1 324 300H32A26 26 0 0 1 6 274V32A26 26 0 0 1 32 6Z";
/** Foren mark, Figma node 2435:149872. */
export const MARK_PATH =
  "M17 0V4.29171H6.94577L4.48373 0H17ZM8.98653 17.1645H4.57149L4.20669 15.7946L3.429 12.8736L2.28575 8.58264L1.14325 4.29171L0 0H4.4158L5.55829 4.29171L6.70079 8.58264L7.84404 12.8736L8.47138 15.2302L8.98653 17.1645ZM10.5198 5.43969C12.04 5.43969 13.2741 6.68144 13.2741 8.21099C13.2741 9.74054 12.04 10.9823 10.5198 10.9823C8.99958 10.9823 7.76543 9.74054 7.76543 8.21099C7.76543 6.68144 8.99958 5.43969 10.5198 5.43969Z";
/** Trailing arrow on the pill, Figma node 2425:149722. */
export const CARET_PATH =
  "M8.16385e-05 4.29559L0 3.12898H9.43361L7.12962 0.824956L7.95457 0L11.6669 3.71232L7.95457 7.42465L7.12962 6.59964L9.43367 4.29565L8.16385e-05 4.29559Z";
export const MARK_INSET = 24;
/* Card metrics — ISO/IEC 7810 ID-1 (85.60 x 53.98mm, 1.586:1), radius scaled
   from the same spec (3.18mm / 85.60mm). */
export const CARD_WIDTH = 316;
export const CARD_HEIGHT = Math.round(CARD_WIDTH / 1.586); // 199
export const CARD_RADIUS = +((CARD_WIDTH * 3.18) / 85.6).toFixed(2); // 11.74
/**
 * How far the front card stands proud of the centre tab. Must clear its content
 * row — a 14px inset plus a 21px line — so 40 leaves 5px before the pocket edge.
 */
export const CARD_PEEK = 40;
export const CARD_TOP = POCKET_TOP - CARD_PEEK; // 94
/**
 * How much higher each card sits than the one in front. 43px is what makes each
 * card's flag-and-balance row visible.
 *
 * This is why the wallet shows at most three cards: there are 134px from the
 * wallet's top edge to the pocket, and 2 x 43 of stacking plus a 35px content
 * row consumes 121 of them.
 */
export const CARD_STACK_STEP = 43;
export const MAX_VISIBLE = 3;
export const HEADER_WIDTH = 220;
export const HEADER_HEIGHT = 80;
/** Centred on the pocket face — the wallet's own midpoint falls among the cards. */
export const HEADER_TOP = POCKET_TOP + (PANEL_HEIGHT - HEADER_HEIGHT) / 2 + 16; // 196
/** The empty block is taller (two-line subtitle), so it uses Figma's own offset. */
export const EMPTY_HEADER_TOP = POCKET_TOP + 25; // 159
export const ASSETS = asset("/foren/wallet");
/* ---------------------------------------------------------------------------
 * Material
 * ------------------------------------------------------------------------- */
export const BACK_PANEL_LIGHT = [
  "radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,0.055), rgba(255,255,255,0) 55%)",
  "radial-gradient(135% 115% at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.32) 100%)",
  "linear-gradient(to bottom, rgba(0,0,0,0.46), rgba(0,0,0,0.60) 60%, rgba(0,0,0,0.68))",
].join(",");
export const SHEEN = `linear-gradient(${LIGHT_ANGLE_DEG}deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.055) 37%, rgba(255,255,255,0.016) 50%, rgba(255,255,255,0) 63%)`;
export const PERIMETER = [
  "inset 0 1px 0 rgba(255,255,255,0.10)",
  "inset 0 -1px 0 rgba(0,0,0,0.55)",
  "inset 0 0 0 1px rgba(255,255,255,0.045)",
].join(",");
/**
 * The pocket swelling around whatever is behind it. Two crossed gradients, not a
 * radial blob — the cards are a hard-edged rectangle, so the leather lifts
 * across their full width and drops away just outside it. Stops are the card
 * footprint in panel space: 6.7%-93.3% across, 92.4% down.
 */
export const BULGE = [
  "linear-gradient(to right, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 6.7%, rgba(255,255,255,0.045) 22%, rgba(255,255,255,0.045) 78%, rgba(0,0,0,0) 93.3%, rgba(0,0,0,0.20) 100%)",
  "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.028) 80%, rgba(0,0,0,0.16) 92.4%, rgba(0,0,0,0.24) 100%)",
].join(",");
/** Creases from the shoulders, where the leather is worked as cards pass. */
export const CREASES = [
  "M38 26C44 34 52 40 62 44",
  "M31 31C35 41 41 49 49 55",
  "M327 26C321 34 313 40 303 44",
  "M334 31C330 41 324 49 316 55",
];
export const CARD_DEPTH = [
  "0 0 8px 0 rgba(0,0,0,0.5)",
  "0 6px 12px rgba(0,0,0,0.45)",
  "inset 0 1px 0 rgba(255,255,255,0.85)",
  "inset 0 -1px 0 rgba(0,0,0,0.25)",
].join(",");
/** Five stops for the metal body, light to dark and back. */
export type ForenMetalStops = readonly [string, string, string, string, string];
/**
 * Champagne gold, periwinkle chrome, blue steel — indexed front to back, to
 * match the order of `accounts`.
 */
export const DEFAULT_METALS: ForenMetalStops[] = [
  ["#faf5e4", "#d8c68c", "#fdf9ee", "#bda65e", "#e9dcb4"],
  ["#f0eefc", "#c2bbe6", "#f5f3fe", "#a79fd4", "#dbd6f1"],
  ["#eef3f9", "#bccadb", "#f3f7fc", "#a3b4c9", "#d4dde9"],
];
export function metalFace(stops: ForenMetalStops) {
  return [
    `linear-gradient(${LIGHT_ANGLE_DEG}deg, rgba(255,255,255,0) 26%, rgba(255,255,255,0.50) 43%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 63%)`,
    // Four brushing passes at co-prime periods (3/5/11/17px). Combined period is
    // 2805px, far longer than the card, so the finish never visibly repeats.
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0.035) 1px, rgba(0,0,0,0.035) 3px)",
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 5px)",
    "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 11px)",
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 17px)",
    `linear-gradient(158deg, ${stops[0]} 0%, ${stops[1]} 26%, ${stops[2]} 48%, ${stops[3]} 72%, ${stops[4]} 100%)`,
  ].join(",");
}
/**
 * Deliberately uneven, and sums to 47.9 — a length that divides neither seam
 * path, so the stitch never visibly tiles.
 */
export const STITCH_DASH = "7 5 6.5 5.4 7.4 4.7 6.7 5.2";
export type ForenAccount = {
  /** e.g. "CAD account balance". */
  label: string;
  /** Pre-formatted, including the currency symbol. */
  amount: string;
  /** Path to a flag image. Decorative — the label names the currency. */
  flagSrc: string;
  /** Overrides the default alloy for this position. */
  metal?: ForenMetalStops;
};
export const LIFT = 14;
/** A fresh angle each hover, 1.0-2.4deg either way, so it never repeats. */
export function randomTilt() {
  const magnitude = 1 + Math.random() * 1.4;
  return Math.random() < 0.5 ? -magnitude : magnitude;
}
/** Resting angles, front to back. Perfect seating is the strongest CG tell. */
export const REST_TILTS = [0.5, -0.4, 0.85];
