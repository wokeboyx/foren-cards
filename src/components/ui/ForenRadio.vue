<script setup lang="ts">
import { computed, inject, useId, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import ForenRadioDot from "./ForenRadioDot.vue";
import { descTextVariants, labelTextVariants, RADIO_CTX, type ForenRadioProps } from "./foren-radio";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ForenRadioProps & { class?: HTMLAttributes["class"] }>(), { disabled: undefined });
const slots = defineSlots<{ label?(): unknown; description?(): unknown; trailing?(): unknown }>();

const ctx = inject(RADIO_CTX);
if (!ctx) throw new Error("ForenRadio must be used inside ForenRadioGroup");
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
  <label :for="id" :class="cn('inline-flex items-start gap-3 select-none', disabled ? 'cursor-not-allowed' : 'cursor-pointer', props.class)">
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
    <span class="relative">
      <ForenRadioDot :checked="checked" :size="size" :disabled="disabled" />
      <span
        aria-hidden="true"
        class="absolute inset-0 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-foren-bg-default)] peer-focus-visible:ring-[var(--color-foren-border-focus)]"
      />
    </span>
    <span
      v-if="label || slots.label || description || slots.description"
      :class="
        cn(
          'flex flex-col gap-1 flex-1 min-w-0',
          // Optical centering — pull text so label first-line midline lands on dot midline.
          size === 'sm' && '-mt-px',
          size === 'md' && '-mt-[0.5px]'
        )
      "
    >
      <span v-if="label || slots.label" :class="labelTextVariants({ size, disabled })"><slot name="label">{{ label }}</slot></span>
      <span v-if="description || slots.description" :class="descTextVariants({ size, disabled })"><slot name="description">{{ description }}</slot></span>
    </span>
    <span
      v-if="trailing || slots.trailing"
      class="ml-auto shrink-0 text-[var(--color-foren-text-secondary)] text-[14px] leading-[21px] font-medium tracking-[0.01em]"
    >
      <slot name="trailing">{{ trailing }}</slot>
    </span>
  </label>
</template>
