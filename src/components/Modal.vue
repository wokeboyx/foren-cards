<script setup lang="ts">
/** Centered modal dialog for confirmations and short tasks. Slots: default, title, description. */
import type { HTMLAttributes } from "vue";
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from "reka-ui";
import { RiCloseLine } from "@/components/icons";
import { cn } from "@/lib/utils";

const props = defineProps<{ open: boolean; title?: string; description?: string; class?: HTMLAttributes["class"] }>();
const emit = defineEmits<{ "update:open": [open: boolean] }>();
const slots = defineSlots<{ default(): unknown; title?(): unknown; description?(): unknown }>();
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[60] bg-[#241c15]/40" />
      <DialogContent
        :class="
          cn(
            // Phones: bottom sheet with rounded top (Figma responsive &quot;Modal&quot;); larger screens: centred.
            'fixed inset-x-0 bottom-0 z-[70] max-h-[calc(100dvh-24px)] w-full overflow-y-auto rounded-t-[24px] bg-surface p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[var(--shadow-foren-xl)] outline-none',
            'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[calc(100dvh-32px)] sm:w-[calc(100vw-32px)] sm:max-w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] sm:pb-6',
            props.class
          )
        "
      >
        <DialogClose
          aria-label="Close"
          class="absolute top-5 right-5 grid size-8 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
        >
          <RiCloseLine class="size-[18px]" aria-hidden="true" />
        </DialogClose>
        <DialogTitle class="pr-10 text-[18px] leading-[28px] font-semibold tracking-[-0.01em] text-fg"><slot name="title">{{ title }}</slot></DialogTitle>
        <DialogDescription v-if="description || slots.description" as-child>
          <div class="mt-2 text-[14px] leading-[22px] text-fg-2"><slot name="description">{{ description }}</slot></div>
        </DialogDescription>
        <DialogDescription v-else class="sr-only">Dialog</DialogDescription>
        <div class="mt-5"><slot /></div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
