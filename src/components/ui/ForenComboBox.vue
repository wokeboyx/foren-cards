<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch, watchEffect } from "vue";
import { cn } from "@/lib/utils";
import ForenCheckbox from "./ForenCheckbox.vue";
import type { ForenComboBoxOption } from "./foren-combobox";

const props = withDefaults(
  defineProps<{
    /** Static option list. Use `onSearch` for async filtering. */
    options?: ForenComboBoxOption[];
    /** Async filter — returns options for the given query. */
    onSearch?: (query: string) => ForenComboBoxOption[] | Promise<ForenComboBoxOption[]>;
    /** Controlled selected values (`v-model`). */
    modelValue?: string[];
    /** Uncontrolled initial selection. */
    defaultValue?: string[];
    /** Optional label above field. */
    label?: string;
    /** Helper text below. */
    description?: string;
    /** Error message (also flips border red). */
    error?: string;
    /** Placeholder when nothing selected. */
    placeholder?: string;
    size?: "md" | "lg";
    disabled?: boolean;
    /** Cap selections. Defaults to unlimited. */
    maxSelected?: number;
    /** Shown when the filter returns no matches. */
    emptyState?: string;
    /** Hide built-in search input inside the dropdown. */
    hideSearch?: boolean;
    class?: string;
  }>(),
  { modelValue: undefined, defaultValue: () => [], placeholder: "Select…", size: "md", disabled: false, emptyState: "No matches.", hideSearch: false }
);
const emit = defineEmits<{ "update:modelValue": [next: string[]] }>();

const internal = ref<string[]>(props.defaultValue);
const value = computed(() => (props.modelValue !== undefined ? props.modelValue : internal.value));
const open = ref(false);
const closing = ref(false);
const entered = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function setOpen(target: boolean) {
  const prev = open.value;
  if (prev && !target) {
    closing.value = true;
    if (closeTimer) clearTimeout(closeTimer);
    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")) || 150;
    closeTimer = setTimeout(() => (closing.value = false), ms);
  } else if (!prev && target) {
    closing.value = false;
    if (closeTimer) clearTimeout(closeTimer);
  }
  open.value = target;
}

const query = ref("");
const active = ref(0);
const asyncResults = ref<ForenComboBoxOption[] | null>(null);
const root = ref<HTMLDivElement | null>(null);
const search = ref<HTMLInputElement | null>(null);
const uid = useId();

// Async filter
watch(
  [query, () => props.onSearch],
  async ([q, onSearch], _old, onCleanup) => {
    if (!onSearch) return;
    let cancelled = false;
    onCleanup(() => (cancelled = true));
    const r = await onSearch(q);
    if (!cancelled) asyncResults.value = r;
  },
  { immediate: true }
);

// All resolved options for the open panel.
const filtered = computed<ForenComboBoxOption[]>(() => {
  if (props.onSearch) return asyncResults.value ?? [];
  if (!props.options) return [];
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) => `${o.label} ${o.description ?? ""} ${o.value}`.toLowerCase().includes(q));
});

// For chip render — full option lookup table (last-known label).
const lookup = new Map<string, ForenComboBoxOption>();
watchEffect(() => {
  for (const o of props.options ?? asyncResults.value ?? []) lookup.set(o.value, o);
});

watch([() => filtered.value.length, open], () => (active.value = 0));

// Apply .is-open one frame after mount so the transition runs from pre-open state.
watch(open, (isOpen, _old, onCleanup) => {
  if (isOpen) {
    const r = requestAnimationFrame(() => (entered.value = true));
    onCleanup(() => cancelAnimationFrame(r));
  } else entered.value = false;
});

// Outside click closes
function onOutside(e: MouseEvent) {
  if (!root.value?.contains(e.target as Node)) setOpen(false);
}
watch(open, (isOpen, _old, onCleanup) => {
  if (!isOpen) return;
  window.addEventListener("mousedown", onOutside);
  onCleanup(() => window.removeEventListener("mousedown", onOutside));
});

watch([open, () => props.hideSearch], ([isOpen, hide], _old, onCleanup) => {
  if (isOpen && !hide) {
    const t = setTimeout(() => search.value?.focus(), 10);
    onCleanup(() => clearTimeout(t));
  }
});
onBeforeUnmount(() => closeTimer && clearTimeout(closeTimer));

function setValue(next: string[]) {
  if (props.modelValue === undefined) internal.value = next;
  emit("update:modelValue", next);
}
function toggle(opt: ForenComboBoxOption) {
  if (opt.disabled || props.disabled) return;
  if (value.value.includes(opt.value)) setValue(value.value.filter((v) => v !== opt.value));
  else {
    if (props.maxSelected != null && value.value.length >= props.maxSelected) return;
    setValue([...value.value, opt.value]);
  }
}
function onKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    active.value = Math.min(active.value + 1, filtered.value.length - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    active.value = Math.max(active.value - 1, 0);
  } else if (e.key === "Enter") {
    const opt = filtered.value[active.value];
    if (opt) {
      e.preventDefault();
      toggle(opt);
    }
  } else if (e.key === "Escape") {
    setOpen(false);
  } else if (e.key === "Backspace" && query.value.length === 0 && value.value.length > 0) {
    e.preventDefault();
    setValue(value.value.slice(0, -1));
  }
}
function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value;
  if (!open.value) setOpen(true);
}

