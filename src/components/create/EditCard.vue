<script setup lang="ts">
import { computed } from "vue";
import { can } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";
import CardForm from "./CardForm.vue";
import NotAllowed from "./NotAllowed.vue";
import NotFound from "./NotFound.vue";

const props = defineProps<{ cardId: string }>();
const store = useAppStore();
const card = computed(() => store.cards.find((c) => c.id === props.cardId));
</script>

<template>
  <div v-if="!card" class="mx-auto max-w-[640px] p-6">
    <NotFound />
  </div>
  <div v-else-if="!can(store.role, 'edit', card) || card.status === 'canceled'" class="mx-auto max-w-[640px] p-6">
    <NotAllowed body="Only the account owner can change this card’s settings, and canceled cards can’t be edited." />
  </div>
  <CardForm v-else mode="edit" :initial="card" />
</template>
