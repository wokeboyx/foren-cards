<script setup lang="ts">
import { RiCheckboxCircleFill, RiCloseCircleLine, RiLockLine, RiSnowflakeLine, RiTimeLine } from "@/components/icons";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import { STATUS_LABEL } from "@/domain/labels";
import type { Card } from "@/domain/types";

/** Status is always icon + text, never colour alone (§4, §11). */
withDefaults(defineProps<{ card: Pick<Card, "status" | "kind"> & Partial<Pick<Card, "adminLock" | "used">>; size?: "sm" | "md" | "lg" }>(), { size: "md" });
</script>

<template>
  <ForenBadge v-if="card.status === 'frozen' && card.adminLock" color="orange" :size="size">
    <template #leadingIcon><RiLockLine aria-hidden="true" /></template>
    Locked by admin
  </ForenBadge>
  <ForenBadge v-else-if="card.status === 'frozen'" color="indigo" :size="size">
    <template #leadingIcon><RiSnowflakeLine aria-hidden="true" /></template>
    {{ STATUS_LABEL.frozen }}
  </ForenBadge>
  <ForenBadge v-else-if="card.status === 'canceled'" color="error" :size="size">
    <template #leadingIcon><RiCloseCircleLine aria-hidden="true" /></template>
    {{ STATUS_LABEL.canceled }}
  </ForenBadge>
  <ForenBadge v-else-if="card.kind === 'emergency' && card.used" color="gray" :size="size">
    <template #leadingIcon><RiCheckboxCircleFill aria-hidden="true" /></template>
    Used
  </ForenBadge>
  <ForenBadge v-else-if="card.kind === 'emergency'" color="orange" :size="size">
    <template #leadingIcon><RiTimeLine aria-hidden="true" /></template>
    Emergency
  </ForenBadge>
  <ForenBadge v-else color="success" :size="size">
    <template #leadingIcon><RiCheckboxCircleFill aria-hidden="true" /></template>
    {{ STATUS_LABEL.active }}
  </ForenBadge>
</template>