const heightClass = computed(() => (props.size === "lg" ? "min-h-14" : "min-h-12"));
const messageId = `${uid}-msg`;
const message = computed(() => props.error ?? props.description);
const messageColor = computed(() => (props.error ? "text-[var(--color-foren-error,#c62828)]" : "text-[var(--color-foren-text-tertiary)]"));
const atCap = (opt: ForenComboBoxOption) => !value.value.includes(opt.value) && props.maxSelected != null && value.value.length >= props.maxSelected;
</script>

<template>
  <div ref="root" :class="cn('relative w-full flex flex-col gap-2', props.class)">
    <span v-if="label" class="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]">
      {{ label }}
    </span>
    <div
      role="combobox"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-disabled="disabled || undefined"
      :aria-invalid="!!error || undefined"
      :aria-describedby="message ? messageId : undefined"
      :class="
        cn(
          'flex flex-wrap items-center gap-1.5 rounded-[16px] border px-2.5 py-1.5 cursor-text transition-[background-color,border-color,box-shadow] duration-150 ease-out',
          heightClass,
          !error
            ? 'bg-[var(--color-foren-bg-subtle)] border-transparent hover:border-[var(--color-foren-border-default)] focus-within:bg-[var(--color-foren-bg-default)] focus-within:border-[var(--color-foren-border-focus)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-foren-border-focus)_18%,transparent)]'
            : 'bg-[var(--color-foren-bg-default)] border-[var(--color-foren-error,#c62828)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-foren-error,#c62828)_18%,transparent)]',
          disabled && 'bg-[var(--color-foren-bg-button-disabled)] border-transparent cursor-not-allowed pointer-events-none'
        )
      "
      @click="!disabled && setOpen(!open)"
    >
      <span
        v-for="v in value"
        :key="v"
        class="inline-flex items-center gap-1 h-8 pl-3 pr-1.5 rounded-full bg-[var(--color-foren-bg-elevated)] border border-[var(--color-foren-border-muted)] text-[13px] leading-[18px] font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)] shadow-[var(--shadow-foren-xs)]"
      >
        <span class="truncate max-w-[180px]">{{ lookup.get(v)?.label ?? v }}</span>
        <button
          type="button"
          :aria-label="`Remove ${lookup.get(v)?.label ?? v}`"
          class="inline-flex items-center justify-center size-5 rounded-full text-[var(--color-foren-text-tertiary)] hover:text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-subtle)] transition-colors cursor-pointer"
          @click.stop="setValue(value.filter((x) => x !== v))"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </span>
      <input
        ref="search"
        type="text"
        :value="query"
        :disabled="disabled"
        :placeholder="value.length === 0 ? placeholder : ''"
        class="flex-1 min-w-[80px] bg-transparent outline-none font-medium tracking-[0.01em] text-[14px] leading-[21px] text-[var(--color-foren-text-primary)] placeholder:text-[var(--color-foren-text-disabled)] disabled:cursor-not-allowed"
        @input="onInput"
        @keydown="onKeyDown"
        @click.stop
      />
      <span class="ml-auto shrink-0 text-[var(--color-foren-text-tertiary)] pointer-events-none">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="cn('transition-transform duration-150', open && 'rotate-180')"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
    <div
      v-if="open || closing"
      role="listbox"
      aria-multiselectable="true"
      data-origin="top-left"
      :class="
        cn(
          't-dropdown absolute z-50 top-[calc(100%+8px)] left-0 right-0 rounded-[16px] bg-[var(--color-foren-bg-elevated)] border border-[var(--color-foren-border-muted)] shadow-[var(--shadow-foren-md)] p-1.5 max-h-72 overflow-y-auto',
          entered && !closing && 'is-open',
          closing && 'is-closing'
        )
      "
    >
      <div v-if="value.length > 0" class="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-[var(--color-foren-border-muted)]">
        <span class="text-[11px] font-mono text-[var(--color-foren-text-tertiary)]">{{ value.length }} selected{{ maxSelected ? ` / ${maxSelected}` : "" }}</span>
        <button
          type="button"
          class="text-[11px] font-medium text-[var(--color-foren-text-secondary)] hover:text-[var(--color-foren-text-primary)] underline-offset-[3px] hover:underline cursor-pointer"
          @click="setValue([])"
        >
          Clear
        </button>
      </div>
      <div v-if="filtered.length === 0" class="px-3 py-3 text-[12.5px] text-[var(--color-foren-text-tertiary)] text-center">
        {{ emptyState }}
      </div>
      <div
        v-for="(opt, i) in filtered"
        :key="opt.value"
        role="option"
        :aria-selected="value.includes(opt.value)"
        :aria-disabled="opt.disabled || atCap(opt) || undefined"
        :class="
          cn(
            'rounded-md transition-colors',
            i === active ? 'bg-[var(--color-foren-bg-subtle)]' : 'hover:bg-[var(--color-foren-bg-sunken)]',
            (opt.disabled || atCap(opt)) && 'opacity-50'
          )
        "
        @mouseenter="active = i"
      >
        <ForenCheckbox
          size="sm"
          :model-value="value.includes(opt.value)"
          :disabled="opt.disabled || atCap(opt)"
          :label="opt.label"
          :description="opt.description"
          :tabindex="-1"
          class="w-full px-2.5 py-2"
          @update:model-value="toggle(opt)"
        />
      </div>
    </div>
    <p v-if="message" :id="messageId" :class="cn('text-[12px] leading-[16px] tracking-[0.01em]', messageColor)">
      {{ message }}
    </p>
  </div>
</template>
