<script setup lang="ts">
import { COPY } from "@/content/copy";
import Skeleton from "./Skeleton.vue";

withDefaults(defineProps<{ rows?: number }>(), { rows: 5 });
</script>

<template>
  <div aria-busy="true" :aria-label="COPY.loading" class="divide-y divide-line">
    <div v-for="i in rows" :key="i" class="flex items-center gap-4 px-4 py-4">
      <Skeleton class="h-8 w-12 rounded-[6px]" />
      <div class="flex-1 space-y-2">
        <Skeleton class="h-3.5 w-40" />
        <Skeleton class="h-3 w-24" />
      </div>
      <Skeleton class="h-3.5 w-20" />
    </div>
    <span class="sr-only">{{ COPY.loading }}</span>
  </div>
</template>
