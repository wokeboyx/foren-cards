<script setup lang="ts">
// Search field with a results panel. Slots: `emptyState` (shown in the panel when nothing matches).
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { cn } from "@/lib/utils";
import type { ForenSearchProps, ForenSearchResult } from "./foren-search";

const props = withDefaults(defineProps<ForenSearchProps>(), {
  modelValue: undefined,
  defaultValue: "",
  placeholder: "Search…",
  size: "md",
  clearable: true,
  alwaysShowResults: false,
  hideResults: false,
  ariaLabel: "Search",
  disabled: false,
});
const emit = defineEmits<{
  "update:modelValue": [value: string];
  select: [result: ForenSearchResult];
}>();
const slots = defineSlots<{ emptyState?(): unknown }>();

const internal = ref(props.defaultValue);
const isControlled = computed(() => props.modelValue !== undefined);
const value = computed(() =>
  isControlled.value ? props.modelValue! : internal.value,
);

const open = ref(false);
const closing = ref(false);
const entered = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let raf: number | undefined;

function setOpen(next: boolean) {
  const prev = open.value;
  if (prev && !next) {
    closing.value = true;
    clearTimeout(closeTimer);
    const ms =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--dropdown-close-dur",
        ),
      ) || 150;
    closeTimer = setTimeout(() => (closing.value = false), ms);
  } else if (!prev && next) {
    closing.value = false;
    clearTimeout(closeTimer);
  }
  open.value = next;
}

watch(open, (o) => {
  if (raf) cancelAnimationFrame(raf);
  if (o) raf = requestAnimationFrame(() => (entered.value = true));
  else entered.value = false;
});

const active = ref(0);
const inputRef = useTemplateRef<HTMLInputElement>("input");
const rootRef = useTemplateRef<HTMLDivElement>("root");

const filtered = computed<ForenSearchResult[]>(() => {
  if (props.onSearch) return props.onSearch(value.value);
  if (!props.results) return [];
  const q = value.value.trim().toLowerCase();
  if (!q) return props.alwaysShowResults ? props.results : [];
  return props.results.filter((r) =>
    `${r.label} ${r.description ?? ""} ${r.value}`.toLowerCase().includes(q),
  );
});

// Close on outside click
function onOutside(e: MouseEvent) {
  if (!rootRef.value?.contains(e.target as Node)) setOpen(false);
}
watch(open, (o) =>
  o
    ? window.addEventListener("mousedown", onOutside)
    : window.removeEventListener("mousedown", onOutside),
);
onBeforeUnmount(() => {
  window.removeEventListener("mousedown", onOutside);
  clearTimeout(closeTimer);
  if (raf) cancelAnimationFrame(raf);
});

watch(
  () => filtered.value.length,
  () => (active.value = 0),
);

function setValue(next: string) {
  if (!isControlled.value) internal.value = next;
  emit("update:modelValue", next);
}

function commit(r: ForenSearchResult) {
  emit("select", r);
  setValue(r.label);
  setOpen(false);
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    if (!open.value) setOpen(true);
    e.preventDefault();
    active.value = Math.min(active.value + 1, filtered.value.length - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    active.value = Math.max(active.value - 1, 0);
  } else if (e.key === "Enter") {
    const hit = filtered.value[active.value];
    if (hit) {
      e.preventDefault();
      commit(hit);
    }
  } else if (e.key === "Escape") {
    setOpen(false);
  }
}

function onInput(e: Event) {
  setValue((e.target as HTMLInputElement).value);
  setOpen(true);
}

function clear() {
  setValue("");
  nextTick(() => inputRef.value?.focus());
}

const showPanel = computed(
  () =>
    !props.hideResults &&
    (open.value || closing.value) &&
    (filtered.value.length > 0 ||
      (!!slots.emptyState && value.value.length > 0)),
);
const heightClass = computed(() =>
  props.size === "lg"
    ? "h-14"
    : props.size === "xs"
      ? "h-8 !px-2 !rounded-[16px]"
      : "h-12",
);
</script>

<template>
  <div ref="root" :class="cn('relative w-full', containerClassName)">
    <div
      :class="
        cn(
          'flex items-center gap-2 rounded-[16px] border transition-[background-color,border-color,box-shadow] duration-150 ease-out px-3.5',
          heightClass,
          'bg-[var(--color-foren-bg-subtle)] border-transparent hover:border-[var(--color-foren-border-default)]',
          'focus-within:bg-[var(--color-foren-bg-default)] focus-within:border-[var(--color-foren-border-focus)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-foren-border-focus)_18%,transparent)]',
          disabled &&
            'bg-[var(--color-foren-bg-button-disabled)] cursor-not-allowed pointer-events-none',
        )
      "
    >
      <span class="text-[var(--color-foren-text-tertiary)] shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        ref="input"
        type="search"
        role="combobox"
        :aria-expanded="showPanel"
        aria-autocomplete="list"
        :aria-label="ariaLabel"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="
          cn(
            'flex-1 min-w-0 bg-transparent outline-none font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)] placeholder:text-[var(--color-foren-text-disabled)] disabled:cursor-not-allowed text-[14px] leading-[21px]',
            size === 'xs' &&
              'text-[12px] placeholder:text-[var(--color-foren-text-tertiary)]',
            '[&::-webkit-search-cancel-button]:hidden',
            props.class,
          )
        "
        @focus="setOpen(true)"
        @input="onInput"
        @keydown="onKeyDown"
      />
      <button
        v-if="clearable && value && !disabled"
        type="button"
        aria-label="Clear search"
        class="shrink-0 inline-flex items-center justify-center size-6 rounded-full text-[var(--color-foren-text-tertiary)] hover:text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-subtle)] cursor-pointer transition-colors"
        @click="clear"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
    <div
      v-if="showPanel"
      role="listbox"
      data-origin="top-left"
      :class="
        cn(
          't-dropdown absolute z-50 top-[calc(100%+8px)] left-0 right-0 rounded-[16px] bg-[var(--color-foren-bg-default)] border border-[var(--color-foren-border-muted)] shadow-[var(--shadow-foren-md)] p-1.5 max-h-72 overflow-y-auto',
          entered && !closing && 'is-open',
          closing && 'is-closing',
        )
      "
    >
      <div
        v-if="filtered.length === 0 && slots.emptyState"
        class="px-3 py-3 text-[12.5px] text-[var(--color-foren-text-tertiary)]"
      >
        <slot name="emptyState" />
      </div>
      <button
        v-for="(r, i) in filtered"
        :key="r.value"
        type="button"
        role="option"
        :aria-selected="i === active"
        :class="
          cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-left transition-colors',
            i === active
              ? 'bg-[var(--color-foren-bg-subtle)]'
              : 'hover:bg-[var(--color-foren-bg-sunken)]',
          )
        "
        @mouseenter="active = i"
        @click="commit(r)"
      >
        <span class="text-[var(--color-foren-text-tertiary)] shrink-0">
          <component :is="r.icon" v-if="r.icon" />
          <svg
            v-else
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        </span>
        <span class="min-w-0 flex-1">
          <span
            class="block text-[13px] font-medium text-[var(--color-foren-text-primary)] truncate"
            >{{ r.label }}</span
          >
          <span
            v-if="r.description"
            class="block text-[11px] text-[var(--color-foren-text-tertiary)] truncate"
            >{{ r.description }}</span
          >
        </span>
      </button>
    </div>
  </div>
</template>
