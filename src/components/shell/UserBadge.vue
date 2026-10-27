<script setup lang="ts">
import { computed } from "vue";
import ForenAvatar from "@/components/ui/ForenAvatar.vue";
import { currentUserId, personById, useAppStore } from "@/stores/app";
import { ROLE_LABEL } from "./nav";

const store = useAppStore();
const person = computed(() => personById(currentUserId(store.role)));
const initials = computed(() => person.value?.name.split(" ").map((x) => x[0]).join(""));
const title = computed(() => `${person.value?.name} · ${ROLE_LABEL[store.role as keyof typeof ROLE_LABEL] ?? ""}`);
</script>

<template>
  <ForenAvatar size="sm" :name="person?.name" :initials="initials" fallback="initials" :title="title" />
</template>
