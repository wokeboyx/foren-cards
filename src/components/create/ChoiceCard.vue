<script setup lang="ts">
import { useId } from "vue";
import { cn } from "@/lib/utils";

/** Radio option with a title and a one-line explanation underneath (Foren radio-card styling). */
defineProps<{
  name: string;
  value: string;
  checked: boolean;
  /** Plain-text title; use the `title` slot for richer content. */
  title?: string;
  description?: string;
  disabled?: boolean;
}>();
/** `change` fires with this option's value when it's picked. */
const emit = defineEmits<{ change: [value: string] }>();
defineSlots<{
  title?(): unknown;
  description?(): unknown;
  badge?(): unknown;
  icon?(): unknown;
}>();
const id = useId();
</script>

<template>
  <label
    :for="id"
    :class="
      cn(
        'relative flex cursor-pointer gap-3 rounded-[16px] border bg-surface px-4 py-3.5 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus',
        checked
          ? 'border-[var(--color-foren-brand-green)] shadow-[var(--shadow-foren-xs)]'
          : 'border-line hover:bg-sunken',
        disabled && 'cursor-not-allowed opacity-60',
      )
    "
  >
    <input
      :id="id"
      type="radio"
      :name="name"
      :value="value"
      :checked="checked"
      :disabled="disabled"
      class="peer sr-only"
      @change="emit('change', value)"
    />
    <span
      aria-hidden="true"
      :class="
        cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors',
          checked
            ? 'border-[var(--color-foren-brand-green)] bg-[var(--color-foren-brand-green)]'
            : 'border-line-strong bg-surface',
        )
      "
    >
      <span v-if="checked" class="size-2 rounded-full bg-white" />
    </span>
    <span v-if="$slots.icon" class="mt-0.5 shrink-0 text-fg-2 [&_svg]:size-5"
      ><slot name="icon"
    /></span>
    <span class="min-w-0 flex-1">
      <span
        class="flex flex-wrap items-center gap-2 text-[14px] leading-[21px] font-semibold text-fg"
      >
        <slot name="title">{{ title }}</slot>
        <slot name="badge" />
      </span>
      <span
        v-if="description || $slots.description"
        class="mt-0.5 block text-[13px] leading-[18px] text-fg-2"
      >
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>
</template>
