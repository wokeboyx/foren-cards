<script setup lang="ts">
import { RiTimeLine } from "@/components/icons";
import ForenBadge from "@/components/ui/ForenBadge.vue";
</script>

<template>
  <ForenBadge size="sm" color="orange">
    <template #leadingIcon><RiTimeLine aria-hidden="true" /></template>
    Pending request
  </ForenBadge>
</template>
