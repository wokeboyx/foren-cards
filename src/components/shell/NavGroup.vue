<script setup lang="ts">
import NavEntry from "./NavEntry.vue";
import type { NavItem } from "./nav";

defineProps<{ title?: string; items: NavItem[]; pathname: string }>();
const emit = defineEmits<{ navigate: [] }>();
</script>

<template>
  <div class="space-y-1">
    <div v-if="title" class="flex h-6 items-center px-3 text-[12px] font-semibold tracking-[0.01em] text-fg-3 uppercase">{{ title }}</div>
    <ul class="space-y-1">
      <NavEntry v-for="it in items" :key="it.label" :item="it" :pathname="pathname" @navigate="emit('navigate')" />
    </ul>
  </div>
</template>
