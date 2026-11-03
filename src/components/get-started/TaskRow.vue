<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { RiArrowRightSLine, RiInformationFill } from "@/components/icons";
import LinkButton from "@/components/LinkButton.vue";
import type { ChecklistItem, OnboardingState } from "@/stores/onboarding";
import { cn } from "@/lib/utils";
import { attentionNotes, TASK_ICON } from "./overview";
import TaskBadge from "./TaskBadge.vue";

const props = defineProps<{ item: ChecklistItem; s: OnboardingState }>();
const notes = computed(() => attentionNotes(props.item, props.s));
const locked = computed(
  () =>
    props.item.status === "verified" ||
    (props.s.review === "in_review" && props.item.status === "submitted"),
);
const cls = "flex items-center gap-3 px-4 py-4";
</script>

<template>
  <div
    :class="
      cn(
        'overflow-hidden rounded-[16px] bg-surface',
        notes.length > 0 && 'ring-1 ring-error/20',
      )
    "
  >
    <component
      :is="locked ? 'div' : RouterLink"
      v-bind="locked ? {} : { to: item.href }"
      :class="
        locked
          ? cls
          : cn(
              cls,
              'outline-none hover:bg-sunken/60 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset',
            )
      "
    >
      <span
        class="grid size-8 shrink-0 place-items-center rounded-full bg-subtle"
      >
        <component
          :is="TASK_ICON[item.id].icon"
          :class="TASK_ICON[item.id].class"
          aria-hidden="true"
        />
      </span>
      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-2">
          <span class="text-[14px] leading-[21px] font-medium text-fg">{{
            item.title
          }}</span>
          <TaskBadge
            :status="item.status"
            :label="
              item.status === 'action_required' ? 'Needs attention' : undefined
            "
          />
        </span>
        <span
          class="mt-0.5 block text-[12px] leading-[18px] font-medium text-fg-2"
          >{{ item.description }}</span
        >
      </span>
      <RiArrowRightSLine
        v-if="!locked"
        class="size-4 shrink-0 text-fg-3"
        aria-hidden="true"
      />
    </component>
    <div
      v-for="(n, k) in notes"
      :key="k"
      class="flex items-start gap-2.5 bg-error-subtle px-4 py-3 text-[12px] leading-[18px] font-medium text-error"
    >
      <RiInformationFill class="mt-px size-4 shrink-0" aria-hidden="true" />
      <p class="flex-1">{{ n }}</p>
      <LinkButton :href="item.href" size="xxs" class="shrink-0"
        >Review</LinkButton
      >
    </div>
  </div>
</template>
