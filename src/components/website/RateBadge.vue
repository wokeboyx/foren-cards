<script setup lang="ts">
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { ink } from "./shared";

defineProps<{ icon: string }>();
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex h-6 items-center gap-1 rounded-[16px] bg-[#f8f8f8] px-2 text-[12px] font-medium mix-blend-multiply',
        ink,
      )
    "
  >
    <img :src="asset(icon)" alt="" width="14" height="14" class="size-3.5" />
    <slot />
  </span>
</template>
