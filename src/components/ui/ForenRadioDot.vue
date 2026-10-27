<script setup lang="ts">
import { computed } from "vue";
import { dotVariants, type RadioSize } from "./foren-radio";

const props = defineProps<{ checked: boolean; size: RadioSize; disabled: boolean }>();
const innerSize = computed(() => (props.size === "sm" ? 6 : props.size === "md" ? 8 : 10));
</script>

<template>
  <span :class="dotVariants({ size, checked, disabled })">
    <span
      aria-hidden="true"
      class="rounded-full bg-white transition-[transform,opacity] duration-150 ease-out"
      :style="{
        width: `${innerSize}px`,
        height: `${innerSize}px`,
        transform: checked ? 'scale(1)' : 'scale(0)',
        opacity: checked ? 1 : 0,
      }"
    />
  </span>
</template>
