<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { can } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";
import CardForm from "./CardForm.vue";
import NotAllowed from "./NotAllowed.vue";

const store = useAppStore();
const route = useRoute();
const q = (k: string) => {
  const v = route.query[k];
  return (Array.isArray(v) ? v[0] : v) ?? null;
};
const draftId = computed(() => q("draft"));
const prefill = computed(() => ({ nickname: q("nickname") ?? "" }));
const draft = computed(() => store.cardDrafts.find((d) => d.id === draftId.value));
</script>

<template>
  <div v-if="!can(store.role, 'issue')" class="mx-auto max-w-[640px] p-6">
    <NotAllowed body="Only the account owner can issue cards. Ask them to create one for you." />
  </div>
  <CardForm v-else :key="draftId ?? 'new'" mode="create" :prefill="prefill" :from-draft="draft" />
</template>
