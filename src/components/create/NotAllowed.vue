<script setup lang="ts">
import { RiLockLine } from "@/components/icons";
import EmptyState from "@/components/EmptyState.vue";
import LinkButton from "@/components/LinkButton.vue";
import Panel from "@/components/Panel.vue";

defineProps<{ body: string }>();
</script>

<template>
  <Panel>
    <EmptyState title="You can’t do this here" :body="body">
      <template #icon><RiLockLine /></template>
      <template #action
        ><LinkButton href="/cards" variant="outline" size="sm"
          >Back to cards</LinkButton
        ></template
      >
    </EmptyState>
  </Panel>
</template>
