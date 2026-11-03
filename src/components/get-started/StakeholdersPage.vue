<script setup lang="ts">
import { ref } from "vue";
import { uboThreshold } from "@/domain/onboarding";
import { registryStakeholders, useOnboardingStore } from "@/stores/onboarding";
import SetupColumn from "./SetupColumn.vue";
import SetupHeader from "./SetupHeader.vue";
import StakeholdersControllers from "./StakeholdersControllers.vue";
import StakeholdersIntro from "./StakeholdersIntro.vue";

const s = useOnboardingStore();
const started = ref(false);

function start() {
  if (s.business?.source === "registry")
    s.set({ stakeholders: registryStakeholders() });
  started.value = true;
}
</script>

<template>
  <SetupColumn v-if="!s.signedUpAt || !s.country || !s.entity">
    <SetupHeader
      title="Stakeholders"
      description="Finish sign-up first."
      back="/get-started"
    />
  </SetupColumn>
  <SetupColumn v-else-if="s.entity === 'sole_trader'">
    <SetupHeader
      back="/get-started"
      title="No stakeholders needed"
      description="As a sole trader, you’re the only owner. You verified your identity when you signed up."
    />
  </SetupColumn>
  <StakeholdersIntro
    v-else-if="!started && s.stakeholders.length === 0"
    :threshold="uboThreshold(s.country, s.entity)!"
    @start="start"
  />
  <StakeholdersControllers v-else />
</template>
