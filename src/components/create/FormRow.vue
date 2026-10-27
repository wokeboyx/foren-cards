<script setup lang="ts">
/** One section of the card form: a labelled two-column row when editing, a plain block in the stepped create flow. */
defineProps<{ id?: string; label: string; hint?: string; stepped?: boolean; sub?: boolean }>();
</script>

<template>
  <section v-if="stepped" :id="id ? `section-${id}` : undefined" :aria-label="label" class="scroll-mt-6 space-y-4 py-4">
    <h2 v-if="sub" class="text-[15px] font-semibold text-fg">{{ label }}</h2>
    <slot />
  </section>
  <section v-else :id="id ? `section-${id}` : undefined" :aria-label="label" class="grid scroll-mt-6 gap-3 border-b border-line py-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
    <h2 class="pt-0.5 text-[14px] font-medium text-fg-2">
      {{ label }}
      <span v-if="hint" class="block text-[12px] font-normal text-fg-3">{{ hint }}</span>
    </h2>
    <div class="min-w-0 space-y-4"><slot /></div>
  </section>
</template>
