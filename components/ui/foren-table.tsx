"use client";
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
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  RiArrowLeftSLine,
  RiArrowRightDownLine,
  RiArrowRightSLine,
  RiArrowRightUpLine,
  RiCalendarLine,
  RiExpandUpDownLine,
  RiSubtractLine,
} from "@remixicon/react";
import { ForenBadge, type BadgeColor } from "./foren-badge";
import { ForenTag, tagVariants } from "./foren-tag";
import { ForenProgress } from "./foren-progress";
import { ForenAvatar, ForenAvatarGroup } from "./foren-avatar";
import { ForenCheckbox } from "./foren-checkbox";
import { ForenToggle } from "./foren-toggle";
import { ForenButton } from "./foren-button";
export type ForenTableAlign = "left" | "right";
/* -------------------------------------------------------------------------- */
/* Container                                                                  */
/* -------------------------------------------------------------------------- */
export interface ForenTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rendered below the table, inside the same bordered shell — usually <ForenTablePagination />. */
  footer?: React.ReactNode;
  /** Accessible name for the table. */
  caption?: React.ReactNode;
  /** Visually hide the caption but keep it for screen readers. Default true. */
  hideCaption?: boolean;
  /** Minimum table width before the container scrolls horizontally. */
  minWidth?: number | string;
  children: React.ReactNode;
}
export function ForenTable({
  footer,
  caption,
  hideCaption = true,
  minWidth = 640,
  className,
  children,
  ...props
}: ForenTableProps) {
  return (
    <div
      // No outer stroke — the design frame is rounded and clipped, and the only
      // 1px rules are the horizontal dividers between header, rows and footer.
      // Pass a border through className if a surrounding surface needs one.
      // rounded-lg is the project's 12px step, matching the design frame.
      className={cn(
        "overflow-hidden rounded-lg bg-[var(--color-foren-bg-default)]",
        className
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth }}
        >
          {caption && (
            <caption
              className={
                hideCaption
                  ? "sr-only"
                  : "px-4 py-3 text-left text-[13px] text-[var(--color-foren-text-secondary)]"
              }
            >
              {caption}
            </caption>
          )}
          {children}
        </table>
      </div>
      {footer && (
        <div className="border-t border-[var(--color-foren-border-muted)]">{footer}</div>
      )}
    </div>
  );
}
export function ForenTableHead({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-[var(--color-foren-border-muted)]", className)}
      {...props}
    >
      {children}
    </thead>
  );
}
export function ForenTableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}
/* -------------------------------------------------------------------------- */
/* Header cell                                                                */
/* -------------------------------------------------------------------------- */
export interface ForenTableHeaderCellProps
  extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "align" | "children"> {
  label?: React.ReactNode;
  align?: ForenTableAlign;
  /** Show the expand-up-down sort affordance and make the label a button. */
  sortable?: boolean;
  /** Current sort state. Drives aria-sort and the icon tint. */
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
  /** Leading select-all checkbox. */
  checkbox?: boolean;
  checked?: boolean | "indeterminate";
  onCheckedChange?: (next: boolean | "indeterminate") => void;
  width?: number | string;
  children?: React.ReactNode;
}
export function ForenTableHeaderCell({
  label,
  align = "left",
  sortable = false,
  sortDirection = null,
  onSort,
  checkbox = false,
  checked,
  onCheckedChange,
  width,
  className,
  children,
  ...props
}: ForenTableHeaderCellProps) {
  const text = (
    <span className="text-[12px] font-semibold leading-[18px] tracking-[0.01em] whitespace-nowrap text-[var(--color-foren-text-tertiary)] uppercase">
      {label ?? children}
    </span>
  );
  return (
    <th
      scope="col"
      aria-sort={
        sortable
          ? sortDirection === "asc"
            ? "ascending"
            : sortDirection === "desc"
              ? "descending"
              : "none"
          : undefined
      }
      style={width != null ? { width: typeof width === "number" ? `${width}px` : width } : undefined}
      className={cn("h-11 px-4 align-middle font-normal", className)}
      {...props}
    >
      <div
        className={cn(
          "flex items-center gap-1",
          align === "right" ? "justify-end" : "justify-start"
        )}
      >
        {checkbox && (
          <ForenCheckbox
            size="sm"
            checked={checked}
            onCheckedChange={onCheckedChange}
            aria-label="Select all rows"
            className="mr-1"
          />
        )}
        {sortable ? (
          <button
            type="button"
            onClick={onSort}
            className="group/sort inline-flex cursor-pointer items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)]"
          >
            {text}
            <RiExpandUpDownLine
              aria-hidden
              className={cn(
                "size-3 shrink-0 transition-colors",
                sortDirection
                  ? "text-[var(--color-foren-text-primary)]"
                  : "text-[var(--color-foren-text-tertiary)] group-hover/sort:text-[var(--color-foren-text-secondary)]"
              )}
            />
          </button>
        ) : (
          text
        )}
      </div>
    </th>
  );
}
/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */
export interface ForenTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Selected rows tint and keep the tint on hover. */
  selected?: boolean;
  /** Adds the hover tint and a pointer cursor. Implied by onClick. */
  interactive?: boolean;
  /** Drop the bottom divider — use on the last row when a footer follows. */
  last?: boolean;
}
export function ForenTableRow({
  selected = false,
  interactive,
  last = false,
  className,
  children,
  onClick,
  ...props
}: ForenTableRowProps) {
  const isInteractive = interactive ?? Boolean(onClick);
  return (
    <tr
      onClick={onClick}
      className={cn(
        "h-16 transition-colors duration-150",
        !last && "border-b border-[var(--color-foren-border-muted)]",
        selected
          ? "bg-[var(--color-foren-bg-subtle)]"
          : isInteractive && "hover:bg-[var(--color-foren-bg-sunken)]",
        isInteractive && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}
/* -------------------------------------------------------------------------- */
/* Cell                                                                       */
/* -------------------------------------------------------------------------- */
type CellBase = {
  align?: ForenTableAlign;
  className?: string;
  width?: number | string;
  colSpan?: number;
};
/** Text — the composable base. Every other type is a specialisation of it. */
type TextCell = CellBase & {
  type?: "text";
  label: React.ReactNode;
  /** Second line, 12px tertiary. */
  description?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** Inline badge after the label. */
  badge?: { label: React.ReactNode; color?: BadgeColor; dot?: boolean };
  /** Row-selection checkbox ahead of the content. */
  checkbox?: boolean;
  checked?: boolean | "indeterminate";
  onCheckedChange?: (next: boolean | "indeterminate") => void;
  /** Leading avatar. Pass initials or an image src. */
  avatar?: { initials?: string; src?: string; name?: string };
};
type BadgeCell = CellBase & {
  type: "badge";
  label: React.ReactNode;
  color?: BadgeColor;
  dot?: boolean;
  leadingIcon?: React.ReactNode;
};
type TagCell = CellBase & {
  type: "tag";
  label: React.ReactNode;
  leadingIcon?: React.ReactNode;
  /** Overflow count rendered after the chip, e.g. "+2". */
  count?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
};
type ProgressCell = CellBase & {
  type: "progress";
  value: number;
  max?: number;
  /** Show the numeric value above the bar. Off in the Figma spec. */
  showValue?: boolean;
  barWidth?: number | string;
};
type TrendCell = CellBase & {
  type: "trend";
  value: React.ReactNode;
  /** Inferred from a leading +/- on a string value when omitted. */
  direction?: "up" | "down" | "flat";
};
type AmountCell = CellBase & {
  type: "amount";
  value: React.ReactNode;
  /** Second line — currency code or unit. */
  currency?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};
type DateCell = CellBase & {
  type: "date";
  date: React.ReactNode;
  /** Second line. */
  time?: React.ReactNode;
  /** Calendar glyph ahead of the date. Default true. */
  showIcon?: boolean;
  trailingIcon?: React.ReactNode;
};
type LinkCell = CellBase & {
  type: "link";
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
};
type ButtonCell = CellBase & {
  type: "button";
  label: React.ReactNode;
  onClick?: () => void;
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
};
type AvatarCell = CellBase & {
  type: "avatar";
  people: { initials?: string; src?: string; name?: string }[];
  /** Avatars shown before collapsing. */
  max?: number;
  /** Overflow label after the stack, e.g. "+2". */
  count?: React.ReactNode;
};
type ToggleCell = CellBase & {
  type: "toggle";
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  disabled?: boolean;
  label: string;
};
type CheckboxCell = CellBase & {
  type: "checkbox";
  checked?: boolean | "indeterminate";
  onCheckedChange?: (next: boolean | "indeterminate") => void;
  disabled?: boolean;
  label: string;
};
type IconCell = CellBase & {
  type: "icon";
  icon: React.ReactNode;
  /** Makes the glyph a real button. Required for row actions. */
  onClick?: () => void;
  label?: string;
};
type CustomCell = CellBase & {
  type: "custom";
  children: React.ReactNode;
};
export type ForenTableCellProps =
  | TextCell
  | BadgeCell
  | TagCell
  | ProgressCell
  | TrendCell
  | AmountCell
  | DateCell
  | LinkCell
  | ButtonCell
  | AvatarCell
  | ToggleCell
  | CheckboxCell
  | IconCell
  | CustomCell;
export type ForenTableCellType = NonNullable<ForenTableCellProps["type"]>;
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
const TITLE = "text-[14px] font-medium leading-[21px] tracking-[0.01em] text-[var(--color-foren-text-primary)]";
const SUB = "text-[12px] font-medium leading-[18px] tracking-[0.01em] text-[var(--color-foren-text-tertiary)]";
/** Cells whose width is fixed by the control they hold. */
const FIXED_WIDTH: Partial<Record<ForenTableCellType, number>> = {
  checkbox: 48,
  icon: 48,
  toggle: 64,
};
function inferDirection(value: React.ReactNode): "up" | "down" | "flat" {
  if (typeof value === "string") {
    if (value.trim().startsWith("-")) return "down";
    if (value.trim().startsWith("+")) return "up";
  }
  if (typeof value === "number") return value < 0 ? "down" : value > 0 ? "up" : "flat";
  return "up";
}
export function ForenTableCell(props: ForenTableCellProps) {
  const { align = "left", className, width, colSpan } = props;
  const type = props.type ?? "text";
  const centered = type === "checkbox" || type === "icon" || type === "toggle";
  const resolvedWidth = width ?? FIXED_WIDTH[type];
  let content: React.ReactNode;
  let gap = "gap-2";
  switch (type) {
    case "badge": {
      const { label, color = "success", dot = true, leadingIcon } = props as BadgeCell;
      content = (
        <ForenBadge color={color} size="sm" dot={dot} leadingIcon={leadingIcon}>
          {label}
        </ForenBadge>
      );
      gap = "gap-0";
      break;
    }
    case "tag": {
      const { label, leadingIcon, count, selected, onClick } = props as TagCell;
      const padding = leadingIcon ? "leading" : "symmetric";
      const state = selected ? "selected" : "unselected";
      content = (
        <>
          {onClick ? (
            <ForenTag
              size="xs"
              padding={padding}
              leadingIcon={leadingIcon}
              selected={selected}
              onClick={onClick}
            >
              {label}
            </ForenTag>
          ) : (
            // Read-only chip. ForenTag renders a <button>, and a button that
            // does nothing is worse than a span — so borrow its variants and
            // keep the label in the accessibility tree.
            <span
              className={cn(
                tagVariants({ size: "xs", padding, state }),
                "cursor-default active:scale-100"
              )}
            >
              {leadingIcon}
              {label}
            </span>
          )}
          {count != null && <span className={cn(SUB, "shrink-0")}>{count}</span>}
        </>
      );
      break;
    }
    case "progress": {
      const { value, max = 100, showValue = false, barWidth = 140 } = props as ProgressCell;
      content = (
        <ForenProgress
          size="sm"
          value={value}
          max={max}
          hideValue={!showValue}
          className="shrink-0"
          style={{ width: typeof barWidth === "number" ? `${barWidth}px` : barWidth }}
        />
      );
      gap = "gap-0";
      break;
    }
    case "trend": {
      const { value, direction } = props as TrendCell;
      const dir = direction ?? inferDirection(value);
      const Icon =
        dir === "up" ? RiArrowRightUpLine : dir === "down" ? RiArrowRightDownLine : RiSubtractLine;
      const tint =
        dir === "up"
          ? "text-[var(--color-foren-success)]"
          : dir === "down"
            ? "text-[var(--color-foren-error)]"
            : "text-[var(--color-foren-text-tertiary)]";
      content = (
        <>
          <Icon aria-hidden className={cn("size-3.5 shrink-0", tint)} />
          <span
            className={cn(
              "text-[14px] font-medium leading-[21px] tracking-[0.01em] tabular-nums",
              tint
            )}
          >
            {value}
          </span>
        </>
      );
      gap = "gap-1";
      break;
    }
    case "amount": {
      const { value, currency, leadingIcon, trailingIcon } = props as AmountCell;
      content = (
        <>
          {leadingIcon && <IconSlot>{leadingIcon}</IconSlot>}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className={cn(TITLE, "tabular-nums")}>{value}</span>
            {currency != null && <span className={SUB}>{currency}</span>}
          </span>
          {trailingIcon && <IconSlot>{trailingIcon}</IconSlot>}
        </>
      );
      break;
    }
    case "date": {
      const { date, time, showIcon = true, trailingIcon } = props as DateCell;
      content = (
        <>
          {showIcon && (
            <IconSlot>
              <RiCalendarLine aria-hidden />
            </IconSlot>
          )}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className={cn(TITLE, "whitespace-nowrap")}>{date}</span>
            {time != null && <span className={cn(SUB, "tabular-nums")}>{time}</span>}
          </span>
          {trailingIcon && <IconSlot>{trailingIcon}</IconSlot>}
        </>
      );
      break;
    }
    case "link": {
      const { label, href, onClick } = props as LinkCell;
      // An href has to produce a real anchor — middle-click and "open in new
      // tab" are the whole point of a link cell. Without one, fall back to the
      // button's link variant so the visual stays identical either way.
      content = href ? (
        <a
          href={href}
          onClick={onClick}
          className="text-[14px] font-semibold leading-[21px] tracking-[0.0125em] text-[var(--color-foren-text-primary)] underline-offset-[3px] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)]"
        >
          {label}
        </a>
      ) : (
        <ForenButton variant="link" size="sm" onClick={onClick}>
          {label}
        </ForenButton>
      );
      gap = "gap-0";
      break;
    }
    case "button": {
      const { label, onClick, leadingIcon, disabled } = props as ButtonCell;
      content = (
        <ForenButton
          variant="outline"
          size="xs"
          onClick={onClick}
          leadingIcon={leadingIcon}
          disabled={disabled}
        >
          {label}
        </ForenButton>
      );
      gap = "gap-0";
      break;
    }
    case "avatar": {
      const { people, max = 3, count } = props as AvatarCell;
      content = (
        <>
          {/* overlap is a fraction of avatar size, not pixels — 1/3 of 24px
              reproduces the design's 8px tuck. */}
          <ForenAvatarGroup size="xs" max={max} overlap={1 / 3} className="shrink-0">
            {people.map((p, i) => (
              <ForenAvatar key={i} size="xs" initials={p.initials} src={p.src} name={p.name} />
            ))}
          </ForenAvatarGroup>
          {count != null && <span className={cn(SUB, "shrink-0")}>{count}</span>}
        </>
      );
      break;
    }
    case "toggle": {
      const { checked, defaultChecked, onCheckedChange, disabled, label } = props as ToggleCell;
      content = (
        <ForenToggle
          size="sm"
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-label={label}
        />
      );
      gap = "gap-0";
      break;
    }
    case "checkbox": {
      const { checked, onCheckedChange, disabled, label } = props as CheckboxCell;
      content = (
        <ForenCheckbox
          size="sm"
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-label={label}
        />
      );
      gap = "gap-0";
      break;
    }
    case "icon": {
      const { icon, onClick, label } = props as IconCell;
      content = onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={label ?? "Row actions"}
          className="grid size-8 cursor-pointer place-items-center rounded-md text-[var(--color-foren-text-tertiary)] outline-none transition-colors hover:bg-[var(--color-foren-bg-subtle)] hover:text-[var(--color-foren-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)] [&_svg]:size-4"
        >
          {icon}
        </button>
      ) : (
        <span
          aria-hidden
          className="grid size-4 place-items-center text-[var(--color-foren-text-tertiary)] [&_svg]:size-4"
        >
          {icon}
        </span>
      );
      gap = "gap-0";
      break;
    }
    case "custom": {
      content = (props as CustomCell).children;
      break;
    }
    default: {
      // text — the composable base
      const {
        label,
        description,
        leadingIcon,
        trailingIcon,
        badge,
        checkbox,
        checked,
        onCheckedChange,
        avatar,
      } = props as TextCell;
      content = (
        <>
          {checkbox && (
            <ForenCheckbox
              size="sm"
              checked={checked}
              onCheckedChange={onCheckedChange}
              aria-label="Select row"
              className="shrink-0"
            />
          )}
          {avatar && (
            <ForenAvatar
              size="xs"
              initials={avatar.initials}
              src={avatar.src}
              name={avatar.name}
              className="shrink-0"
            />
          )}
          {leadingIcon && <IconSlot>{leadingIcon}</IconSlot>}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <span className={cn(TITLE, "truncate")}>{label}</span>
              {badge && (
                <ForenBadge color={badge.color ?? "success"} size="sm" dot={badge.dot ?? true}>
                  {badge.label}
                </ForenBadge>
              )}
            </span>
            {description != null && <span className={cn(SUB, "truncate")}>{description}</span>}
          </span>
          {trailingIcon && <IconSlot>{trailingIcon}</IconSlot>}
        </>
      );
      break;
    }
  }
  return (
    <td
      colSpan={colSpan}
      style={
        resolvedWidth != null
          ? { width: typeof resolvedWidth === "number" ? `${resolvedWidth}px` : resolvedWidth }
          : undefined
      }
      className={cn("h-16 align-middle", centered ? "px-0" : "px-4", className)}
    >
      <div
        className={cn(
          "flex items-center",
          gap,
          centered ? "justify-center" : align === "right" ? "justify-end" : "justify-start"
        )}
      >
        {content}
      </div>
    </td>
  );
}
/** 16px square icon slot, tinted tertiary — matches the Figma icon frames. */
function IconSlot({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-4 shrink-0 place-items-center text-[var(--color-foren-text-tertiary)] [&_svg]:size-4">
      {children}
    </span>
  );
}
/* -------------------------------------------------------------------------- */
/* Pagination — Figma component set 556:98, 3 layouts × 3 sizes               */
/* -------------------------------------------------------------------------- */
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
const PAGINATION_SIZES = {
  sm: { control: 28, icon: 12, gap: 4, navGap: 8, height: 36, text: "text-[12px] leading-[18px] tracking-[0.01em]" },
  md: { control: 36, icon: 14, gap: 6, navGap: 12, height: 44, text: "text-[14px] leading-[21px] tracking-[0.01em]" },
  lg: { control: 44, icon: 16, gap: 8, navGap: 16, height: 52, text: "text-[16px] leading-[24px] tracking-[0.005em]" },
} as const;
export interface ForenTablePaginationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** compact is the table footer; desktop numbers every page; mobile is prev/label/next. */
  layout?: ForenPaginationLayout;
  size?: ForenPaginationSize;
  /** 1-based. */
  page: number;
  pageCount: number;
  onPageChange?: (next: number) => void;
  /** compact — drives the "SHOWING: n OF total" copy on the left. */
  shown?: number;
  total?: number;
  /** compact — replace the left-hand copy entirely. */
  label?: React.ReactNode;
  /** compact — centre text. Defaults to `page/pageCount`. */
  position?: React.ReactNode;
  /**
   * compact — fill the container instead of the design's fixed 600px.
   * Defaults to true, which is how the Sample Table footer uses it.
   */
  fluid?: boolean;
  /** mobile — centre text. Defaults to `Page n of total`. */
  pageInfo?: React.ReactNode;
  /** desktop — explicit button list; null renders an ellipsis. Computed when omitted. */
  pages?: (number | null)[];
}
/**
 * Builds the desktop button list. Reproduces the design's [1,2,3,…,8,9,10]
 * at the edges, and brackets the current page when it sits in the middle.
 */
function buildPages(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 3 || page >= pageCount - 2) {
    return [1, 2, 3, null, pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, null, page - 1, page, page + 1, null, pageCount];
}
export function ForenTablePagination({
  layout = "compact",
  size = "md",
  page,
  pageCount,
  onPageChange,
  shown,
  total,
  label,
  position,
  fluid = true,
  pageInfo,
  pages,
  className,
  ...props
}: ForenTablePaginationProps) {
  const s = PAGINATION_SIZES[size];
  const canPrev = page > 1;
  const canNext = page < pageCount;
  const prev = (
    <NavButton
      direction="prev"
      size={size}
      disabled={!canPrev}
      onClick={() => canPrev && onPageChange?.(page - 1)}
    />
  );
  const next = (
    <NavButton
      direction="next"
      size={size}
      disabled={!canNext}
      onClick={() => canNext && onPageChange?.(page + 1)}
    />
  );
  if (layout === "compact") {
    return (
      <div
        aria-label="Pagination"
        role="navigation"
        className={cn("flex items-center justify-between", fluid ? "w-full px-6" : "px-4", className)}
        style={{ height: s.height, width: fluid ? undefined : 600 }}
        {...props}
      >
        <span
          className={cn(
            "font-semibold uppercase tabular-nums text-[var(--color-foren-text-tertiary)]",
            s.text
          )}
        >
          {label ??
            (shown != null && total != null ? `Showing: ${shown} of ${total} items` : null)}
        </span>
        <div className="flex shrink-0 items-center" style={{ gap: s.navGap }}>
          {prev}
          <span
            className={cn(
              "font-medium tabular-nums text-[var(--color-foren-text-primary)]",
              s.text
            )}
          >
            {position ?? `${page}/${pageCount}`}
          </span>
          {next}
        </div>
      </div>
    );
  }
  if (layout === "mobile") {
    return (
      <div
        aria-label="Pagination"
        role="navigation"
        className={cn("flex items-center px-4", className)}
        style={{ gap: s.gap }}
        {...props}
      >
        {prev}
        <span
          className={cn(
            "font-medium whitespace-nowrap tabular-nums text-[var(--color-foren-text-primary)]",
            s.text
          )}
        >
          {pageInfo ?? `Page ${page} of ${pageCount}`}
        </span>
        {next}
      </div>
    );
  }
  const list = pages ?? buildPages(page, pageCount);
  return (
    <div
      aria-label="Pagination"
      role="navigation"
      className={cn("flex items-center px-4", className)}
      style={{ gap: s.gap }}
      {...props}
    >
      {prev}
      {list.map((p, i) =>
        p === null ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className={cn("font-medium text-[var(--color-foren-text-tertiary)]", s.text)}
          >
            &hellip;
          </span>
        ) : (
          <PageButton
            key={p}
            page={p}
            size={size}
            active={p === page}
            onClick={() => onPageChange?.(p)}
          />
        )
      )}
      {next}
    </div>
  );
}
function NavButton({
  direction,
  size,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  size: ForenPaginationSize;
  disabled: boolean;
  onClick: () => void;
}) {
  const s = PAGINATION_SIZES[size];
  const Icon = direction === "prev" ? RiArrowLeftSLine : RiArrowRightSLine;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous page" : "Next page"}
      style={{ width: s.control, height: s.control }}
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-[var(--color-foren-bg-default)] outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)]",
        // The design drops the border on the disabled state rather than
        // dimming it, and fades the chevron instead.
        disabled
          ? "cursor-default opacity-30"
          : "cursor-pointer border border-[var(--color-foren-border-muted)] text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-sunken)]"
      )}
    >
      <Icon aria-hidden style={{ width: s.icon, height: s.icon }} />
    </button>
  );
}
function PageButton({
  page,
  size,
  active,
  onClick,
}: {
  page: number;
  size: ForenPaginationSize;
  active: boolean;
  onClick: () => void;
}) {
  const s = PAGINATION_SIZES[size];
  return (
    <button
      type="button"
      onClick={active ? undefined : onClick}
      aria-current={active ? "page" : undefined}
      aria-label={`Page ${page}`}
      style={{ width: s.control, height: s.control }}
      className={cn(
        "grid shrink-0 place-items-center rounded-lg font-medium tabular-nums outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)]",
        s.text,
        active
          ? "cursor-default bg-[var(--color-foren-bg-button-primary,#1e1711)] text-[var(--color-foren-text-inverse)]"
          : "cursor-pointer border border-[var(--color-foren-border-muted)] bg-[var(--color-foren-bg-default)] text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-sunken)]"
      )}
    >
      {page}
    </button>
  );
}