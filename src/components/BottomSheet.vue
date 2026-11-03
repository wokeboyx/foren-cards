<script setup lang="ts">
/** Bottom sheet for the phone-only personal track: slides up, dismiss by tapping outside or Close. Slots: default, title, description. */
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
import ForenButton from "@/components/ui/ForenButton.vue";

defineProps<{ open: boolean; title?: string; description?: string }>();
const emit = defineEmits<{ "update:open": [open: boolean] }>();
const slots = defineSlots<{
  default(): unknown;
  title?(): unknown;
  description?(): unknown;
}>();
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[60] bg-[#241c15]/40 data-[state=open]:animate-[fade-in_150ms_ease-out]"
      />
      <DialogContent
        class="fixed inset-x-0 bottom-0 z-[70] mx-auto flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-[28px] bg-surface shadow-[var(--shadow-foren-xl)] outline-none data-[state=open]:animate-[sheet-up_260ms_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        <div
          class="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-2"
          aria-hidden="true"
        />
        <div class="flex items-start justify-between gap-4 px-5 pt-3 pb-2">
          <div class="min-w-0">
            <DialogTitle
              class="text-[18px] leading-[24px] font-semibold tracking-[-0.01em] text-fg"
              ><slot name="title">{{ title }}</slot></DialogTitle
            >
            <DialogDescription
              v-if="description || slots.description"
              class="mt-0.5 text-[13px] leading-[18px] text-fg-3"
            >
              <slot name="description">{{ description }}</slot>
            </DialogDescription>
            <DialogDescription v-else class="sr-only"
              >Details</DialogDescription
            >
          </div>
          <DialogClose as-child>
            <ForenButton
              variant="ghost"
              size="xs"
              aria-label="Close"
              class="-mr-2 px-2.5"
            >
              <template #leadingIcon><RiCloseLine /></template>
            </ForenButton>
          </DialogClose>
        </div>
        <div
          class="flex-1 overflow-y-auto px-5 pt-2 pb-[max(20px,env(safe-area-inset-bottom))]"
        >
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
