<script setup lang="ts">
import { RiLockLine, RiLockUnlockLine } from "@remixicon/vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import type { Card } from "@/domain/types";

/** "Locked · Figma" for one-merchant cards, or "Locks on first use" while it's waiting for its first charge. */
withDefaults(defineProps<{ card: Pick<Card, "lockedMerchantId" | "permissions">; merchantName?: string; size?: "sm" | "md" }>(), { size: "sm" });
</script>

<template>
  <ForenBadge v-if="card.lockedMerchantId" color="gray" :size="size">
    <template #leadingIcon><RiLockLine aria-hidden="true" /></template>
    {{ merchantName ?? "One merchant" }}
  </ForenBadge>
  <ForenBadge v-else-if="card.permissions.mode === 'first_merchant'" color="primary" :size="size">
    <template #leadingIcon><RiLockUnlockLine aria-hidden="true" /></template>
    Locks on first use
  </ForenBadge>
</template>
