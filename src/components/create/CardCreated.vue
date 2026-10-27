<script setup lang="ts">
/** Centered success with one optional follow-up setting (Mercury "You’re all set"). */
import { computed, onMounted, useTemplateRef } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { motion, useReducedMotion } from "motion-v";
import { RiCloseLine, RiNotification3Line } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenToggle from "@/components/ui/ForenToggle.vue";
import CardArt from "@/components/card/CardArt.vue";
import { lockText } from "@/components/card/status-badge";
import { nameOnCard } from "@/components/card/holder";
import { COPY } from "@/content/copy";
import type { Card } from "@/domain/types";
import { personById, useAppStore } from "@/stores/app";

const props = defineProps<{ cards: Card[] }>();
const emit = defineEmits<{ another: [] }>();

const store = useAppStore();
const router = useRouter();
const reduce = useReducedMotion();
const card = computed(() => props.cards[0]);
const live = computed(() => store.cards.find((c) => c.id === card.value.id) ?? card.value);
const holder = computed(() => personById(card.value.holderId));
const heading = useTemplateRef<HTMLHeadingElement>("heading");
onMounted(() => heading.value?.focus());

function setReminders(v: boolean) {
  store.patchCard(card.value.id, { renewalReminders: v });
  toast(v ? "Reminder rule enabled" : "Reminder rule turned off");
}
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center bg-subtle px-5 py-16 text-center">
    <RouterLink to="/cards" aria-label="Close" class="fixed top-5 right-5 grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus">
      <RiCloseLine class="size-5" aria-hidden="true" />
    </RouterLink>
    <motion.div
      :initial="reduce ? false : { opacity: 0, y: 24, rotate: -6, scale: 0.92 }"
      :animate="{ opacity: 1, y: 0, rotate: 0, scale: 1 }"
      :transition="{ type: 'spring', stiffness: 220, damping: 18 }"
    >
      <CardArt :card="card" size="md" :holder-name="nameOnCard(card)" />
    </motion.div>
    <h1 ref="heading" class="mt-6 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg" tabindex="-1">
      {{ cards.length > 1 ? `${cards.length} cards created` : COPY.successTitle }}
    </h1>
    <p class="mt-2 max-w-sm text-[14px] leading-[22px] text-fg-2">
      {{ cards.length > 1 ? `${cards.map((c) => c.nickname).join(", ")}. Each has its own number and the same settings.` : COPY.successBody }}
    </p>
    <p v-if="holder?.invited" class="mt-3 max-w-sm rounded-[14px] bg-surface px-4 py-2.5 text-[13px] leading-[18px] text-fg-2 ring-1 ring-line">
      We’ve emailed {{ holder?.name }} an invite. They can use this card once they’ve joined Foren.
    </p>
    <p v-if="lockText(card)" class="mt-3 max-w-sm text-[13px] leading-[18px] text-fg-2">It locks to the first merchant that charges it.</p>
    <div class="mt-6 flex flex-col gap-2 sm:flex-row">
      <ForenButton variant="secondary" @click="emit('another')">Create another</ForenButton>
      <ForenButton @click="router.push(`/cards/${card.id}`)">View card details</ForenButton>
    </div>
    <div class="mt-8 w-full max-w-[400px] rounded-[20px] bg-surface p-4 text-left ring-1 ring-line">
      <ForenToggle reverse class="w-full justify-between" :model-value="!!live.renewalReminders" @update:model-value="setReminders">
        <template #label>
          <span class="inline-flex items-center gap-2"><RiNotification3Line class="size-4 text-fg-2" aria-hidden="true" /> Remind me before subscriptions renew</span>
        </template>
      </ForenToggle>
      <p class="mt-2 text-[12px] leading-[16px] text-fg-3">
        Recommended for cards that pay software or other recurring merchants. Reminders use estimated dates, and you can change this from the card’s subscriptions.
      </p>
    </div>
  </div>
</template>
