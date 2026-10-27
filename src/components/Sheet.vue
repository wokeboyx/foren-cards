<script setup lang="ts">
/** Side sheet: a right-hand panel on desktop, full-screen on narrow screens (§4, §11). Slots: default, title, description, footer. */
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from "reka-ui";
import { RiCloseLine } from "@/components/icons";

withDefaults(defineProps<{ open: boolean; title?: string; description?: string; width?: number }>(), { width: 489 });
const emit = defineEmits<{ "update:open": [open: boolean] }>();
const slots = defineSlots<{ default(): unknown; title?(): unknown; description?(): unknown; footer?(): unknown }>();
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-[#241c15]/30 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
      <!-- Figma drawer: full height, square edges, 489px; white header with 40px round close and a muted divider. -->
      <DialogContent
        class="fixed inset-0 z-50 flex flex-col bg-surface shadow-[var(--shadow-foren-xl)] outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[var(--w)] data-[state=open]:animate-[sheet-in_220ms_cubic-bezier(0.2,0.8,0.2,1)]"
        :style="{ '--w': `${width}px` }"
      >
        <div class="flex items-center justify-between gap-4 border-b border-line px-4 pt-6 pb-5">
          <div class="min-w-0">
            <DialogTitle class="truncate text-[18px] leading-[28px] font-semibold tracking-[-0.01em] text-fg"><slot name="title">{{ title }}</slot></DialogTitle>
            <DialogDescription v-if="description || slots.description" class="mt-1 text-[14px] leading-[21px] text-fg-3">
              <slot name="description">{{ description }}</slot>
            </DialogDescription>
            <DialogDescription v-else class="sr-only">Details</DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            class="grid size-10 shrink-0 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
          >
            <RiCloseLine class="size-[22px]" aria-hidden="true" />
          </DialogClose>
        </div>
        <div class="flex-1 overflow-y-auto"><slot /></div>
        <div v-if="slots.footer" class="flex min-h-[84px] items-center border-t border-line px-5 py-2"><slot name="footer" /></div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
