<script setup lang="ts">
import ForenBadge from "@/components/ui/ForenBadge.vue";
import type { Business } from "@/stores/onboarding";
import DetailGrid from "./DetailGrid.vue";
import { formatDate } from "./shared";

defineProps<{ business: Business; registry: string }>();
const emit = defineEmits<{ searchAgain: [] }>();
</script>

<template>
  <div class="flex flex-col gap-4 rounded-[12px] bg-surface p-4 animate-[rise-in_200ms_ease-out]" aria-live="polite">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-[16px] leading-6 font-medium text-fg">{{ business.name }}</p>
      <ForenBadge color="success" size="sm" dot>{{ registry }} verified</ForenBadge>
    </div>
    <DetailGrid
      :items="[
        { label: 'Reg. number', value: [business.regType, business.regNumber].filter(Boolean).join('-') },
        { label: 'Incorporated', value: formatDate(business.incorporatedOn) },
        { label: 'Type', value: business.companyType },
        { label: 'Address', value: business.address },
      ]"
    />
    <p class="text-[12px] leading-[18px] font-medium text-fg-3">
      Wrong business?
      <button type="button" class="text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus" @click="emit('searchAgain')">
        Search again
      </button>
    </p>
  </div>
</template>
