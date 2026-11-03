<script setup lang="ts">
import { RiChat1Line } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
</script>

<template>
  <div class="flex flex-col items-start gap-2">
    <ForenButton
      variant="secondary"
      size="sm"
      @click="toast('Support chat opens here. It isn’t part of the prototype.')"
    >
      <template #leadingIcon><RiChat1Line aria-hidden="true" /></template>
      Need help?
    </ForenButton>
    <p class="text-[12px] leading-[18px] font-medium text-fg-2">
      Chat with our support team
    </p>
  </div>
</template>
