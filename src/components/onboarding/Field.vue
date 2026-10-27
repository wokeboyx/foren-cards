<script setup lang="ts">
/** Label + control + hint, 8px apart (Figma Input). `label`, `hint`, `error` and `description` also work as slots. */
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  description?: string;
  class?: HTMLAttributes["class"];
}>();
const slots = defineSlots<{ default(): unknown; label?(): unknown; hint?(): unknown; error?(): unknown; description?(): unknown }>();
</script>

<template>
  <div :class="cn('flex flex-col gap-2', props.class)">
    <div class="flex flex-col gap-0.5">
      <label :for="htmlFor" class="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">
        <slot name="label">{{ label }}</slot>
      </label>
      <p v-if="description || slots.description" class="text-[12px] leading-[18px] font-medium text-fg-2">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <slot />
    <p v-if="error || slots.error" role="alert" class="text-[12px] leading-[18px] font-medium text-error">
      <slot name="error">{{ error }}</slot>
    </p>
    <p v-else-if="hint || slots.hint" class="text-[12px] leading-[18px] font-medium text-fg-3">
      <slot name="hint">{{ hint }}</slot>
    </p>
  </div>
</template>
