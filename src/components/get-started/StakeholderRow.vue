<script setup lang="ts">
import { computed } from "vue";
import { RiBuilding2Line } from "@/components/icons";
import { cn } from "@/lib/utils";
import { effectiveOwnership, type Stakeholder } from "@/stores/onboarding";
import PersonAvatar from "./PersonAvatar.vue";
import RowMenu from "./RowMenu.vue";
import { fullName, roleLine } from "./shared";
import { missingOf } from "./stakeholders";

const props = defineProps<{
  person: Stakeholder;
  all: Stakeholder[];
  threshold: number;
  locked: boolean;
  nested: boolean;
}>();
const emit = defineEmits<{
  edit: [p: Stakeholder];
  remove: [p: Stakeholder];
}>();

const missing = computed(() =>
  missingOf(props.person, props.all, props.threshold),
);
const line = computed(() => {
  const p = props.person;
  const parent = props.all.find((x) => x.id === p.parentId);
  return p.kind === "company"
    ? `Company · ${p.ownership}% ownership`
    : parent
      ? `Owns ${p.ownership}% of ${fullName(parent)} · ${effectiveOwnership(p, props.all)}% of this business`
      : roleLine(p);
});
</script>

<template>
  <div
    :class="
      cn(
        'flex items-center gap-3 rounded-[16px] bg-surface px-4 py-3.5',
        nested && 'ml-6 sm:ml-10',
      )
    "
  >
    <span
      v-if="person.kind === 'company'"
      aria-hidden="true"
      class="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-fg-2"
    >
      <RiBuilding2Line class="size-4" />
    </span>
    <PersonAvatar v-else :person="person" />
    <div class="min-w-0 flex-1">
      <p class="truncate text-[14px] leading-[21px] font-semibold text-fg">
        {{ fullName(person) }}
      </p>
      <p
        v-if="missing"
        class="text-[12px] leading-[18px] font-medium text-error"
      >
        {{ missing }}
      </p>
      <p v-else class="text-[12px] leading-[18px] font-medium text-fg-2">
        {{ line }}
      </p>
    </div>
    <RowMenu
      v-if="!locked"
      :person="person"
      @edit="emit('edit', person)"
      @remove="emit('remove', person)"
    />
  </div>
</template>
