<script setup lang="ts">
import { RiInformationFill } from "@/components/icons";
import Modal from "@/components/Modal.vue";

defineProps<{ open: boolean; subtitle: string }>();
const emit = defineEmits<{ "update:open": [open: boolean] }>();

const WHY: [string, string][] = [
  [
    "We’re required to know who you are",
    "Regulators require us to verify the businesses we onboard, and the people behind them. This is called Know Your Business (KYB), and it applies whatever your entity type or location.",
  ],
  [
    "What you share shapes what you can do",
    "The information and documents you provide decide which features you can use straight away. More verified detail unlocks more of Foren, with no separate “upgrade later” step.",
  ],
  [
    "We confirm it automatically where we can",
    "When a registry or database can confirm a detail for us, we use that instead of asking you to upload it. That keeps your list as short as possible.",
  ],
];
</script>

<template>
  <Modal :open="open" class="sm:max-w-[476px]" @update:open="emit('update:open', $event)">
    <template #title>
      <span class="flex items-center gap-2">
        <RiInformationFill class="size-5 shrink-0 text-[#f0b232]" aria-hidden="true" />
        Why we need this
      </span>
    </template>
    <template #description>
      <span class="text-[12px] leading-[18px] font-medium text-fg-2">{{ subtitle }}</span>
    </template>
    <div class="flex flex-col gap-8 rounded-[16px] bg-sunken px-3 py-5">
      <div v-for="[h, b] in WHY" :key="h" class="flex flex-col gap-2">
        <h3 class="text-[14px] leading-[21px] font-medium text-fg">{{ h }}</h3>
        <p class="text-[12px] leading-[18px] font-medium text-fg-2">{{ b }}</p>
      </div>
    </div>
  </Modal>
</template>
