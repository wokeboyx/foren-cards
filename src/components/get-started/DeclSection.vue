<script setup lang="ts">
import GroupLabel from "./GroupLabel.vue";

defineProps<{ title: string }>();
</script>

<template>
  <section>
    <GroupLabel class="mb-2">{{ title }}</GroupLabel>
    <div class="flex flex-col gap-2"><slot /></div>
  </section>
</template>
