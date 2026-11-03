<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { can } from "@/lib/permissions";
import { allPeople, useAppStore } from "@/stores/app";
import CardWizard from "./CardWizard.vue";
import NotAllowed from "./NotAllowed.vue";

const store = useAppStore();
const route = useRoute();
const nickname = computed(() => {
  const v = route.query.nickname;
  return (Array.isArray(v) ? v[0] : v) ?? "";
});
// A new card is for the company by default, which only the account admin can see and manage.
const prefill = computed(() => ({
  nickname: nickname.value,
  companyCard: true,
  holderId: allPeople().find((p) => p.role === "owner")?.id ?? "",
}));
</script>

<template>
  <div v-if="!can(store.role, 'issue')" class="mx-auto max-w-[640px] p-6">
    <NotAllowed
      body="Only the account owner can issue cards. Ask them to create one for you."
    />
  </div>
  <CardWizard v-else :prefill="prefill" />
</template>
