<script setup lang="ts">
/** Revolut-style status icon: the request's subject with a small state marker. */
import { computed } from "vue";
import CardArt from "@/components/card/CardArt.vue";
import MerchantLogo from "@/components/MerchantLogo.vue";
import type { CardRequest } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { useAppStore } from "@/stores/app";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{ r: CardRequest; state: CardRequest["state"]; size?: number }>(),
  { size: 36 },
);
const store = useAppStore();
const card = computed(() => store.cards.find((c) => c.id === props.r.cardId));
const m = computed(() =>
  props.r.merchantId ? merchantById(props.r.merchantId) : undefined,
);
const mark = computed(() =>
  props.state === "approved" || props.state === "used"
    ? "bg-success"
    : props.state === "denied"
      ? "bg-error"
      : props.state === "pending"
        ? "bg-warning"
        : "bg-fg-3",
);
</script>

<template>
  <span class="relative shrink-0" aria-hidden="true">
    <MerchantLogo v-if="m" :merchant="m" :size="size" />
    <CardArt v-else-if="card" :card="card" size="xs" />
    <CardArt
      v-else-if="r.newCard"
      :card="{
        design: r.newCard.design,
        nickname: r.newCard.nickname,
        last4: '',
        kind: 'standard',
        status: 'active',
      }"
      size="xs"
      class="opacity-60"
    />
    <span
      :class="
        cn(
          'absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface',
          mark,
        )
      "
    />
  </span>
</template>
