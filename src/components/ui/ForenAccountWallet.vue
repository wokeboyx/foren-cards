<script setup lang="ts">
/**
 * A leather card holder that surfaces multi-currency account balances.
 *
 * Renders the empty state when `accounts` is empty. Fixed at 356x306: the
 * pocket's clip-path is in absolute user units, so the object cannot be scaled
 * without regenerating its geometry.
 */
import { computed } from "vue";
import ForenWalletPill from "./ForenWalletPill.vue";
import ForenWalletSeatedCard from "./ForenWalletSeatedCard.vue";
import ForenWalletStitch from "./ForenWalletStitch.vue";
import {
  ASSETS,
  BACK_PANEL_LIGHT,
  BULGE,
  CARD_HEIGHT,
  CARD_RADIUS,
  CARD_TOP,
  CARD_WIDTH,
  CREASES,
  DEFAULT_METALS,
  EMPTY_HEADER_TOP,
  HEADER_TOP,
  HEADER_WIDTH,
  HIDE_SIZE,
  MARK_INSET,
  MARK_PATH,
  MAX_VISIBLE,
  NOTCH_PATH,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PANEL_X,
  PERIMETER,
  POCKET_TOP,
  REST_TILTS,
  SHEEN,
  STITCH_PATH,
  TOP_CONTOUR_PATH,
  WALLET_HEIGHT,
  WALLET_RADIUS,
  WALLET_STITCH_PATH,
  WALLET_WIDTH,
  type ForenAccount,
} from "./foren-account-wallet";

const props = withDefaults(
  defineProps<{
    /**
     * Accounts to seat in the pocket, front-most first. At most three are shown —
     * see CARD_STACK_STEP for why. An empty array renders the empty state.
     */
    accounts?: ForenAccount[];
    /** Count shown as "{n} more accounts..." on the pocket face. */
    moreCount?: number;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyActionLabel?: string;
    class?: string;
  }>(),
  {
    accounts: () => [],
    emptyTitle: "Open your first account",
    emptyDescription: "Hold, collect, and settle in USD, GBP, CAD, and more.",
    emptyActionLabel: "Open account",
  }
);
const emit = defineEmits<{ viewAll: []; openAccount: [] }>();

const visible = computed(() => props.accounts.slice(0, MAX_VISIBLE));
const isEmpty = computed(() => visible.value.length === 0);
/* `accounts` is front to back, so index doubles as stacking depth. The list is reversed for
   rendering because paint order is what layers the stack: the back-most card must be emitted
   first so the front card covers it. */
const seated = computed(() =>
  visible.value
    .map((account, depth) => ({ account, depth }))
    .reverse()
);
const notchClip = `path("${NOTCH_PATH}")`;
const px = (n: number) => `${n}px`;
</script>

