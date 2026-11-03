<script setup lang="ts">
/**
 * Multi-line note. The DS Info note is a one-line pill, which truncates the longer explanations these
 * screens need, so this keeps its colours but lets text wrap.
 */
import { computed, type HTMLAttributes } from "vue";
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    intent?: "info" | "success" | "warning" | "error";
    title?: string;
    class?: HTMLAttributes["class"];
  }>(),
  { intent: "info" },
);
const slots = defineSlots<{
  default?(): unknown;
  title?(): unknown;
  action?(): unknown;
}>();

const tone = computed(
  () =>
    ({
      info: "bg-info-subtle text-info",
      success: "bg-success-subtle text-success",
      warning: "bg-warning-subtle text-warning",
      error: "bg-error-subtle text-error",
    })[props.intent],
);
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
        'flex items-start gap-2.5 rounded-[12px] px-3 py-2.5 text-[13px] leading-[19px] font-medium',
        tone,
        props.class,
      )
    "
  >
    <component :is="Icon" class="mt-px size-4 shrink-0" aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <p v-if="title || slots.title" class="font-semibold">
        <slot name="title">{{ title }}</slot>
      </p>
      <div v-if="slots.default"><slot /></div>
    </div>
    <slot name="action" />
  </div>
</template>
