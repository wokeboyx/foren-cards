<script setup lang="ts">
import { ref } from "vue";
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from "reka-ui";
import { RiFilter3Line } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import type { Person } from "@/domain/types";

export type StatusOption = { value: string; label: string };

defineProps<{
  role: string;
  holders: Person[];
  statusOptions: readonly StatusOption[];
  counts: (v: string) => number;
  showStatus: boolean;
}>();
const emit = defineEmits<{ pick: [key: string, value: string] }>();
const open = ref(false);
function pick(k: string, v: string) {
  emit("pick", k, v);
  open.value = false;
}
const opt =
  "flex w-full items-center justify-between gap-3 rounded-[10px] px-2.5 py-1.5 text-left text-[13px] text-fg outline-none hover:bg-subtle focus-visible:bg-subtle";
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <ForenButton variant="secondary" size="xxs">
        <template #leadingIcon><RiFilter3Line /></template>
        Add filter
      </ForenButton>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="start"
        :side-offset="6"
        class="z-50 max-h-[70dvh] w-[260px] overflow-y-auto rounded-[16px] bg-surface p-2 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
      >
        <template v-if="showStatus">
          <div class="px-2.5 pt-1 pb-1 text-[11px] font-semibold tracking-[0.06em] text-fg-3 uppercase">Status</div>
          <button v-for="o in statusOptions" :key="o.value" :class="opt" @click="pick('status', o.value)">
            {{ o.label }}
            <span class="tnum text-[12px] text-fg-3">{{ counts(o.value) }}</span>
          </button>
        </template>
        <template v-if="role !== 'cardholder'">
          <div class="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-[0.06em] text-fg-3 uppercase">Cardholder</div>
          <button v-for="h in holders" :key="h.id" :class="opt" @click="pick('holder', h.id)">{{ h.name }}</button>
        </template>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
