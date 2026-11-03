<script setup lang="ts">
import { computed, useSlots, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { badgeVariants, dotColors, type BadgeColor } from "./foren-badge";

const props = withDefaults(
  defineProps<{
    color?: BadgeColor;
    size?: "sm" | "md" | "lg";
    /** Show a leading status dot tinted to the badge color. */
    dot?: boolean;
    /** When a `@dismiss` listener is set, renders a dismiss "×" that calls it on click. */
    onDismiss?: () => void;
    /** Aria label for the dismiss button. */
    dismissLabel?: string;
    class?: HTMLAttributes["class"];
  }>(),
  { dismissLabel: "Dismiss" },
);
/** `leadingIcon` slot — flag, avatar img, icon. Wins over `dot` when both are set. */
const slots = defineSlots<{ default?(): unknown; leadingIcon?(): unknown }>();
const live = useSlots();
const iconOnly = computed(
  () => !live.default && (!!live.leadingIcon || props.dot),
);
</script>

<template>
  <span
    :class="
      cn(
        badgeVariants({ color: props.color, size: props.size, iconOnly }),
        props.class,
      )
    "
  >
    <span
      v-if="!slots.leadingIcon && dot"
      aria-hidden="true"
      :class="cn('size-1.5 rounded-full', dotColors[color ?? 'gray'])"
    />
    <slot name="leadingIcon" />
    <span v-if="slots.default"><slot /></span>
    <button
      v-if="onDismiss"
      type="button"
      :aria-label="dismissLabel"
      class="-mr-1 inline-flex items-center justify-center size-4 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-current"
      @click.stop="onDismiss?.()"
    >
      <span class="size-3">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </span>
    </button>
  </span>
</template>
