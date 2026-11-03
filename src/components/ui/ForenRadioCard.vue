<script setup lang="ts">
import { computed, inject, useId, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import ForenRadioDot from "./ForenRadioDot.vue";
import {
  descTextVariants,
  labelTextVariants,
  RADIO_CTX,
  type ForenRadioCardProps,
} from "./foren-radio";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<ForenRadioCardProps & { class?: HTMLAttributes["class"] }>(),
  { disabled: undefined },
);
const slots = defineSlots<{
  label?(): unknown;
  description?(): unknown;
  badge?(): unknown;
  caption?(): unknown;
  price?(): unknown;
}>();

const ctx = inject(RADIO_CTX);
if (!ctx) throw new Error("ForenRadioCard must be used inside ForenRadioGroup");
const autoId = useId();
const id = computed(() => props.id ?? autoId);
const disabled = computed(() => props.disabled ?? ctx.disabled.value);
const checked = computed(() => ctx.value.value === props.value);
const size = computed(() => ctx.size.value);

function onChange(e: Event) {
  if ((e.target as HTMLInputElement).checked) ctx!.setValue(props.value);
}
</script>

<template>
  <label
    :for="id"
    :class="
      cn(
        'relative flex items-center gap-4 px-5 py-4 rounded-[16px] border bg-[var(--color-foren-bg-default)] transition-[border-color,box-shadow] duration-150 ease-out select-none',
        checked
          ? 'border-[var(--color-foren-brand-green)] shadow-[var(--shadow-foren-xs)]'
          : 'border-[var(--color-foren-border-muted)] hover:border-[var(--color-foren-border-default)]',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        props.class,
      )
    "
  >
    <input
      :id="id"
      type="radio"
      :name="ctx!.name.value"
      :value="value"
      :checked="checked"
      :disabled="disabled"
      class="peer sr-only"
      v-bind="$attrs"
      @change="onChange"
    />
    <ForenRadioDot :checked="checked" :size="size" :disabled="disabled" />
    <span class="flex-1 min-w-0 flex items-center gap-3">
      <span
        v-if="label || slots.label"
        :class="cn(labelTextVariants({ size, disabled }), 'shrink-0')"
        ><slot name="label">{{ label }}</slot></span
      >
      <slot name="badge">{{ badge }}</slot>
      <span
        v-if="description || slots.description"
        :class="descTextVariants({ size, disabled })"
        ><slot name="description">{{ description }}</slot></span
      >
    </span>
    <span
      v-if="price || slots.price || caption || slots.caption"
      class="flex flex-col items-end gap-0.5 shrink-0"
    >
      <span
        v-if="price || slots.price"
        :class="cn(labelTextVariants({ size, disabled }), 'tabular-nums')"
        ><slot name="price">{{ price }}</slot></span
      >
      <span
        v-if="caption || slots.caption"
        :class="descTextVariants({ size, disabled })"
        ><slot name="caption">{{ caption }}</slot></span
      >
    </span>
  </label>
</template>
