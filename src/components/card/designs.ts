import type { CardDesign } from "@/domain/types";

/**
 * The six card skins from the Foren Mobile Figma ("Card face": Ink, Silver, Cobalt, Clay, Chalk, Lime), exact values.
 * The card is drawn on a 353 × 223 canvas; every position and size below is in those units (see CardArt).
 */
export type Skin = {
  /** The card body as CSS: a 147.7° gradient (Silver adds a sheen layer on top). */
  background: string;
  /** Gradient end colours, for the contrast test (tests/unit/contrast.test.ts). */
  stops: string[];
  /** Text on the card: the nickname is this at 92%, the number and "Debit" are solid. */
  text: string;
  /** Nickname colour (text at 92%). */
  muted: string;
  /** The "Virtual" / "Frozen" chip. */
  pill: { bg: string; text: string };
  /** Decoration: concentric rings, two circles, vertical stripes, a disc, or nothing (Silver's sheen is in the gradient). */
  art: "rings-right" | "rings-left" | "circles" | "stripes" | "disc" | "none";
  /** Colour of the decoration. */
  artColor: string;
  /** Lighter skins get a stronger frost when frozen. */
  light: boolean;
};

const grad = (a: string, b: string, mid?: string) =>
  `linear-gradient(147.718deg, ${a} 0%, ${mid ? `${mid} 55%, ` : ""}${b} 100%)`;

export const DESIGNS: Record<CardDesign, Skin> = {
  ink: {
    background: grad("rgb(42, 37, 32)", "rgb(21, 18, 15)"),
    stops: ["#2a2520", "#15120f"],
    text: "#f4efe8",
    muted: "rgba(244,239,232,0.92)",
    pill: { bg: "rgba(244,239,232,0.12)", text: "#f4efe8" },
    art: "rings-right",
    artColor: "rgba(244,239,232,0.07)",
    light: false,
  },
  silver: {
    background: `linear-gradient(124.704deg, rgba(255,255,255,0) 4.35%, rgba(255,255,255,0.55) 45.22%, rgba(255,255,255,0) 56.52%), ${grad("rgb(236, 235, 231)", "rgb(169, 165, 158)", "rgb(195, 192, 186)")}`,
    stops: ["#ecebe7", "#c3c0ba", "#a9a59e"],
    text: "#1b1815",
    muted: "rgba(27,24,21,0.92)",
    pill: { bg: "rgba(27,24,21,0.08)", text: "#1b1815" },
    art: "none",
    artColor: "transparent",
    light: true,
  },
  cobalt: {
    background: grad("rgb(52, 80, 240)", "rgb(35, 56, 201)"),
    stops: ["#3450f0", "#2338c9"],
    text: "#ffffff",
    muted: "rgba(255,255,255,0.92)",
    pill: { bg: "rgba(255,255,255,0.12)", text: "#ffffff" },
    art: "circles",
    artColor: "#5b74ff",
    light: false,
  },
  clay: {
    background: grad("rgb(207, 95, 51)", "rgb(178, 74, 36)"),
    stops: ["#cf5f33", "#b24a24"],
    text: "#ffffff",
    muted: "rgba(255,255,255,0.92)",
    pill: { bg: "rgba(255,255,255,0.12)", text: "#ffffff" },
    art: "stripes",
    artColor: "rgba(255,255,255,0.05)",
    light: false,
  },
  chalk: {
    background: grad("rgb(247, 244, 239)", "rgb(231, 226, 217)"),
    stops: ["#f7f4ef", "#e7e2d9"],
    text: "#24201c",
    muted: "rgba(36,32,28,0.92)",
    pill: { bg: "rgba(36,32,28,0.08)", text: "#24201c" },
    art: "rings-left",
    artColor: "rgba(36,32,28,0.07)",
    light: true,
  },
  lime: {
    background: grad("rgb(220, 243, 106)", "rgb(198, 230, 74)"),
    stops: ["#dcf36a", "#c6e64a"],
    text: "#1c1f0e",
    muted: "rgba(28,31,14,0.92)",
    pill: { bg: "rgba(28,31,14,0.08)", text: "#1c1f0e" },
    art: "disc",
    artColor: "rgba(232,250,126,0.42)",
    light: true,
  },
};

/** Names from the other Figma palette (Skyline, Midnight, Aurora, Cream, Titanium) that may be saved in the browser map back to these six. */
const LEGACY: Record<string, CardDesign> = {
  midnight: "ink",
  titanium: "silver",
  skyline: "cobalt",
  cream: "clay",
  aurora: "chalk",
};

export const skinOf = (design: string): Skin =>
  DESIGNS[design as CardDesign] ?? DESIGNS[LEGACY[design]] ?? DESIGNS.ink;

/** The card body as a CSS background (swatches use this too). */
export const skinBackground = (design: CardDesign) => skinOf(design).background;

/** Emergency cards must never look like a normal reusable card. */
export const EMERGENCY = {
  stops: ["#fef3c7", "#fef3c7"],
  text: "#241c15",
  stripe: "#b45309",
};
