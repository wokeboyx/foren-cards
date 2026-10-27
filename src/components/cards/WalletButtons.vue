<script setup lang="ts">
/**
 * Add to Apple Pay / Google Pay (Wise, Revolut). Simulated here: real provisioning depends on the card
 * processor, so this needs confirming with engineering before launch.
 */
import { computed, ref } from "vue";
import { RiAppleFill, RiGoogleFill } from "@/components/icons";
import WalletModal from "@/components/card/WalletModal.vue";
import type { Wallet } from "@/components/card/wallet-modal";
import type { Card } from "@/domain/types";
import { currentUserId, useAppStore } from "@/stores/app";

const props = defineProps<{ card: Card }>();
const store = useAppStore();
const open = ref<null | Wallet>(null);
const shown = computed(() => props.card.status === "active" && props.card.holderId === currentUserId(store.role) && props.card.kind !== "emergency");
const has = (w: Wallet) => !!props.card.wallets?.includes(w);
</script>

<template>
  <div v-if="shown" class="flex flex-wrap justify-center gap-2">
    <button
      type="button"
      :disabled="has('apple')"
      class="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b0b0b] px-4 text-[13px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
      @click="open = 'apple'"
    >
      <RiAppleFill class="size-4" aria-hidden="true" />
      {{ has("apple") ? "In Apple Pay" : "Add to Apple Pay" }}
    </button>
    <button
      type="button"
      :disabled="has('google')"
      class="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-[13px] font-semibold text-fg ring-1 ring-line outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
      @click="open = 'google'"
    >
      <RiGoogleFill class="size-4" aria-hidden="true" />
      {{ has("google") ? "In Google Pay" : "Add to Google Pay" }}
    </button>
    <WalletModal v-if="open" :card="card" :wallet="open" :open="true" @update:open="(o) => !o && (open = null)" />
  </div>
</template>
