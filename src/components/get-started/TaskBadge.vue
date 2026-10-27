<script setup lang="ts">
import { computed } from "vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import type { TaskStatus } from "@/stores/onboarding";
import { TASK_BADGE } from "./shared";

const props = defineProps<{ status: TaskStatus; label?: string }>();
const badge = computed(() => TASK_BADGE[props.status]);
</script>

<template>
  <ForenBadge size="sm" :color="badge[0]">{{ label ?? badge[1] }}</ForenBadge>
</template>
