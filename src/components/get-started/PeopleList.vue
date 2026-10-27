<script setup lang="ts">
import { RiAddLine } from "@/components/icons";
import type { Stakeholder } from "@/stores/onboarding";
import { fullName } from "./shared";
import StakeholderRow from "./StakeholderRow.vue";

defineProps<{ items: Stakeholder[]; all: Stakeholder[]; threshold: number; locked: boolean }>();
const emit = defineEmits<{ edit: [p: Stakeholder]; remove: [p: Stakeholder]; addOwner: [company: Stakeholder] }>();
</script>

<template>
  <ul class="flex flex-col gap-3">
    <li v-for="p in items" :key="p.id" class="flex flex-col gap-2">
      <StakeholderRow :person="p" :all="all" :threshold="threshold" :locked="locked" :nested="false" @edit="emit('edit', $event)" @remove="emit('remove', $event)" />
      <template v-if="p.kind === 'company'">
        <StakeholderRow
          v-for="o in all.filter((o) => o.parentId === p.id)"
          :key="o.id"
          :person="o"
          :all="all"
          :threshold="threshold"
          :locked="locked"
          nested
          @edit="emit('edit', $event)"
          @remove="emit('remove', $event)"
        />
        <button
          v-if="!locked"
          type="button"
          class="ml-6 flex h-10 w-fit items-center gap-2 rounded-[12px] px-2 text-[13px] font-medium text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus sm:ml-10"
          @click="emit('addOwner', p)"
        >
          <RiAddLine class="size-4 text-fg-2" aria-hidden="true" />
          Add a person who owns {{ fullName(p) }}
        </button>
      </template>
    </li>
  </ul>
</template>
