"use client";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

/**
 * Single-select dropdown: Foren Design System "Dropdown" (Figma fMjvoaNbmk0lqhd9hatUEa · 390:2, Size=Medium, Type=Single).
 * - Trigger: subtle fill, 48px, radius 16, 12px padding, 8px gap, optional flag, 16px caret (rotates when open).
 *   Default/Hover: no border. Focused/Open: solar-yellow-900 border + 6px halo. Error: red border.
 *   Disabled: disabled border, tertiary text, disabled caret. Placeholder in text/secondary.
 * - List: white, muted border, radius 16, 4px padding, shadow-md, 8px below the trigger.
 *   "Dropdown Item": 12px padding, radius 12, 12px gap; Hover = subtle fill; Selected = subtle fill + 20px check.
 * Keyboard: Enter/Space/↑/↓ open; ↑/↓/Home/End move; Enter/Space pick; Esc closes; type to jump.
 */

/** `display` replaces the label in the closed trigger (e.g. "+44" for "United Kingdom +44"). */
export type ForenSelectOption = { value: string; label: string; display?: React.ReactNode; leading?: React.ReactNode; disabled?: boolean };
export type ForenSelectGroup = { label: string; options: ForenSelectOption[] };

export interface ForenSelectProps {
  id?: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: (ForenSelectOption | ForenSelectGroup)[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  /** Extra classes for the menu, e.g. a min width when the trigger is narrow. */
  menuClassName?: string;
  "aria-describedby"?: string;
  "aria-label"?: string;
}

const isGroup = (o: ForenSelectOption | ForenSelectGroup): o is ForenSelectGroup => "options" in o;

/** DS "Caret" (16px). */
function Caret({ open, disabled }: { open: boolean; disabled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={cn("shrink-0 transition-transform duration-150", disabled ? "text-fg-disabled" : "text-[#544e48]", open && "rotate-180")}>
      <path d="M7.99993 8.78093L11.2998 5.48112L12.2426 6.42393L7.99993 10.6666L3.75733 6.42393L4.70013 5.48112L7.99993 8.78093Z" fill="currentColor" />
    </svg>
  );
}

/** DS "Check" (Phosphor, 20px) on the selected item. */
function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0 text-[#544e48]">
      <path d="M3.125 11.25L7.5 15.625L17.5 5.625" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const ForenSelect = React.forwardRef<HTMLButtonElement, ForenSelectProps>(function ForenSelect(
  { id, value, onChange, options, placeholder = "Select option", disabled, invalid, className, menuClassName, ...aria },
  ref
) {
  const autoId = React.useId();
  const listId = `${id ?? autoId}-list`;
  const [open, setOpen] = React.useState(false);
  const flat = React.useMemo(() => options.flatMap((o) => (isGroup(o) ? o.options : [o])), [options]);
  const selected = flat.find((o) => o.value === value);
  const [active, setActive] = React.useState(-1);
  const listRef = React.useRef<HTMLDivElement>(null);
  const typed = React.useRef({ text: "", at: 0 });

  const enabledIdx = (from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < flat.length; i += step) if (!flat[i].disabled) return i;
    return -1;
  };

  const openMenu = () => {
    if (disabled) return;
    const sel = flat.findIndex((o) => o.value === value);
    setActive(sel >= 0 ? sel : enabledIdx(0, 1));
    setOpen(true);
  };

  const pick = (i: number) => {
    const o = flat[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    setOpen(false);
  };

  // Keep the highlighted option in view.
  React.useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = enabledIdx(active + 1, 1);
      if (n >= 0) setActive(n);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = enabledIdx(active - 1, -1);
      if (n >= 0) setActive(n);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(enabledIdx(0, 1));
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(enabledIdx(flat.length - 1, -1));
    } else if (e.key === "Enter" || (e.key === " " && !(typed.current.text && Date.now() - typed.current.at < 600))) {
      // Space picks, unless it's part of a name being typed ("united s…").
      e.preventDefault();
      pick(active);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const hit = flat.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    }
  };

  let index = -1;
  const renderOption = (o: ForenSelectOption) => {
    const i = ++index;
    const isSel = o.value === value;
    return (
      <div
        key={o.value}
        id={`${listId}-${i}`}
        role="option"
        data-index={i}
        aria-selected={isSel}
        aria-disabled={o.disabled || undefined}
        onPointerMove={() => !o.disabled && setActive(i)}
        onClick={() => pick(i)}
        className={cn(
          "flex min-h-[45px] cursor-pointer items-center gap-3 rounded-[12px] px-3 py-3 text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg",
          (i === active || isSel) && "bg-subtle",
          o.disabled && "cursor-not-allowed text-fg-disabled"
        )}
      >
        {o.leading}
        <span className="min-w-0 flex-1">{o.label}</span>
        {isSel && <Check />}
      </div>
    );
  };

  return (
    <Popover.Root open={open} onOpenChange={(o) => (o ? openMenu() : setOpen(false))}>
      <Popover.Trigger asChild>
        <button
          ref={ref}
          id={id}
          type="button"
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-invalid={invalid || undefined}
          {...aria}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              openMenu();
            }
          }}
          className={cn(
            "flex h-12 w-full items-center gap-2 overflow-hidden rounded-[16px] border border-transparent bg-subtle px-3 text-left text-[14px] leading-[21px] font-medium tracking-[0.01em] outline-none",
            "transition-[border-color,box-shadow] duration-150",
            "focus-visible:border-[var(--color-foren-border-active)] focus-visible:shadow-[0_0_0_6px_var(--color-foren-ring-active)]",
            "aria-expanded:border-[var(--color-foren-border-active)] aria-expanded:shadow-[0_0_0_6px_var(--color-foren-ring-active)]",
            "aria-[invalid=true]:border-error",
            "disabled:cursor-not-allowed disabled:border-[var(--color-foren-border-disabled)]",
            className
          )}
        >
          {selected?.leading}
          <span className={cn("min-w-0 flex-1 truncate", disabled ? "text-fg-3" : selected ? "text-fg" : "text-fg-2")}>{selected ? (selected.display ?? selected.label) : placeholder}</span>
          <Caret open={open} disabled={disabled} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            listRef.current?.focus();
          }}
          className={cn("z-[80] w-[var(--radix-popover-trigger-width)] rounded-[16px] border border-line bg-surface p-1 shadow-[var(--shadow-foren-md)] outline-none animate-[fade-in_120ms_ease-out]", menuClassName)}
        >
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={id}
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            onKeyDown={onListKey}
            className="max-h-[min(320px,calc(var(--radix-popover-content-available-height)-8px))] overflow-y-auto outline-none"
          >
            {options.map((o) =>
              isGroup(o) ? (
                <div key={o.label} role="group" aria-label={o.label}>
                  <div className="px-3 pt-3 pb-1 text-[12px] leading-[18px] font-semibold tracking-[0.01em] text-fg-3 uppercase">{o.label}</div>
                  {o.options.map(renderOption)}
                </div>
              ) : (
                renderOption(o)
              )
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
});
