<script setup lang="ts">
import { computed, useId } from "vue";
import {
  requirementsFor,
  type CountryCode,
  type EntityType,
} from "@/domain/onboarding";

const props = defineProps<{
  country: CountryCode;
  entity: EntityType;
  expanded: boolean;
}>();
const emit = defineEmits<{ toggle: []; why: [] }>();

const reqs = computed(() =>
  requirementsFor({ country: props.country, entity: props.entity }),
);
const shown = computed(() =>
  props.expanded ? reqs.value : reqs.value.slice(0, 3),
);
const listId = useId();
</script>

<template>
  <section
    :aria-labelledby="`${listId}-h`"
    class="flex flex-col gap-4 px-4 pt-5 pb-6"
  >
    <div class="flex items-center justify-between gap-3">
      <h2
        :id="`${listId}-h`"
        class="text-[12px] leading-[18px] font-medium tracking-[0.02em] text-fg-3 uppercase"
      >
        Documents you’ll need
      </h2>
      <button
        type="button"
        class="text-[12px] leading-[18px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus"
        @click="emit('why')"
      >
        Why we need this?
      </button>
    </div>
    <ul :id="listId" class="flex flex-col gap-3">
      <li v-for="r in shown" :key="r.id" class="flex flex-col gap-0.5">
        <span class="text-[12px] leading-[18px] font-medium text-fg">
          {{ r.title
          }}<span v-if="r.optional" class="text-fg-3"> (if applicable)</span>
        </span>
        <span class="text-[12px] leading-[18px] font-medium text-fg-2">{{
          r.description
        }}</span>
      </li>
    </ul>
    <button
      v-if="reqs.length > 3"
      type="button"
      :aria-expanded="expanded"
      :aria-controls="listId"
      class="w-fit text-[12px] leading-[18px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus"
      @click="emit('toggle')"
    >
      {{ expanded ? "See less" : `See all ${reqs.length}` }}
    </button>
  </section>
</template>
