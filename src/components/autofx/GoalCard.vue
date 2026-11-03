<script setup lang="ts">
import { computed, ref } from "vue";
import { RiDeleteBinLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import Panel from "@/components/Panel.vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenProgress from "@/components/ui/ForenProgress.vue";
import { evaluateGoal, goalSentence } from "@/domain/autofx";
import type { AutoFxGoal } from "@/domain/types";
import { useAppStore } from "@/stores/app";
import { GOAL_TYPES, STATUS } from "./global-account";

const props = defineProps<{ goal: AutoFxGoal; canEdit: boolean }>();
const store = useAppStore();
// Reads rates too, so the card re-evaluates when demo rates move.
const ev = computed(
  () => (void store.rates, evaluateGoal(props.goal, store.balances)),
);
const st = computed(() => STATUS[ev.value.status]);
const confirm = ref(false);
const activity = computed(() => [...props.goal.actions].reverse());

function remove() {
  store.removeGoal(props.goal.id);
  confirm.value = false;
  toast("Goal removed");
}
</script>

<template>
  <Panel class="flex flex-col p-5">
    <div class="flex items-start justify-between gap-3">
      <div
        class="flex items-center gap-2 text-[12px] font-semibold tracking-[0.06em] text-fg-3 uppercase"
      >
        <span class="[&_svg]:size-4" aria-hidden="true"
          ><component :is="GOAL_TYPES[goal.type].icon"
        /></span>
        {{ GOAL_TYPES[goal.type].title }}
      </div>
      <ForenBadge size="sm" :color="st.color">
        <template #leadingIcon
          ><component :is="st.icon" aria-hidden="true"
        /></template>
        {{ st.label }}
      </ForenBadge>
    </div>
    <p class="mt-2 text-[16px] leading-[22px] font-semibold text-fg">
      {{ goalSentence(goal) }}
    </p>
    <ForenProgress
      v-if="ev.progress !== null"
      class="mt-3"
      size="sm"
      :value="ev.progress * 100"
      hide-value
      aria-label="Goal progress"
      :fill-color="
        ev.status === 'unable_to_act' ? 'var(--color-foren-error)' : undefined
      "
    />
    <p class="tnum mt-2 text-[13px] leading-[18px] text-fg-2">
      {{ ev.message }}
    </p>
    <p v-if="ev.nextStep" class="mt-1 text-[13px] font-medium text-fg">
      Next: {{ ev.nextStep }}
    </p>
    <details v-if="goal.actions.length > 0" class="mt-3 text-[13px]">
      <summary class="cursor-pointer font-medium text-fg-2">
        Activity ({{ goal.actions.length }})
      </summary>
      <ul class="mt-2 space-y-1.5">
        <li v-for="a in activity" :key="a.at" class="tnum text-fg-2">
          <span class="text-fg-3">{{
            new Date(a.at).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          }}</span>
          · {{ a.text }}
        </li>
      </ul>
    </details>
    <div v-if="canEdit" class="mt-auto pt-3">
      <ForenButton
        size="xxs"
        variant="ghost"
        destructive
        @click="confirm = true"
      >
        <template #leadingIcon><RiDeleteBinLine /></template>
        Remove goal
      </ForenButton>
    </div>
    <ConfirmDialog
      v-model:open="confirm"
      title="Remove this goal?"
      consequence="Foren will stop managing this balance. Conversions that already happened aren’t reversed."
      confirm-label="Remove goal"
      destructive
      @confirm="remove"
    />
  </Panel>
</template>
