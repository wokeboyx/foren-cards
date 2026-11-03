// Foren Table — synced from Figma (node 572:2).
//
// Four modular building blocks compose into any table layout:
//   ForenTable            the bordered container + <table>
//   ForenTableHeaderCell  uppercase label + optional sort control
//   ForenTableRow         a <tr> with the divider baked in
//   ForenTableCell        13 cell types, each built from a real Foren component
//   ForenTablePagination  compact footer — item count + prev/page/next
//
// Semantics: real <table>/<thead>/<tbody>/<th>/<td>. The Figma frames are
// flex rows, but a data table needs row/column announcement and header
// association, so the markup is a table and the visual spec is preserved
// through the same paddings, heights and tokens.
import type { BadgeColor } from "./foren-badge";

export type ForenTableAlign = "left" | "right";

/** The 13 documented types, in Figma order. Handy for docs and pickers. */
export const FOREN_TABLE_CELL_TYPES = [
  "text",
  "badge",
  "tag",
  "progress",
  "trend",
  "amount",
  "date",
  "link",
  "button",
  "avatar",
  "toggle",
  "checkbox",
  "icon",
] as const;
export type ForenTableCellType =
  (typeof FOREN_TABLE_CELL_TYPES)[number] | "custom";

export type ForenTablePerson = {
  initials?: string;
  src?: string;
  name?: string;
};
export type ForenTableCellBadge = {
  label: string;
  color?: BadgeColor;
  dot?: boolean;
};

export const CELL_TITLE =
  "text-[14px] font-medium leading-[21px] tracking-[0.01em] text-[var(--color-foren-text-primary)]";
export const CELL_SUB =
  "text-[12px] font-medium leading-[18px] tracking-[0.01em] text-[var(--color-foren-text-tertiary)]";

/** Cells whose width is fixed by the control they hold. */
export const FIXED_WIDTH: Partial<Record<ForenTableCellType, number>> = {
  checkbox: 48,
  icon: 48,
  toggle: 64,
};

export function inferDirection(value: unknown): "up" | "down" | "flat" {
  if (typeof value === "string") {
    if (value.trim().startsWith("-")) return "down";
    if (value.trim().startsWith("+")) return "up";
  }
  if (typeof value === "number")
    return value < 0 ? "down" : value > 0 ? "up" : "flat";
  return "up";
}

export const cssSize = (v: number | string) =>
  typeof v === "number" ? `${v}px` : v;

/* Pagination — Figma component set 556:98, 3 layouts × 3 sizes */
export type ForenPaginationLayout = "compact" | "desktop" | "mobile";
export type ForenPaginationSize = "sm" | "md" | "lg";

/**
 * Per-size geometry, read off the nine variants.
 *   control  nav + page button square (28 / 36 / 44)
 *   icon     chevron (12 / 14 / 16)
 *   gap      desktop + mobile track spacing (4 / 6 / 8)
 *   navGap   compact's prev/position/next spacing (8 / 12 / 16)
 *   height   compact bar height (36 / 44 / 52)
 */
export const PAGINATION_SIZES = {
  sm: {
    control: 28,
    icon: 12,
    gap: 4,
    navGap: 8,
    height: 36,
    text: "text-[12px] leading-[18px] tracking-[0.01em]",
  },
  md: {
    control: 36,
    icon: 14,
    gap: 6,
    navGap: 12,
    height: 44,
    text: "text-[14px] leading-[21px] tracking-[0.01em]",
  },
  lg: {
    control: 44,
    icon: 16,
    gap: 8,
    navGap: 16,
    height: 52,
    text: "text-[16px] leading-[24px] tracking-[0.005em]",
  },
} as const;

/**
 * Builds the desktop button list. Reproduces the design's [1,2,3,…,8,9,10]
 * at the edges, and brackets the current page when it sits in the middle.
 */
export function buildPages(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 3 || page >= pageCount - 2)
    return [1, 2, 3, null, pageCount - 2, pageCount - 1, pageCount];
  return [1, null, page - 1, page, page + 1, null, pageCount];
}
