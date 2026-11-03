<script setup lang="ts">
/** Route-level fallback while client-only state (URL params, local data) resolves. */
import { COPY } from "@/content/copy";
import Skeleton from "./Skeleton.vue";
</script>

<template>
  <div class="space-y-4" aria-busy="true">
    <Skeleton class="h-8 w-48" />
    <Skeleton class="h-4 w-80 max-w-full" />
    <Skeleton class="h-64 w-full rounded-[20px]" />
    <span class="sr-only">{{ COPY.loading }}</span>
  </div>
</template>
