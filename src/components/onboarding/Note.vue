<script setup lang="ts">
/** Multi-line note (Figma "Why we ask this" / review notes). The DS Info note is single-line, so it can't hold these. */
import { computed, type HTMLAttributes } from "vue";
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    intent?: "info" | "warning" | "success" | "error";
    title?: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    intent: "info",
  },
);
const slots = defineSlots<{ default(): unknown; title?(): unknown }>();
const Icon = computed(() =>
  props.intent === "success"
    ? RiCheckboxCircleFill
    : props.intent === "info"
      ? RiInformationFill
      : RiErrorWarningFill,
);
</script>

<template>
  <div
    :role="intent === 'error' ? 'alert' : 'status'"
    :class="
      cn(
        'flex gap-2 rounded-[12px] px-3 py-2.5 text-[12px] leading-[18px] font-medium',
        intent === 'info' && 'bg-info-subtle text-info',
        intent === 'warning' && 'bg-warning-subtle text-warning',
        intent === 'success' && 'bg-success-subtle text-success',
        intent === 'error' && 'bg-error-subtle text-error',
        props.class,
      )
    "
  >
    <component
      :is="Icon"
      class="mt-px size-[14px] shrink-0"
      aria-hidden="true"
    />
    <div class="min-w-0">
      <p v-if="title || slots.title" class="font-semibold">
        <slot name="title">{{ title }}</slot>
      </p>
      <div><slot /></div>
    </div>
  </div>
</template>
