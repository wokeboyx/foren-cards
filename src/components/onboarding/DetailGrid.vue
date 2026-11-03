<script setup lang="ts">
/** Two-column label/value grid used by the registry card and the review page. A `value-<index>` slot overrides an item's value. */
import { cn } from "@/lib/utils";
import type { DetailItem } from "./shared";

defineProps<{ items: DetailItem[] }>();
</script>

<template>
  <dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
    <div
      v-for="(it, i) in items"
      :key="it.label"
      :class="cn('flex min-w-0 flex-col gap-1', it.wide && 'sm:col-span-2')"
    >
      <dt class="text-[12px] leading-[18px] font-medium text-fg-3">
        {{ it.label }}
      </dt>
      <dd class="text-[14px] leading-[21px] font-medium break-words text-fg">
        <slot :name="`value-${i}`">{{ it.value || "—" }}</slot>
      </dd>
    </div>
  </dl>
</template>
