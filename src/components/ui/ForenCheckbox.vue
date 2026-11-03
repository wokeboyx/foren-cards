<script setup lang="ts">
import { computed, ref, useId, watchEffect, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import {
  checkboxBoxVariants,
  descTextVariants,
  labelTextVariants,
  type Checked,
} from "./foren-checkbox";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    /** Controlled state (`v-model`). Leave undefined for an uncontrolled checkbox. */
    modelValue?: Checked;
    defaultChecked?: Checked;
    size?: "sm" | "md" | "lg";
    error?: boolean;
    disabled?: boolean;
    label?: string;
    description?: string;
    id?: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    modelValue: undefined,
    defaultChecked: false,
    size: "md",
    error: false,
    disabled: false,
  },
);
const emit = defineEmits<{ "update:modelValue": [next: Checked] }>();
defineSlots<{ label?(): unknown; description?(): unknown }>();

const autoId = useId();
const id = computed(() => props.id ?? autoId);
const internal = ref<Checked>(props.defaultChecked);
const checked = computed<Checked>(() =>
  props.modelValue !== undefined ? props.modelValue : internal.value,
);
const input = ref<HTMLInputElement | null>(null);
watchEffect(() => {
  if (input.value)
    input.value.indeterminate = checked.value === "indeterminate";
});
const iconPx = computed(() =>
  props.size === "sm" ? 11 : props.size === "md" ? 14 : 16,
);

function onChange(e: Event) {
  const next: Checked = (e.target as HTMLInputElement).checked;
  if (props.modelValue === undefined) internal.value = next;
  emit("update:modelValue", next);
}
</script>

<template>
  <label
    :for="id"
    :class="
      cn(
        'inline-flex gap-3 items-start select-none',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        props.class,
      )
    "
  >
    <span class="relative">
      <input
        :id="id"
        ref="input"
        type="checkbox"
        :checked="checked === true"
        :disabled="disabled"
        :aria-checked="checked === 'indeterminate' ? 'mixed' : checked"
        class="peer sr-only"
        v-bind="$attrs"
        @change="onChange"
      />
      <span
        aria-hidden="true"
        :class="
          cn(
            checkboxBoxVariants({ size, checked, error, disabled }),
            'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-foren-bg-default)] peer-focus-visible:ring-[var(--color-foren-border-focus)]',
          )
        "
      >
        <span
          :class="
            cn('text-white', checked === true ? 'opacity-100' : 'opacity-0')
          "
        >
          <svg
            :width="iconPx"
            :height="iconPx"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <span
          :class="
            cn(
              'absolute text-white',
              checked === 'indeterminate' ? 'opacity-100' : 'opacity-0',
            )
          "
        >
          <svg
            :width="iconPx"
            :height="iconPx"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
          >
            <path d="M5 12h14" />
          </svg>
        </span>
      </span>
    </span>
    <!-- Optical centering: line-height is taller than the box, so pull text up to line the first line's midline up with the box. -->
    <span
      v-if="label || description || $slots.label || $slots.description"
      :class="
        cn(
          'flex flex-col gap-1',
          size === 'sm' && '-mt-px',
          size === 'md' && '-mt-[0.5px]',
        )
      "
    >
      <span
        v-if="label || $slots.label"
        :class="labelTextVariants({ size, disabled })"
        ><slot name="label">{{ label }}</slot></span
      >
      <span
        v-if="description || $slots.description"
        :class="descTextVariants({ size, disabled })"
        ><slot name="description">{{ description }}</slot></span
      >
    </span>
  </label>
</template>
