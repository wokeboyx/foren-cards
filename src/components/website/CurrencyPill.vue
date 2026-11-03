<script setup lang="ts">
// Figma "Currency Selector" pill, with a native select laid over it for keyboard and screen readers.
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "./data";
import Flag from "./Flag.vue";
import { ink } from "./shared";

defineProps<{ options: string[]; label: string }>();
const value = defineModel<string>({ required: true });
</script>

<template>
  <div
    class="relative inline-flex h-9 items-center gap-2 rounded-full border border-[#eee] bg-[rgba(216,214,213,0.4)] pr-2.5 pl-1.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/30"
  >
    <Flag :code="value" />
    <span :class="cn('text-[14px] font-semibold tracking-[0.175px]', ink)">{{
      value
    }}</span>
    <img
      :src="asset('/website/chevron.svg')"
      alt=""
      width="18"
      height="18"
      class="size-[18px]"
    />
    <select
      :aria-label="label"
      :value="value"
      class="absolute inset-0 cursor-pointer opacity-0"
      @change="value = ($event.target as HTMLSelectElement).value"
    >
      <option v-for="o in options" :key="o" :value="o">
        {{ o }} · {{ CURRENCIES[o].name }}
      </option>
    </select>
  </div>
</template>
