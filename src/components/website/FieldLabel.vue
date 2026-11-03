<script setup lang="ts">
import { cn } from "@/lib/utils";
import { ink } from "./shared";

defineProps<{ htmlFor: string }>();
</script>

<template>
  <label :for="htmlFor" :class="cn('mb-2 block text-[14px] font-medium', ink)"
    ><slot
  /></label>
</template>
