<script setup lang="ts">
/** The green 3D check from the Figma money flows ("Request sent"), used on every success screen. Decorative: the title next to it says what happened. */
import { asset } from "@/lib/base-path";

withDefaults(defineProps<{ size?: number }>(), { size: 100 });
</script>

<template>
  <span
    class="relative block shrink-0 overflow-hidden"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <img
      :src="asset('/foren/success/check.png')"
      alt=""
      class="absolute -top-[10%] -left-[10%] size-[120%] max-w-none"
      draggable="false"
    />
  </span>
</template>
