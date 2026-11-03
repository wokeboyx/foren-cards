<script setup lang="ts">
/**
 * Frame of the Figma full-page flows (create, request, fund, success): a white page with an 8px inset, and on it
 * the grey (#f8f8f8) panel with a 20px radius and the xs shadow. The header (wordmark, round close button) sits in the
 * panel above a hairline. Buttons live in a white bar under the panel, full width, with a hairline on top. Their
 * right edge lines up with the right edge of the form column (`width`), not the edge of the page.
 */
import { cn } from "@/lib/utils";
import FocusHeader from "./FocusHeader.vue";

withDefaults(
  defineProps<{
    /** Centre the content vertically and horizontally (success pages). */
    center?: boolean;
    /** The form column's width in px, which the button bar lines up with. */
    width?: number;
    /** A preview panel sits on the right at lg+, so the column (and the bar) shift left to make room. */
    aside?: boolean;
    /** Hide the close button (while something is being processed). */
    closable?: boolean;
  }>(),
  { width: 640, closable: true },
);
const emit = defineEmits<{ close: [] }>();
defineSlots<{ default(): unknown; footer?(): unknown }>();
</script>

<template>
  <!-- Fixed height: the header and the button bar never move, and only the content between them scrolls. Nothing is sticky, so nothing shakes. -->
  <div class="flex h-dvh flex-col overflow-hidden bg-surface px-2 pt-2">
    <div
      class="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-canvas shadow-[0px_1px_2px_0px_rgba(36,28,21,0.05)]"
    >
      <FocusHeader :closable="closable" @close="emit('close')" />
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          :class="
            cn(
              'relative flex min-h-full flex-col',
              center && 'items-center justify-center py-10',
            )
          "
        >
          <slot />
        </div>
      </div>
    </div>
    <div
      v-if="$slots.footer"
      class="z-20 -mx-2 mt-2 shrink-0 border-t border-[var(--color-foren-border-muted)] bg-white"
    >
      <div
        :class="
          cn(
            'flex h-[72px] items-center',
            aside && 'lg:pr-[calc(min(42vw,560px)+48px)]',
          )
        "
      >
        <div
          class="mx-auto flex w-full justify-end gap-8 px-5 sm:px-8"
          :style="{ maxWidth: `${width}px` }"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
    <div v-else class="h-2" />
  </div>
</template>
