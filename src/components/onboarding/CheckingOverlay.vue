<script setup lang="ts">
/** Full-screen "Checking…" overlay with the Foren mark (Figma "Checking" frame). */
import { asset } from "@/lib/base-path";

withDefaults(defineProps<{ label?: string }>(), { label: "Checking…" });
</script>

<template>
  <div role="status" aria-live="polite" class="fixed inset-0 z-50 grid place-items-center bg-[#241c15]/45 backdrop-blur-[1px] animate-[fade-in_150ms_ease-out]">
    <span class="grid size-12 animate-pulse place-items-center rounded-[12px] bg-white shadow-[var(--shadow-foren-lg)]">
      <img :src="asset('/foren-logo.svg')" alt="" width="22" height="22" />
    </span>
    <span class="sr-only">{{ label }}</span>
  </div>
</template>
