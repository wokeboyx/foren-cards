<script setup lang="ts">
/** Top bar of a full-page flow (Figma "Fund with account details" frame): the Foren wordmark on the left, a round close button on the right, a hairline underneath. It stays in place while the page scrolls. */
import { RiCloseLine } from "@/components/icons";
import { asset } from "@/lib/base-path";

defineProps<{ closeLabel?: string; closable?: boolean }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <header
    class="z-40 flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-foren-border-muted)] bg-canvas px-5"
  >
    <img
      :src="asset('/onboarding/foren-wordmark.svg')"
      alt="Foren"
      width="100"
      height="24"
      class="ml-3 h-6 w-[100px]"
    />
    <button
      v-if="closable !== false"
      type="button"
      :aria-label="closeLabel ?? 'Close'"
      class="grid size-10 place-items-center rounded-full bg-surface text-fg shadow-[var(--shadow-foren-xs)] ring-1 ring-line outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
      @click="emit('close')"
    >
      <RiCloseLine class="size-5" aria-hidden="true" />
    </button>
  </header>
</template>
