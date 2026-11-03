<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { RiSnowflakeLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Card } from "@/domain/types";
import { EMERGENCY, skinOf } from "./designs";

/**
 * Card face from the Foren Mobile Figma ("Card face"). Drawn on the design's 353 × 223 canvas and scaled with container units,
 * so every size matches the Figma proportions. Test data only: never renders a full card number.
 */
const props = withDefaults(
  defineProps<{
    card: Pick<Card, "design" | "nickname" | "last4" | "kind" | "status">;
    holderName?: string;
    merchantName?: string;
    size?: "xs" | "sm" | "md" | "lg";
    class?: HTMLAttributes["class"];
    /** Shown above the nickname when there's no merchant yet, e.g. "Locks to first merchant". */
    lockText?: string;
    /** The card's balance, drawn large on the face: whole part and the cents (with the dot). */
    balance?: { whole: string; cents: string };
  }>(),
  { size: "md" },
);

const SIZE = {
  xs: "w-12 rounded-[6px]",
  sm: "w-[72px] rounded-[8px]",
  md: "w-[280px] max-w-full rounded-[16px]",
  lg: "w-[340px] max-w-full rounded-[20px]",
};

/** Figma pixels on the 353-wide canvas, as container-width units. */
const u = (px: number) => `${((px * 100) / 353).toFixed(3)}cqw`;

const emergency = computed(() => props.card.kind === "emergency");
const frozen = computed(() => props.card.status === "frozen");
const canceled = computed(() => props.card.status === "canceled");
const d = computed(() => skinOf(props.card.design));
const small = computed(() => props.size === "xs" || props.size === "sm");
const pillText = computed(() =>
  frozen.value
    ? "Frozen"
    : props.card.kind === "disposable"
      ? "Disposable"
      : "Virtual",
);
const ink = computed(() => (emergency.value ? EMERGENCY.text : d.value.text));
const nick = computed(() => (emergency.value ? EMERGENCY.text : d.value.muted));
const style = computed(() => ({
  containerType: "inline-size" as const,
  background: emergency.value
    ? `repeating-linear-gradient(135deg, ${EMERGENCY.stops[0]} 0 14px, color-mix(in srgb, ${EMERGENCY.stripe} 14%, ${EMERGENCY.stops[0]}) 14px 28px)`
    : d.value.background,
  color: ink.value,
  border: emergency.value ? `2px dashed ${EMERGENCY.stripe}` : undefined,
}));
const ringRadii = [18, 36, 54, 72, 90, 108, 126];
const frost = computed(
  () =>
    `radial-gradient(ellipse 100% 100% at 50% 50%, rgba(255,255,255,0) 55%, rgba(242,249,254,0.3) 85%, rgba(255,255,255,0.5) 100%), linear-gradient(147.718deg, rgba(230,242,251,${d.value.light ? 0.42 : 0.34}) 0%, rgba(184,214,236,${d.value.light ? 0.3 : 0.22}) 55%, rgba(220,236,248,${d.value.light ? 0.42 : 0.32}) 100%)`,
);
</script>

