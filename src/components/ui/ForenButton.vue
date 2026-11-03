<script setup lang="ts">
import type { ButtonHTMLAttributes, HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariants } from "./foren-button";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariants["variant"];
    size?: ButtonVariants["size"];
    destructive?: boolean;
    type?: ButtonHTMLAttributes["type"];
    class?: HTMLAttributes["class"];
  }>(),
  { type: "button", destructive: false },
);
defineSlots<{
  default?(): unknown;
  leadingIcon?(): unknown;
  trailingIcon?(): unknown;
}>();
</script>

<template>
  <button
    :type="props.type"
    :class="
      cn(
        buttonVariants({
          variant: props.variant,
          size: props.size,
          destructive: props.destructive,
        }),
        props.class,
      )
    "
  >
    <slot name="leadingIcon" />
    <span v-if="$slots.default"><slot /></span>
    <slot name="trailingIcon" />
  </button>
</template>
