<script setup lang="ts">
/**
 * Modal from the Foren Design System (Figma "Modal" + "Modal Header" + "Modal Footer"): white, 32px radius, 1px
 * muted border and the xl shadow. A header (title, one line under it, a round close button), a hairline, the content,
 * and an optional footer (a hairline, then actions right-aligned). Phones get the same thing as a bottom sheet.
 * Slots: default (content), title, description, footer.
 */
import type { HTMLAttributes } from "vue";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import { RiCloseLine } from "@/components/icons";
import { cn } from "@/lib/utils";

const props = defineProps<{
  open: boolean;
  title?: string;
  description?: string;
  class?: HTMLAttributes["class"];
}>();
const emit = defineEmits<{ "update:open": [open: boolean] }>();
const slots = defineSlots<{
  default(): unknown;
  title?(): unknown;
  description?(): unknown;
  footer?(): unknown;
}>();
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[75] bg-[#241c15]/40" />
      <DialogContent
        :class="
          cn(
            'fixed inset-x-0 bottom-0 z-[76] flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-t-[32px] border border-[var(--color-foren-border-muted)] bg-surface shadow-[0px_16px_32px_-8px_rgba(36,28,21,0.16)] outline-none',
            'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[calc(100dvh-32px)] sm:w-[calc(100vw-32px)] sm:max-w-[485px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[32px]',
            props.class,
          )
        "
      >
        <header
          class="flex shrink-0 items-start justify-between gap-2 pt-6 pr-6 pb-4 pl-4"
        >
          <div class="min-w-0 flex-1 pl-0">
            <DialogTitle
              class="text-[20px] leading-[30px] font-semibold tracking-[-0.2px] text-fg [font-feature-settings:'calt'_0]"
              ><slot name="title">{{ title }}</slot></DialogTitle
            >
            <DialogDescription v-if="description || slots.description" as-child>
              <div
                class="mt-1 text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg-2 [font-feature-settings:'calt'_0]"
              >
                <slot name="description">{{ description }}</slot>
              </div>
            </DialogDescription>
            <DialogDescription v-else class="sr-only">Dialog</DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            class="grid size-10 shrink-0 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] bg-white/10 text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
          >
            <RiCloseLine class="size-[22px]" aria-hidden="true" />
          </DialogClose>
        </header>
        <div class="h-px shrink-0 bg-[var(--color-foren-border-muted)]" />
        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4"><slot /></div>
        <template v-if="slots.footer">
          <div class="h-px shrink-0 bg-[var(--color-foren-border-muted)]" />
          <footer
            class="flex shrink-0 flex-col-reverse gap-3 px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-6"
          >
            <slot name="footer" />
          </footer>
        </template>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
