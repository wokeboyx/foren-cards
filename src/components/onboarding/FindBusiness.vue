<script setup lang="ts">
/**
 * Step 4a "Find your business" (Figma 3035:74092 RC, 74778 IT, 74451 Looking up, 74530 Found, 74588 Manual,
 * 70515 UK search result, 6476:79576 Kenya). Nigeria and Kenya look up a registration number;
 * the UK and Canada search by name or number. Manual entry is always one link away.
 */
import { useSignupGuard } from "@/composables/useSignupGuard";
import { useOnboardingStore } from "@/stores/onboarding";
import FindBusinessForm from "./FindBusinessForm.vue";

const ready = useSignupGuard("/onboarding/business");
const store = useOnboardingStore();
</script>

<template>
  <FindBusinessForm
    v-if="ready && store.country && store.entity"
    :key="`${store.country}-${store.entity}`"
    :country="store.country"
  />
</template>
