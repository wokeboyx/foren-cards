<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** Selected rows tint and keep the tint on hover. */
    selected?: boolean;
    /** Adds the hover tint and a pointer cursor. Implied by a `@click` listener. */
    interactive?: boolean;
    /** Drop the bottom divider — use on the last row when a footer follows. */
    last?: boolean;
    onClick?: (e: MouseEvent) => void;
    class?: HTMLAttributes["class"];
  }>(),
  { selected: false, interactive: undefined, last: false }
);
const isInteractive = computed(() => props.interactive ?? !!props.onClick);
</script>

<template>
  <tr
    :class="
      cn(
        'h-16 transition-colors duration-150',
        !last && 'border-b border-[var(--color-foren-border-muted)]',
        selected ? 'bg-[var(--color-foren-bg-subtle)]' : isInteractive && 'hover:bg-[var(--color-foren-bg-sunken)]',
        isInteractive && 'cursor-pointer',
        props.class
      )
    "
    @click="onClick?.($event)"
  >
    <slot />
  </tr>
</template>
