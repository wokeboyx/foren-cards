<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "./data";

const props = withDefaults(defineProps<{ code: string; size?: number; class?: HTMLAttributes["class"] }>(), { size: 24 });
</script>

<template>
  <img
    :src="CURRENCIES[props.code]?.flag"
    alt=""
    :width="size"
    :height="size"
    :class="cn('shrink-0 rounded-full', props.class)"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>
