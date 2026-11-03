<script setup lang="ts">
import { RiAlertLine } from "@/components/icons";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import { COPY } from "@/content/copy";
import type { SubStatus } from "@/domain/forecast";

defineProps<{ st: SubStatus }>();
</script>

<template>
  <ForenBadge v-if="st.kind === 'still_on_old_card'" color="orange" dot>{{
    COPY.stillOnOldCard
  }}</ForenBadge>
  <ForenBadge v-else-if="st.kind === 'declined'" color="error" dot
    >Declined</ForenBadge
  >
  <ForenBadge v-else-if="st.kind === 'at_risk'" color="orange">
    <template #leadingIcon><RiAlertLine aria-hidden="true" /></template>
    At risk
  </ForenBadge>
  <ForenBadge v-else-if="st.kind === 'due_soon'" color="primary" dot
    >Due soon</ForenBadge
  >
  <ForenBadge v-else color="success" dot>Active</ForenBadge>
</template>
