<script setup lang="ts">
import { computed, ref } from "vue";
import { RiCheckLine, RiFileCopyLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import type { Card, Merchant } from "@/domain/types";
import { cn } from "@/lib/utils";

const props = defineProps<{
  card: Card;
  merchant: Merchant;
  oldCard: Card;
  blockOld: boolean;
}>();
const emit = defineEmits<{ done: [] }>();

const copied = ref<string | null>(null);
const rows = computed(() => {
  const pan = `4000 0012 3456 ${props.card.last4}`;
  const expiry = `${props.card.expiry.slice(5)}/${props.card.expiry.slice(2, 4)}`;
  return [
    ["Card number", pan, pan.replace(/\s/g, "")],
    ["Expiry date", expiry, expiry],
    ["Security code", "123", "123"],
  ] as const;
});

async function copy(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* clipboard may be unavailable */
  }
  copied.value = label;
  toast(`${label} copied`);
}

function done() {
  toast(`We’ll let you know when ${props.merchant.name} switches`);
  emit("done");
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-[14px] leading-[21px] text-fg-2">
      Card •• {{ card.last4 }} is ready. Foren can’t change your card at
      {{ merchant.name }} for you: sign in to {{ merchant.name }}, open your
      payment settings and replace the card with these details.
    </p>
    <ul class="divide-y divide-line rounded-[16px] ring-1 ring-line">
      <li
        v-for="[label, value, raw] in rows"
        :key="label"
        class="flex items-center justify-between gap-3 px-4 py-2.5"
      >
        <div>
          <div class="text-[12px] text-fg-3">{{ label }}</div>
          <div class="tnum text-[15px] font-semibold text-fg">{{ value }}</div>
        </div>
        <button
          type="button"
          :aria-label="`Copy ${label.toLowerCase()}`"
          :class="
            cn(
              'grid size-8 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus',
              copied === label
                ? 'bg-success-subtle text-success'
                : 'text-fg-2 hover:bg-subtle',
            )
          "
          @click="copy(label, raw)"
        >
          <RiCheckLine
            v-if="copied === label"
            class="size-4"
            aria-hidden="true"
          />
          <RiFileCopyLine v-else class="size-4" aria-hidden="true" />
        </button>
      </li>
    </ul>
    <p
      class="rounded-[14px] bg-subtle px-3.5 py-2.5 text-[13px] leading-[18px] text-fg-2"
    >
      Until you do, {{ merchant.name }} keeps charging {{ oldCard.nickname }},
      so nothing breaks.{{
        blockOld
          ? ` When ${merchant.name} first charges •• ${card.last4}, we’ll block it on ${oldCard.nickname} and let you know.`
          : ""
      }}
    </p>
    <div class="flex justify-end">
      <ForenButton size="sm" @click="done">Done</ForenButton>
    </div>
  </div>
</template>
