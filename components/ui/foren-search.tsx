"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
export type ForenSearchResult = {
  /** Unique value passed back to onSelect. */
  value: string;
  /** Display label. */
  label: React.ReactNode;
  /** Optional secondary text below the label. */
  description?: React.ReactNode;
  /** Optional leading icon. Defaults to a cube. */
  icon?: React.ReactNode;
};
export interface ForenSearchProps {
  /** Controlled input value. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Selected option callback. */
  onSelect?: (result: ForenSearchResult) => void;
  /** Static list of results, or use `onSearch` for async filtering. */
  results?: ForenSearchResult[];
  /** Override the default substring filter. Return a list given the query. */
  onSearch?: (query: string) => ForenSearchResult[];
  placeholder?: string;
  size?: "xs" | "md" | "lg";
  /** Show a × clear button when value is non-empty. Defaults true. */
  clearable?: boolean;
  /** Show the results panel even when query is empty. */
  alwaysShowResults?: boolean;
  className?: string;
  containerClassName?: string;
  /** Render a custom empty state inside the panel. */
  emptyState?: React.ReactNode;
  /** Hide built-in result panel — useful when you want to manage UI yourself. */
  hideResults?: boolean;
  /** aria-label for the input. */
  ariaLabel?: string;
  disabled?: boolean;
}
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
const CubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);
export function ForenSearch({
  value: controlled,
  defaultValue = "",
  onChange,
  onSelect,
  results,
  onSearch,
  placeholder = "Search…",
  size = "md",
  clearable = true,
  alwaysShowResults = false,
  className,
  containerClassName,
  emptyState,
  hideResults = false,
  ariaLabel = "Search",
  disabled = false,
}: ForenSearchProps) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const value = isControlled ? controlled! : internal;
  const [open, setOpenState] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [entered, setEntered] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const setOpen = React.useCallback((next: boolean) => {
    setOpenState((prev) => {
      if (prev && !next) {
        setClosing(true);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        const ms =
          parseFloat(
            typeof window !== "undefined"
              ? getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")
              : ""
          ) || 150;
        closeTimer.current = setTimeout(() => setClosing(false), ms);
      } else if (!prev && next) {
        setClosing(false);
        if (closeTimer.current) clearTimeout(closeTimer.current);
      }
      return next;
    });
  }, []);
  React.useEffect(() => {
    if (open) {
      const r = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(r);
    }
    setEntered(false);
  }, [open]);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const filtered = React.useMemo(() => {
    if (onSearch) return onSearch(value);
    if (!results) return [];
    const q = value.trim().toLowerCase();
    if (!q) return alwaysShowResults ? results : [];
    return results.filter((r) => {
      const haystack = (
        (typeof r.label === "string" ? r.label : "") +
        " " +
        (typeof r.description === "string" ? r.description : "") +
        " " +
        r.value
      ).toLowerCase();
      return haystack.includes(q);
    });
  }, [value, results, onSearch, alwaysShowResults]);
  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);
  React.useEffect(() => setActive(0), [filtered.length]);
  function setValue(next: string) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }
  function commit(r: ForenSearchResult) {
    onSelect?.(r);
    setValue(typeof r.label === "string" ? r.label : r.value);
    setOpen(false);
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (!open) setOpen(true);
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[active]) {
        e.preventDefault();
        commit(filtered[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }
  const showPanel: boolean =
    !hideResults && (open || closing) && (filtered.length > 0 || (!!emptyState && value.length > 0));
  const heightClass = size === "lg" ? "h-14" : size === "xs" ? "h-8 !px-2 !rounded-[16px]" : "h-12";
  return (
    <div ref={rootRef} className={cn("relative w-full", containerClassName)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-[16px] border transition-[background-color,border-color,box-shadow] duration-150 ease-out px-3.5",
          heightClass,
          "bg-[var(--color-foren-bg-subtle)] border-transparent hover:border-[var(--color-foren-border-default)]",
          "focus-within:bg-[var(--color-foren-bg-default)] focus-within:border-[var(--color-foren-border-focus)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-foren-border-focus)_18%,transparent)]",
          disabled && "bg-[var(--color-foren-bg-button-disabled)] cursor-not-allowed pointer-events-none"
        )}
      >
        <span className="text-[var(--color-foren-text-tertiary)] shrink-0">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "flex-1 min-w-0 bg-transparent outline-none font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)] placeholder:text-[var(--color-foren-text-disabled)] disabled:cursor-not-allowed text-[14px] leading-[21px]",
            size === "xs" && "text-[12px] placeholder:text-[var(--color-foren-text-tertiary)]",
            "[&::-webkit-search-cancel-button]:hidden",
            className
          )}
        />
        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="shrink-0 inline-flex items-center justify-center size-6 rounded-full text-[var(--color-foren-text-tertiary)] hover:text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-subtle)] cursor-pointer transition-colors"
          >
            <XIcon />
          </button>
        )}
      </div>
      {showPanel && (
        <div
          role="listbox"
          data-origin="top-left"
          className={cn(
            "t-dropdown absolute z-50 top-[calc(100%+8px)] left-0 right-0 rounded-[16px] bg-[var(--color-foren-bg-default)] border border-[var(--color-foren-border-muted)] shadow-[var(--shadow-foren-md)] p-1.5 max-h-72 overflow-y-auto",
            entered && !closing && "is-open",
            closing && "is-closing"
          )}
        >
          {filtered.length === 0 && emptyState && (
            <div className="px-3 py-3 text-[12.5px] text-[var(--color-foren-text-tertiary)]">{emptyState}</div>
          )}
          {filtered.map((r, i) => {
            const isActive = i === active;
            return (
              <button
                key={r.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(r)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-left transition-colors",
                  isActive ? "bg-[var(--color-foren-bg-subtle)]" : "hover:bg-[var(--color-foren-bg-sunken)]"
                )}
              >
                <span className="text-[var(--color-foren-text-tertiary)] shrink-0">
                  {r.icon ?? <CubeIcon />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-[var(--color-foren-text-primary)] truncate">
                    {r.label}
                  </span>
                  {r.description && (
                    <span className="block text-[11px] text-[var(--color-foren-text-tertiary)] truncate">
                      {r.description}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}