<script setup lang="ts">
/** A RouterLink styled as a Foren button — for navigation actions. Slots: default, leadingIcon, trailingIcon. */
import type { HTMLAttributes } from "vue";
import { RouterLink, type RouteLocationRaw } from "vue-router";
import { buttonVariants, type ButtonVariants } from "@/components/ui/foren-button";
import { cn } from "@/lib/utils";

const props = defineProps<{
  href: RouteLocationRaw;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  class?: HTMLAttributes["class"];
}>();
const slots = defineSlots<{ default?(): unknown; leadingIcon?(): unknown; trailingIcon?(): unknown }>();
</script>

<template>
  <RouterLink :to="href" :class="cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)">
    <slot name="leadingIcon" />
    <span v-if="slots.default"><slot /></span>
    <slot name="trailingIcon" />
  </RouterLink>
</template>
