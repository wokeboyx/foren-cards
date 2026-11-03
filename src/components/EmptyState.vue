<script setup lang="ts">
/** Slots: icon, title, body, action, default (extra content under the action). */
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  title?: string;
  body?: string;
  class?: HTMLAttributes["class"];
}>();
const slots = defineSlots<{
  icon?(): unknown;
  title?(): unknown;
  body?(): unknown;
  action?(): unknown;
  default?(): unknown;
}>();
</script>

<template>
  <div
    :class="
      cn('flex flex-col items-center px-6 py-14 text-center', props.class)
    "
  >
    <div
      v-if="slots.icon"
      class="mb-4 grid size-14 place-items-center rounded-full bg-subtle text-fg-2 [&_svg]:size-6"
    >
      <slot name="icon" />
    </div>
    <h2
      class="text-[20px] leading-[26px] font-semibold tracking-[-0.01em] text-fg"
    >
      <slot name="title">{{ title }}</slot>
    </h2>
    <p class="mt-2 max-w-md text-[14px] leading-[22px] text-fg-2">
      <slot name="body">{{ body }}</slot>
    </p>
    <div v-if="slots.action" class="mt-6"><slot name="action" /></div>
    <slot />
  </div>
</template>