<template>
  <div
    role="img"
    :aria-label="`${card.nickname} card ending ${card.last4}${emergency ? ', emergency card' : ''}${frozen ? ', frozen' : ''}`"
    :class="
      cn(
        'relative isolate aspect-[353/223] shrink-0 overflow-hidden shadow-[var(--shadow-foren-sm)]',
        SIZE[size],
        canceled && 'grayscale-[0.7] opacity-60',
        props.class,
      )
    "
    :style="style"
  >
    <!-- Artwork, on the 353 × 223 canvas: rings (Ink right, Chalk left), two circles (Cobalt), stripes (Clay), a disc (Lime) -->
    <svg
      v-if="!emergency"
      class="absolute inset-0 h-full w-full"
      viewBox="0 0 353 223"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <template v-if="d.art === 'rings-right'">
        <circle
          v-for="r in ringRadii"
          :key="r"
          cx="381.24"
          cy="263.14"
          :r="r"
          fill="none"
          :stroke="d.artColor"
          stroke-width="1.2"
        />
      </template>
      <template v-else-if="d.art === 'rings-left'">
        <circle
          v-for="r in ringRadii"
          :key="r"
          cx="-28.24"
          cy="267.6"
          :r="r"
          fill="none"
          :stroke="d.artColor"
          stroke-width="1.2"
        />
      </template>
      <template v-else-if="d.art === 'circles'">
        <circle
          cx="247.1"
          cy="285.44"
          r="170"
          :fill="d.artColor"
          opacity="0.5"
        />
        <circle cx="324.76" cy="245.3" r="140" :fill="d.artColor" />
      </template>
      <template v-else-if="d.art === 'stripes'">
        <rect
          v-for="i in 9"
          :key="i"
          :x="(i - 1) * 44"
          y="0"
          width="22"
          height="223"
          :fill="d.artColor"
        />
      </template>
      <circle
        v-else-if="d.art === 'disc'"
        cx="353"
        cy="223"
        r="175"
        :fill="d.artColor"
      />
    </svg>

    <!-- Frozen: frost over the same skin, a light edge and glow -->
    <template v-if="frozen">
      <div
        class="absolute inset-0"
        :style="{ background: frost, borderRadius: 'inherit' }"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-0 border border-solid border-white/75"
        :style="{
          borderRadius: 'inherit',
          boxShadow: `inset 0 0 ${u(18)} rgba(237,247,252,${d.light ? 0.9 : 0.75})`,
        }"
        aria-hidden="true"
      />
    </template>
    <div
      class="pointer-events-none absolute inset-0"
      :style="{
        borderRadius: 'inherit',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
      }"
      aria-hidden="true"
    />

    <template v-if="!small">
      <!-- Foren mark -->
      <svg
        viewBox="0 0 24 24"
        class="absolute"
        :style="{ left: u(20), top: u(20), width: u(22), height: u(22) }"
        aria-hidden="true"
      >
        <path
          d="M5 3h14.5l-1.6 4.2H10.2v3.3h6.2l-1.3 3.7h-4.9V21H5z"
          fill="currentColor"
        />
      </svg>
      <!-- Virtual / Frozen chip -->
      <span
        v-if="!emergency"
        class="absolute font-semibold tracking-[0.01em] uppercase"
        :style="{
          right: u(20),
          top: u(20),
          padding: `${u(5)} ${u(10)}`,
          borderRadius: '9999px',
          fontSize: u(12),
          lineHeight: u(18),
          background: d.pill.bg,
          color: d.pill.text,
        }"
      >
        {{ pillText }}
      </span>
      <span
        v-else
        class="absolute rounded-full bg-[#b45309] font-bold tracking-[0.08em] text-white uppercase"
        :style="{
          right: u(20),
          top: u(20),
          padding: `${u(4)} ${u(10)}`,
          fontSize: u(11),
        }"
        >Emergency · single use</span
      >

      <!-- Balance, big, under the mark -->
      <span
        v-if="balance"
        class="tnum absolute font-semibold"
        :style="{
          left: u(20),
          top: u(66),
          fontSize: u(34),
          lineHeight: u(42),
          letterSpacing: u(-0.7),
        }"
        data-testid="card-balance"
      >
        {{ balance.whole
        }}<span
          v-if="balance.cents"
          class="font-medium opacity-70"
          :style="{ fontSize: u(20) }"
          >{{ balance.cents }}</span
        >
      </span>

      <!-- Nickname and number, bottom left -->
      <div
        class="absolute"
        :style="{ left: u(20), bottom: u(20), right: u(110) }"
      >
        <span
          v-if="merchantName || lockText"
          class="block truncate font-medium"
          :style="{ fontSize: u(11), lineHeight: u(16), color: nick }"
        >
          {{ merchantName ? `Locked to ${merchantName}` : lockText }}
        </span>
        <span
          class="block truncate font-semibold"
          :style="{
            fontSize: u(12),
            lineHeight: u(18),
            letterSpacing: u(0.15),
            color: nick,
          }"
          >{{ card.nickname }}</span
        >
        <span
          class="tnum block font-medium"
          :style="{
            fontSize: u(16),
            lineHeight: u(24),
            letterSpacing: u(0.24),
          }"
          >{{ card.last4 ? `•• ${card.last4}` : "Requested" }}</span
        >
      </div>
      <!-- Debit mark, bottom right -->
      <span
        class="absolute font-extrabold italic"
        :style="{ right: u(20), bottom: u(20), fontSize: u(17) }"
        >Debit</span
      >

      <!-- Frozen badge in the middle -->
      <span
        v-if="frozen && !balance"
        class="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-solid border-white bg-white/80 text-[#3b5973] shadow-[0_4px_14px_-4px_rgba(59,89,115,0.35)] backdrop-blur-[4px]"
        :style="{ width: u(44), height: u(44) }"
        aria-hidden="true"
      >
        <RiSnowflakeLine :style="{ width: u(20), height: u(20) }" />
      </span>
    </template>
  </div>
</template>
