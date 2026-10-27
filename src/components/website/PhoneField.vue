<script setup lang="ts">
// WhatsApp number: country code pill + number.
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { DIAL_CODES, dialFor } from "./data";
import { ink, inputCls } from "./shared";

defineProps<{ id: string; invalid?: boolean }>();
const dial = defineModel<string>("dial", { required: true });
const number = defineModel<string>("number", { required: true });
const current = computed(() => dialFor(dial.value));

function onNumber(e: Event) {
  const el = e.target as HTMLInputElement;
  const next = el.value.replace(/[^\d ]/g, "");
  // Keep the field showing the cleaned value even when it equals the previous model value.
  el.value = next;
  number.value = next;
}
</script>

<template>
  <div class="flex gap-2">
    <div
      class="relative flex h-12 shrink-0 items-center gap-2 rounded-[16px] border border-[#e6e4e2] bg-white px-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/15"
    >
      <img :src="current.flag" alt="" width="20" height="20" class="size-5 rounded-full" />
      <span :class="cn('text-[15px] font-medium', ink)">{{ current.code }}</span>
      <select aria-label="Country code" :value="dial" class="absolute inset-0 cursor-pointer opacity-0" @change="dial = ($event.target as HTMLSelectElement).value">
        <option v-for="d in DIAL_CODES" :key="d.iso" :value="d.iso">{{ d.country }} ({{ d.code }})</option>
      </select>
    </div>
    <input
      :id="id"
      type="tel"
      inputmode="tel"
      autocomplete="tel-national"
      placeholder="803 000 0000"
      :value="number"
      :aria-invalid="invalid"
      :class="cn(inputCls, 'min-w-0 flex-1')"
      @input="onNumber"
    />
  </div>
</template>
