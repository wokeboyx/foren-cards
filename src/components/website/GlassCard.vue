<script setup lang="ts">
// The frosted card from the calculator in the website Figma (node 3011:4384).
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div
    :class="
      cn(
        'relative w-full rounded-[40px] border border-[rgba(192,225,250,0.2)] bg-gradient-to-b from-[rgba(216,237,255,0.1)] to-[#d8edff] to-[168.8%] p-4 backdrop-blur-[16px]',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
