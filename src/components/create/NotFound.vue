<script setup lang="ts">
import EmptyState from "@/components/EmptyState.vue";
import LinkButton from "@/components/LinkButton.vue";
import Panel from "@/components/Panel.vue";

withDefaults(defineProps<{ what?: string }>(), { what: "card" });
</script>

<template>
  <Panel>
    <EmptyState
      :title="`We couldn’t find that ${what}`"
      body="It may have been removed, or the link is out of date."
    >
      <template #action
        ><LinkButton href="/cards" variant="outline" size="sm"
          >Back to cards</LinkButton
        ></template
      >
    </EmptyState>
  </Panel>
</template>
