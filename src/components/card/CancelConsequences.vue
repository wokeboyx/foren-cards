<script setup lang="ts">
import { RiCloseCircleLine, RiForbidLine, RiSnowflakeLine } from "@remixicon/vue";

/** Revolut-style list of what cancelling does, with the reversible alternative called out. */
defineProps<{ canFreeze: boolean }>();
const row = "flex items-start gap-2.5 [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0";
</script>

<template>
  <ul class="space-y-2.5 rounded-[16px] bg-subtle px-4 py-3 text-[14px] leading-[20px] text-fg">
    <li :class="row">
      <RiCloseCircleLine aria-hidden="true" class="text-error" />
      This card can’t be used again. This can’t be undone.
    </li>
    <li :class="row">
      <RiForbidLine aria-hidden="true" class="text-fg-2" />
      New charges and subscriptions on it will be declined.
    </li>
    <li v-if="canFreeze" :class="row">
      <RiSnowflakeLine aria-hidden="true" class="text-fg-2" />
      To pause spending instead, freeze it. You can unfreeze it later.
    </li>
  </ul>
</template>
