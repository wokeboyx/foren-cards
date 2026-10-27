<script setup lang="ts">
import { RouterLink } from "vue-router";

defineProps<{ title: string; edit: string }>();
</script>

<template>
  <section class="flex flex-col gap-4 rounded-[12px] bg-surface p-4" :aria-label="title">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-[16px] leading-6 font-medium text-fg">{{ title }}</h2>
      <RouterLink
        :to="edit"
        class="text-[12px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus"
      >
        Edit<span class="sr-only"> {{ title.toLowerCase() }}</span>
      </RouterLink>
    </div>
    <slot />
  </section>
</template>
