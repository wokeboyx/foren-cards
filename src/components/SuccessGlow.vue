<script setup lang="ts">
/** The soft green and pink glow along the bottom edge of the Figma success screens. Behind everything, never in the way. */
import { asset } from "@/lib/base-path";
</script>

<template>
  <div
    class="pointer-events-none absolute inset-x-0 bottom-0 h-[180px] overflow-hidden [mask-image:linear-gradient(to_top,black_30%,transparent)]"
    aria-hidden="true"
  >
    <img
      :src="asset('/foren/success/glow-left.svg')"
      alt=""
      class="absolute bottom-[-250px] left-[calc(50%-1300px)] w-[1974px] max-w-none -scale-y-100 opacity-70"
    />
    <img
      :src="asset('/foren/success/glow-right.svg')"
      alt=""
      class="absolute bottom-[-250px] left-[calc(50%-900px)] w-[1974px] max-w-none -scale-y-100 opacity-70"
    />
  </div>
</template>