<template>
  <div :class="`relative ${props.class ?? ''}`" :style="{ width: px(WALLET_WIDTH), height: px(WALLET_HEIGHT) }">
    <!-- Everything behind the pocket's contents, clipped to the silhouette. -->
    <div class="absolute inset-0 overflow-clip bg-white" :style="{ borderRadius: px(WALLET_RADIUS) }">
      <div class="absolute bottom-0 left-0" :style="{ width: px(HIDE_SIZE), height: px(HIDE_SIZE) }">
        <img :src="`${ASSETS}/leather.jpg`" alt="" class="absolute inset-0 h-full w-full object-cover" fetchpriority="high" />
        <div class="absolute inset-0" :style="{ backgroundImage: BACK_PANEL_LIGHT }" />
      </div>
      <!-- Perimeter seam, back-panel run: plain, beneath the cards (a card lies in front of it and must cover it). -->
      <svg class="pointer-events-none absolute inset-0" :width="WALLET_WIDTH" :height="WALLET_HEIGHT" :viewBox="`0 0 ${WALLET_WIDTH} ${WALLET_HEIGHT}`" fill="none" aria-hidden="true">
        <ForenWalletStitch :d="WALLET_STITCH_PATH" />
      </svg>
    </div>

    <!-- Contents sit between the two clipped groups and are themselves unclipped, so a card lifted
         on hover rises past the wallet's top edge instead of having its top sliced off by the silhouette. -->
    <div
      v-if="isEmpty"
      class="absolute left-1/2 -translate-x-1/2"
      :style="{
        top: px(CARD_TOP),
        width: px(CARD_WIDTH),
        height: px(CARD_HEIGHT),
        borderRadius: px(CARD_RADIUS),
        background: '#1e1f1e',
        border: '1px dashed rgba(255,255,255,0.12)',
      }"
      aria-hidden="true"
    />
    <template v-else>
      <ForenWalletSeatedCard
        v-for="{ account, depth } in seated"
        :key="account.label"
        :account="account"
        :metal="account.metal ?? DEFAULT_METALS[depth % DEFAULT_METALS.length]"
        :depth="depth"
        :rest-tilt="REST_TILTS[depth % REST_TILTS.length]"
      />
    </template>

    <!-- The pocket and everything in front of it. -->
    <div class="pointer-events-none absolute inset-0 overflow-clip" :style="{ borderRadius: px(WALLET_RADIUS) }">
      <!-- Contact occlusion where the pocket meets what is behind it. Deliberately not a directional
           drop shadow — with light from above a raised pocket casts downward onto surfaces it already hides. -->
      <div
        class="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-px"
        :style="{ width: px(PANEL_WIDTH), height: px(PANEL_HEIGHT), filter: 'blur(5px)' }"
        aria-hidden="true"
      >
        <div class="size-full bg-black/80" :style="{ clipPath: notchClip }" />
      </div>

      <!-- Notched panel. Hit-testable, so it shields the contents behind it. -->
      <div class="pointer-events-auto absolute bottom-0 left-1/2 -translate-x-1/2" :style="{ width: px(PANEL_WIDTH), height: px(PANEL_HEIGHT), clipPath: notchClip }">
        <div class="relative size-full">
          <img :src="`${ASSETS}/leather.jpg`" alt="" class="absolute inset-0 h-full w-full object-cover" />
          <div class="absolute inset-0" :style="{ backgroundImage: 'linear-gradient(to bottom, #222222, #000000)', opacity: 0.78 }" />
          <div class="absolute inset-0" :style="{ backgroundImage: BULGE }" aria-hidden="true" />
          <svg class="absolute inset-0 size-full" :viewBox="`0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}`" fill="none" aria-hidden="true">
            <!-- Mouth wear. Three concentric strokes stand in for a blurred band — the panel's clip
                 drops their outer halves, giving an inward fade without a filter. -->
            <g fill="none" stroke="#000">
              <path :d="TOP_CONTOUR_PATH" stroke-width="22" stroke-opacity="0.05" />
              <path :d="TOP_CONTOUR_PATH" stroke-width="13" stroke-opacity="0.06" />
              <path :d="TOP_CONTOUR_PATH" stroke-width="6" stroke-opacity="0.07" />
            </g>
            <g fill="none" stroke-width="0.8" stroke-linecap="round">
              <path v-for="d in CREASES" :key="`dark-${d}`" :d="d" stroke="rgba(0,0,0,0.34)" transform="translate(0 -0.4)" />
              <path v-for="d in CREASES" :key="`lit-${d}`" :d="d" stroke="rgba(255,255,255,0.06)" transform="translate(0 0.4)" />
            </g>
            <!-- The hide seen edge-on: a ~0.55px lit lip where the edge rolls over, then a ~1px darker band of cut face. -->
            <path :d="TOP_CONTOUR_PATH" stroke="rgba(0,0,0,0.50)" stroke-width="3.2" fill="none" />
            <path :d="TOP_CONTOUR_PATH" stroke="rgba(255,255,255,0.22)" stroke-width="1.1" fill="none" />
            <ForenWalletStitch :d="STITCH_PATH" />
          </svg>
        </div>
      </div>

      <!-- Perimeter seam, pocket-front run: the thread passes through two layers with the cards
           sandwiched between them, so this run is clipped to the pocket. -->
      <div
        class="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
        :style="{ width: px(PANEL_WIDTH), height: px(PANEL_HEIGHT), clipPath: notchClip }"
        aria-hidden="true"
      >
        <svg
          class="absolute"
          :style="{ left: px(-PANEL_X), top: px(-POCKET_TOP) }"
          :width="WALLET_WIDTH"
          :height="WALLET_HEIGHT"
          :viewBox="`0 0 ${WALLET_WIDTH} ${WALLET_HEIGHT}`"
          fill="none"
          aria-hidden="true"
        >
          <ForenWalletStitch :d="WALLET_STITCH_PATH" />
        </svg>
      </div>

      <!-- Below the sheen: the foil is the most reflective surface here, so it must catch the
           reflection rather than sit outside it. Foil deboss rather than a blind one: black leather
           has almost no headroom for a pure value shift, so the mark gets its own light. -->
      <div class="absolute" :style="{ right: px(MARK_INSET), bottom: px(MARK_INSET) }">
        <svg
          width="17"
          height="17.1645"
          viewBox="0 0 17 17.1645"
          fill="none"
          :style="{ filter: 'drop-shadow(0 -0.7px 0.5px rgba(0,0,0,0.95)) drop-shadow(0 0.7px 0.5px rgba(255,255,255,0.14))' }"
          role="img"
          aria-label="Foren"
        >
          <defs>
            <linearGradient id="foren-wallet-foil" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stop-color="#ffffff" />
              <stop offset="0.5" stop-color="#edeff2" />
              <stop offset="1" stop-color="#c8cbd1" />
            </linearGradient>
          </defs>
          <path :d="MARK_PATH" fill-rule="evenodd" clip-rule="evenodd" fill="url(#foren-wallet-foil)" fill-opacity="0.95" />
        </svg>
      </div>
      <div class="pointer-events-none absolute inset-0" :style="{ backgroundImage: SHEEN }" aria-hidden="true" />
      <div class="pointer-events-none absolute inset-0" :style="{ boxShadow: PERIMETER, borderRadius: px(WALLET_RADIUS) }" aria-hidden="true" />

      <div
        v-if="isEmpty"
        class="pointer-events-auto absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-[10px] py-2"
        :style="{ width: px(HEADER_WIDTH), top: px(EMPTY_HEADER_TOP) }"
      >
        <p class="w-full text-center font-[family-name:var(--font-inter)] text-[16px] leading-[21px] font-semibold tracking-[0.16px] text-white" :style="{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }">
          {{ emptyTitle }}
        </p>
        <p
          class="text-center font-[family-name:var(--font-inter)] text-[12px] leading-[21px] font-normal tracking-[0.12px] text-white"
          :style="{ width: '216px', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }"
        >
          {{ emptyDescription }}
        </p>
        <ForenWalletPill @click="emit('openAccount')">{{ emptyActionLabel }}</ForenWalletPill>
      </div>
      <div
        v-else
        class="pointer-events-auto absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-[10px] py-2"
        :style="{ width: px(HEADER_WIDTH), top: px(HEADER_TOP) }"
      >
        <p
          v-if="moreCount !== undefined"
          class="w-full text-center font-[family-name:var(--font-inter)] text-[16px] leading-[21px] font-semibold tracking-[0.16px] text-white"
          :style="{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }"
        >
          {{ moreCount }} more accounts...
        </p>
        <ForenWalletPill @click="emit('viewAll')">View all</ForenWalletPill>
      </div>
    </div>
  </div>
</template>
