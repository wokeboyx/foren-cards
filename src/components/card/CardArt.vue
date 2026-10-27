<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { RiSnowflakeLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Card } from "@/domain/types";
import { DESIGNS, EMERGENCY } from "./designs";

/** Card artwork. Test data only — never renders a full card number. */
const props = withDefaults(
  defineProps<{
    card: Pick<Card, "design" | "nickname" | "last4" | "kind" | "status">;
    holderName?: string;
    merchantName?: string;
    size?: "xs" | "sm" | "md" | "lg";
    class?: HTMLAttributes["class"];
    /** Shown under the nickname when there's no merchant yet, e.g. "Locks to first merchant". */
    lockText?: string;
    /** Wise-style: a frozen card shows a centred snowflake and "Frozen" over the art. */
    frozenOverlay?: boolean;
  }>(),
  { size: "md" }
);

const SIZE = {
  xs: "w-12 rounded-[6px]",
  sm: "w-[72px] rounded-[8px]",
  md: "w-[280px] max-w-full rounded-[16px]",
  lg: "w-[340px] max-w-full rounded-[20px]",
};

const emergency = computed(() => props.card.kind === "emergency");
const d = computed(() => DESIGNS[props.card.design]);
const text = computed(() => (emergency.value ? EMERGENCY.text : d.value.text));
const muted = computed(() => (emergency.value ? EMERGENCY.text : d.value.muted));
const small = computed(() => props.size === "xs" || props.size === "sm");
const dim = computed(() => props.card.status === "canceled" || props.card.status === "frozen");
const style = computed(() => ({
  background: emergency.value
    ? `repeating-linear-gradient(135deg, ${EMERGENCY.stops[0]} 0 14px, color-mix(in srgb, ${EMERGENCY.stripe} 14%, ${EMERGENCY.stops[0]}) 14px 28px)`
    : `linear-gradient(135deg, ${d.value.stops.join(", ")})`,
  color: text.value,
  border: emergency.value ? `2px dashed ${EMERGENCY.stripe}` : undefined,
}));
</script>

<template>
  <div
    role="img"
    :aria-label="`${card.nickname} card ending ${card.last4}${emergency ? ', emergency card' : ''}`"
    :class="cn('relative isolate aspect-[1.586] shrink-0 overflow-hidden shadow-[var(--shadow-foren-sm)]', SIZE[size], props.class)"
    :style="style"
  >
    <svg
      v-if="!emergency && d.pattern !== 'none'"
      class="absolute inset-0 -z-0 h-full w-full opacity-[0.09]"
      viewBox="0 0 340 214"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <template v-if="d.pattern === 'rings'">
        <circle v-for="r in [40, 80, 120, 160, 200]" :key="r" cx="320" cy="-10" :r="r" fill="none" :stroke="text" stroke-width="1.2" />
      </template>
      <template v-if="d.pattern === 'grid'">
        <line v-for="i in 14" :key="i" :x1="(i - 1) * 26" y1="0" :x2="(i - 1) * 26 - 60" y2="214" :stroke="text" stroke-width="1" />
      </template>
      <template v-if="d.pattern === 'waves'">
        <path
          v-for="i in [0, 1, 2, 3, 4, 5]"
          :key="i"
          :d="`M0 ${130 + i * 16} C 90 ${100 + i * 16}, 200 ${170 + i * 16}, 340 ${120 + i * 16}`"
          fill="none"
          :stroke="text"
          stroke-width="1.2"
        />
      </template>
    </svg>
    <div v-if="dim" class="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgba(255,255,255,0.18)_6px_8px)]" aria-hidden="true" />
    <div v-if="frozenOverlay && card.status === 'frozen' && !small" class="absolute inset-0 z-20 grid place-items-center bg-white/55 text-[#241c15] backdrop-blur-[2px]">
      <div class="flex flex-col items-center gap-1">
        <RiSnowflakeLine class="size-8" aria-hidden="true" />
        <span class="text-[14px] font-semibold">Frozen</span>
      </div>
    </div>
    <div v-if="!small" class="relative z-10 flex h-full flex-col justify-between p-[7%]">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <span
            v-if="emergency"
            class="inline-flex items-center rounded-full bg-[#b45309] px-2 py-0.5 text-[11px] font-bold tracking-[0.08em] text-white uppercase"
          >
            Emergency · single use
          </span>
          <span v-else class="block truncate text-[14px] font-semibold tracking-[0.01em]">{{ card.nickname }}</span>
          <span v-if="merchantName || lockText" class="mt-0.5 block truncate text-[12px] font-medium" :style="{ color: muted }">
            {{ merchantName ? `Locked to ${merchantName}` : lockText }}
          </span>
        </div>
        <svg viewBox="0 0 24 24" class="size-6 shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" :stroke="text" stroke-width="1.6" opacity="0.9" />
          <path d="M9 7.5h6.5M9 7.5v9M9 12h5" :stroke="text" stroke-width="1.8" stroke-linecap="round" fill="none" />
        </svg>
      </div>
      <div class="flex items-end justify-between gap-2">
        <div class="min-w-0">
          <span v-if="holderName" class="block truncate text-[12px] font-medium uppercase tracking-[0.06em]" :style="{ color: muted }">{{ holderName }}</span>
          <span class="tnum text-[16px] font-semibold tracking-[0.12em]">{{ card.last4 ? `•••• ${card.last4}` : "Requested" }}</span>
        </div>
        <span class="text-[11px] font-semibold uppercase tracking-[0.08em]" :style="{ color: muted }">Virtual</span>
      </div>
    </div>
  </div>
</template>
