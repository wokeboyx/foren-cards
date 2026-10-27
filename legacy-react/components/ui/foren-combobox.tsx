"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ForenCheckbox } from "./foren-checkbox";
export type ForenComboBoxOption = {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
};
export interface ForenComboBoxProps {
  /** Static option list. Use `onSearch` for async filtering. */
  options?: ForenComboBoxOption[];
  /** Async filter — returns options for the given query. */
  onSearch?: (query: string) => ForenComboBoxOption[] | Promise<ForenComboBoxOption[]>;
  /** Controlled selected values. */
  value?: string[];
  /** Uncontrolled initial selection. */
  defaultValue?: string[];
  onChange?: (next: string[]) => void;
  /** Optional label above field. */
  label?: React.ReactNode;
  /** Helper text below. */
  description?: React.ReactNode;
  /** Error message (also flips border red). */
  error?: React.ReactNode;
  /** Placeholder when nothing selected. */
  placeholder?: string;
  size?: "md" | "lg";
  disabled?: boolean;
  /** Cap selections. Defaults to unlimited. */
  maxSelected?: number;
  /** Render empty state when filter returns no matches. */
  emptyState?: React.ReactNode;
  /** Hide built-in search input inside the dropdown. */
  hideSearch?: boolean;
  className?: string;
}
const CaretIcon = ({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("transition-transform duration-150", open && "rotate-180")}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const ForenComboBox = React.forwardRef<HTMLDivElement, ForenComboBoxProps>(
  function ForenComboBox(
    {
      options: staticOptions,
      onSearch,
      value: controlled,
      defaultValue = [],
      onChange,
      label,
      description,
      error,
      placeholder = "Select…",
      size = "md",
      disabled = false,
      maxSelected,
      emptyState = "No matches.",
      hideSearch = false,
      className,
    },
    ref
  ) {
    const isControlled = controlled !== undefined;
    const [internal, setInternal] = React.useState<string[]>(defaultValue);
    const value = isControlled ? controlled! : internal;
    const [open, setOpenState] = React.useState(false);
    const [closing, setClosing] = React.useState(false);
    const [entered, setEntered] = React.useState(false);
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const setOpen = React.useCallback((next: boolean | ((v: boolean) => boolean)) => {
      setOpenState((prev) => {
        const target = typeof next === "function" ? next(prev) : next;
        if (prev && !target) {
          setClosing(true);
          if (closeTimer.current) clearTimeout(closeTimer.current);
          const ms =
            parseFloat(
              typeof window !== "undefined"
                ? getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")
                : ""
            ) || 150;
          closeTimer.current = setTimeout(() => setClosing(false), ms);
        } else if (!prev && target) {
          setClosing(false);
          if (closeTimer.current) clearTimeout(closeTimer.current);
        }
        return target;
      });
    }, []);
    const [query, setQuery] = React.useState("");
    const [active, setActive] = React.useState(0);
    const [asyncResults, setAsyncResults] = React.useState<ForenComboBoxOption[] | null>(null);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);
    const reactId = React.useId();
    React.useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);
    // Async filter
    React.useEffect(() => {
      if (!onSearch) return;
      let cancelled = false;
      (async () => {
        const r = await onSearch(query);
        if (!cancelled) setAsyncResults(r);
      })();
      return () => {
        cancelled = true;
      };
    }, [query, onSearch]);
    // All resolved options for the open panel.
    const filtered = React.useMemo<ForenComboBoxOption[]>(() => {
      if (onSearch) return asyncResults ?? [];
      if (!staticOptions) return [];
      const q = query.trim().toLowerCase();
      if (!q) return staticOptions;
      return staticOptions.filter((o) => {
        const haystack =
          (typeof o.label === "string" ? o.label : "") +
          " " +
          (typeof o.description === "string" ? o.description : "") +
          " " +
          o.value;
        return haystack.toLowerCase().includes(q);
      });
    }, [staticOptions, asyncResults, onSearch, query]);
    // For chip render — full option lookup table (last-known label).
    const lookup = React.useRef<Map<string, ForenComboBoxOption>>(new Map());
    React.useEffect(() => {
      const src = staticOptions ?? asyncResults ?? [];
      for (const o of src) lookup.current.set(o.value, o);
    }, [staticOptions, asyncResults]);
    React.useEffect(() => setActive(0), [filtered.length, open]);
    // Apply .is-open one frame after mount so the transition runs from pre-open state.
    React.useEffect(() => {
      if (open) {
        const r = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(r);
      }
      setEntered(false);
    }, [open]);
    // Outside click closes
    React.useEffect(() => {
      if (!open) return;
      function onClick(e: MouseEvent) {
        if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
      }
      window.addEventListener("mousedown", onClick);
      return () => window.removeEventListener("mousedown", onClick);
    }, [open]);
    React.useEffect(() => {
      if (open && !hideSearch) {
        const t = setTimeout(() => searchRef.current?.focus(), 10);
        return () => clearTimeout(t);
      }
    }, [open, hideSearch]);
    function setValue(next: string[]) {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    }
    function toggle(opt: ForenComboBoxOption) {
      if (opt.disabled || disabled) return;
      const has = value.includes(opt.value);
      if (has) {
        setValue(value.filter((v) => v !== opt.value));
      } else {
        if (maxSelected != null && value.length >= maxSelected) return;
        setValue([...value, opt.value]);
      }
    }
    function removeAt(v: string) {
      setValue(value.filter((x) => x !== v));
    }
    function clearAll() {
      setValue([]);
    }
    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        if (filtered[active]) {
          e.preventDefault();
          toggle(filtered[active]);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "Backspace" && query.length === 0 && value.length > 0) {
        e.preventDefault();
        setValue(value.slice(0, -1));
      }
    }
    const status: "default" | "error" = error ? "error" : "default";
    const heightClass = size === "lg" ? "min-h-14" : "min-h-12";
    const messageId = `${reactId}-msg`;
    const message = error ?? description;
    const messageColor = error
      ? "text-[var(--color-foren-error,#c62828)]"
      : "text-[var(--color-foren-text-tertiary)]";
    return (
      <div ref={rootRef} className={cn("relative w-full flex flex-col gap-2", className)}>
        {label && (
          <span className="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]">
            {label}
          </span>
        )}
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-disabled={disabled || undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={message ? messageId : undefined}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={cn(
            "flex flex-wrap items-center gap-1.5 rounded-[16px] border px-2.5 py-1.5 cursor-text transition-[background-color,border-color,box-shadow] duration-150 ease-out",
            heightClass,
            status === "default"
              ? "bg-[var(--color-foren-bg-subtle)] border-transparent hover:border-[var(--color-foren-border-default)] focus-within:bg-[var(--color-foren-bg-default)] focus-within:border-[var(--color-foren-border-focus)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-foren-border-focus)_18%,transparent)]"
              : "bg-[var(--color-foren-bg-default)] border-[var(--color-foren-error,#c62828)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-foren-error,#c62828)_18%,transparent)]",
            disabled && "bg-[var(--color-foren-bg-button-disabled)] border-transparent cursor-not-allowed pointer-events-none"
          )}
        >
          {value.map((v) => {
            const opt = lookup.current.get(v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 h-8 pl-3 pr-1.5 rounded-full bg-[var(--color-foren-bg-elevated)] border border-[var(--color-foren-border-muted)] text-[13px] leading-[18px] font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)] shadow-[var(--shadow-foren-xs)]"
              >
                <span className="truncate max-w-[180px]">{opt?.label ?? v}</span>
                <button
                  type="button"
                  aria-label={`Remove ${typeof opt?.label === "string" ? opt.label : v}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(v);
                  }}
                  className="inline-flex items-center justify-center size-5 rounded-full text-[var(--color-foren-text-tertiary)] hover:text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-subtle)] transition-colors cursor-pointer"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
            disabled={disabled}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[80px] bg-transparent outline-none font-medium tracking-[0.01em] text-[14px] leading-[21px] text-[var(--color-foren-text-primary)] placeholder:text-[var(--color-foren-text-disabled)] disabled:cursor-not-allowed"
          />
          <span className="ml-auto shrink-0 text-[var(--color-foren-text-tertiary)] pointer-events-none">
            <CaretIcon open={open} />
          </span>
        </div>
        {(open || closing) && (
          <div
            role="listbox"
            aria-multiselectable
            data-origin="top-left"
            className={cn(
              "t-dropdown absolute z-50 top-[calc(100%+8px)] left-0 right-0 rounded-[16px] bg-[var(--color-foren-bg-elevated)] border border-[var(--color-foren-border-muted)] shadow-[var(--shadow-foren-md)] p-1.5 max-h-72 overflow-y-auto",
              entered && !closing && "is-open",
              closing && "is-closing"
            )}
          >
            {value.length > 0 && (
              <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-[var(--color-foren-border-muted)]">
                <span className="text-[11px] font-mono text-[var(--color-foren-text-tertiary)]">
                  {value.length} selected{maxSelected ? ` / ${maxSelected}` : ""}
                </span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] font-medium text-[var(--color-foren-text-secondary)] hover:text-[var(--color-foren-text-primary)] underline-offset-[3px] hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-[12.5px] text-[var(--color-foren-text-tertiary)] text-center">
                {emptyState}
              </div>
            )}
            {filtered.map((opt, i) => {
              const isActive = i === active;
              const checked = value.includes(opt.value);
              const atCap = !checked && maxSelected != null && value.length >= maxSelected;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={checked}
                  aria-disabled={opt.disabled || atCap || undefined}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "rounded-md transition-colors",
                    isActive ? "bg-[var(--color-foren-bg-subtle)]" : "hover:bg-[var(--color-foren-bg-sunken)]",
                    (opt.disabled || atCap) && "opacity-50"
                  )}
                >
                  <ForenCheckbox
                    size="sm"
                    checked={checked}
                    disabled={opt.disabled || atCap}
                    onCheckedChange={() => toggle(opt)}
                    label={opt.label}
                    description={opt.description}
                    tabIndex={-1}
                    className="w-full px-2.5 py-2"
                  />
                </div>
              );
            })}
          </div>
        )}
        {message && (
          <p id={messageId} className={cn("text-[12px] leading-[16px] tracking-[0.01em]", messageColor)}>
            {message}
          </p>
        )}
      </div>
    );
  }
);