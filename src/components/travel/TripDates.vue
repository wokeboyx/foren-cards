<script setup lang="ts">
/** Limit the card to the trip so it stops working when the team comes home. */
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import Panel from "@/components/Panel.vue";
import SectionTitle from "@/components/SectionTitle.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import { useAction } from "@/composables/useAction";
import { COPY } from "@/content/copy";
import { setSpendingPeriod } from "@/services";

const props = defineProps<{ cardId: string; from?: string; until?: string }>();
const f = ref(props.from ?? "");
const u = ref(props.until ?? "");
const save = useAction(setSpendingPeriod);
const bad = computed(() => !!f.value && !!u.value && u.value < f.value);

async function onSave() {
  const r = await save.run(props.cardId, f.value || undefined, u.value || undefined);
  toast(r.ok ? "Trip dates saved on the card" : COPY.saveFailure);
}
</script>

<template>
  <Panel class="space-y-3 p-5">
    <SectionTitle>Trip dates</SectionTitle>
    <p class="text-[13px] leading-[18px] text-fg-2">The card only works between these dates.</p>
    <div class="grid grid-cols-2 gap-3">
      <ForenInput v-model="f" label="From" type="date" />
      <ForenInput v-model="u" label="Until" type="date" :error="bad ? 'Must be on or after the start date.' : undefined" />
    </div>
    <ForenButton size="sm" :disabled="bad || (!f && !u) || save.pending.value" @click="onSave">Save trip dates</ForenButton>
  </Panel>
</template>
