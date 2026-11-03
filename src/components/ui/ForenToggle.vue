<script setup lang="ts">
import { computed, ref, useId, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import {
  descVariants,
  labelVariants,
  sizeMap,
  trackVariants,
} from "./foren-toggle";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    size?: "sm" | "md" | "lg";
    /** Controlled state (`v-model`). Leave undefined for an uncontrolled toggle. */
    modelValue?: boolean;
    defaultChecked?: boolean;
    error?: boolean;
    disabled?: boolean;
    label?: string;
    description?: string;
    /** Reverse label position to the left of the switch. */
    reverse?: boolean;
    /** Hidden form name — emits a checkbox-like input. */
    name?: string;
    value?: string;
    id?: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    size: "md",
    modelValue: undefined,
    defaultChecked: false,
    error: false,
    disabled: false,
    reverse: false,
    value: "on",
  },
);
const emit = defineEmits<{ "update:modelValue": [next: boolean] }>();
defineSlots<{ label?(): unknown; description?(): unknown }>();

const autoId = useId();
const id = computed(() => props.id ?? autoId);
const internal = ref(props.defaultChecked);
const checked = computed(() =>
  props.modelValue !== undefined ? props.modelValue : internal.value,
);
const dim = computed(() => sizeMap[props.size]);

function toggle() {
  if (props.disabled) return;
  const next = !checked.value;
  if (props.modelValue === undefined) internal.value = next;
  emit("update:modelValue", next);
}
</script>

<template>
  <label
    v-if="label || description || $slots.label || $slots.description"
    :for="id"
    :class="
      cn(
        'inline-flex items-start gap-3 select-none',
        reverse && 'flex-row-reverse',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        props.class,
      )
    "
  >
    <button
      :id="id"
      type="button"
      role="switch"
      :aria-checked="checked"
      :aria-invalid="error || undefined"
      :disabled="disabled"
      :style="{ width: `${dim.trackW}px`, height: `${dim.trackH}px` }"
      :class="
        cn(
          trackVariants({ checked, error, disabled }),
          'cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foren-brand-green)]',
          props.class,
        )
      "
      v-bind="$attrs"
      @click="toggle"
    >
      <span
        aria-hidden="true"
        :style="{
          width: `${dim.thumbW}px`,
          height: `${dim.thumbH}px`,
          borderRadius: `${dim.radius}px`,
          top: `${dim.offset}px`,
          left: `${dim.offset}px`,
          transform: `translateX(${checked ? dim.travel : 0}px)`,
          boxShadow: checked
            ? 'inset 0 4px 4px rgba(170,170,170,0.25), 0 2px 6px rgba(0,0,0,0.18)'
            : 'inset 0 4px 4px rgba(170,170,170,0.25), 0 1px 3px rgba(0,0,0,0.12)',
          transitionProperty: 'transform, box-shadow',
          transitionDuration: '380ms',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.45, 0.64, 1)',
          willChange: 'transform',
        }"
        class="absolute bg-white border border-white"
      />
    </button>
    <span class="flex flex-col gap-1">
      <span
        v-if="label || $slots.label"
        :class="labelVariants({ size, disabled })"
        ><slot name="label">{{ label }}</slot></span
      >
      <span
        v-if="description || $slots.description"
        :class="descVariants({ size, disabled })"
        ><slot name="description">{{ description }}</slot></span
      >
    </span>
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :value="checked ? value : ''"
    />
  </label>
  <button
    v-else
    :id="id"
    type="button"
    role="switch"
    :aria-checked="checked"
    :aria-invalid="error || undefined"
    :disabled="disabled"
    :style="{ width: `${dim.trackW}px`, height: `${dim.trackH}px` }"
    :class="
      cn(
        trackVariants({ checked, error, disabled }),
        'cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foren-brand-green)]',
        props.class,
      )
    "
    v-bind="$attrs"
    @click="toggle"
  >
    <span
      aria-hidden="true"
      :style="{
        width: `${dim.thumbW}px`,
        height: `${dim.thumbH}px`,
        borderRadius: `${dim.radius}px`,
        top: `${dim.offset}px`,
        left: `${dim.offset}px`,
        transform: `translateX(${checked ? dim.travel : 0}px)`,
        boxShadow: checked
          ? 'inset 0 4px 4px rgba(170,170,170,0.25), 0 2px 6px rgba(0,0,0,0.18)'
          : 'inset 0 4px 4px rgba(170,170,170,0.25), 0 1px 3px rgba(0,0,0,0.12)',
        transitionProperty: 'transform, box-shadow',
        transitionDuration: '380ms',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.45, 0.64, 1)',
        willChange: 'transform',
      }"
      class="absolute bg-white border border-white"
    />
  </button>
</template>
