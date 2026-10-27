<script setup lang="ts">
// Card front (full test number, large enough for a phone camera to read) or back (security code).
import { computed } from "vue";
import type { Card } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { nameOnCard } from "./holder";
import { DESIGNS } from "./designs";

const props = defineProps<{ card: Card; side: "front" | "back"; masked?: boolean }>();

const face = "relative isolate aspect-[1.586] w-full overflow-hidden rounded-[16px] shadow-[var(--shadow-foren-sm)]";
const d = computed(() => DESIGNS[props.card.design]);
const bg = computed(() => ({ background: `linear-gradient(135deg, ${d.value.stops.join(", ")})`, color: d.value.text }));
// On a phone nothing is scanned, so the number stays masked.
const pan = computed(() => (props.masked ? `•••• •••• •••• ${props.card.last4}` : `4000 0012 3456 ${props.card.last4}`));
const exp = computed(() => `${props.card.expiry.slice(5)}/${props.card.expiry.slice(2, 4)}`);
</script>

<template>
  <div v-if="side === 'front'" role="img" :aria-label="`Front of ${card.nickname}: ${pan}, expires ${exp}`" :class="face" :style="bg">
    <div class="flex h-full flex-col justify-between p-[7%]">
      <div class="flex items-start justify-between">
        <span class="text-[13px] font-semibold">{{ COMPANY.name }}</span>
        <span class="text-[11px] font-semibold tracking-[0.08em] uppercase" :style="{ color: d.muted }">Virtual</span>
      </div>
      <div>
        <div class="tnum font-mono text-[19px] font-semibold tracking-[0.08em]">{{ pan }}</div>
        <div class="mt-2 flex items-end justify-between gap-2 text-[12px] font-medium uppercase tracking-[0.06em]" :style="{ color: d.muted }">
          <span class="truncate">{{ nameOnCard(card) }}</span>
          <span class="tnum shrink-0">{{ exp }}</span>
        </div>
      </div>
    </div>
  </div>
  <div v-else role="img" :aria-label="`Back of ${card.nickname}: security code 123`" :class="face" :style="bg">
    <div class="mt-[9%] h-[18%] bg-[#17120d]" />
    <div class="mt-[7%] flex items-center gap-3 px-[7%]">
      <div class="h-8 flex-1 rounded-[4px] bg-white/85" />
      <div class="tnum rounded-[4px] bg-white px-2.5 py-1 font-mono text-[16px] font-semibold text-[#241c15]">123</div>
    </div>
    <div class="absolute bottom-[8%] left-[7%] text-[11px] font-medium" :style="{ color: d.muted }">Security code</div>
  </div>
</template>
