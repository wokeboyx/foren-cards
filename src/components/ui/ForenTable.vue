<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** Accessible name for the table. */
    caption?: string;
    /** Visually hide the caption but keep it for screen readers. Default true. */
    hideCaption?: boolean;
    /** Minimum table width before the container scrolls horizontally. */
    minWidth?: number | string;
    class?: HTMLAttributes["class"];
  }>(),
  { hideCaption: true, minWidth: 640 }
);
/** `footer`: rendered below the table, inside the same shell — usually <ForenTablePagination />. */
defineSlots<{ default?(): unknown; caption?(): unknown; footer?(): unknown }>();
</script>

<template>
  <!-- No outer stroke — the design frame is rounded and clipped, and the only
       1px rules are the horizontal dividers between header, rows and footer.
       Pass a border through class if a surrounding surface needs one.
       rounded-lg is the project's 12px step, matching the design frame. -->
  <div :class="cn('overflow-hidden rounded-lg bg-[var(--color-foren-bg-default)]', props.class)">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left" :style="{ minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }">
        <caption v-if="caption || $slots.caption" :class="hideCaption ? 'sr-only' : 'px-4 py-3 text-left text-[13px] text-[var(--color-foren-text-secondary)]'">
          <slot name="caption">{{ caption }}</slot>
        </caption>
        <slot />
      </table>
    </div>
    <div v-if="$slots.footer" class="border-t border-[var(--color-foren-border-muted)]"><slot name="footer" /></div>
  </div>
</template>
