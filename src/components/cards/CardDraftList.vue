<script setup lang="ts">
/** Cards being created, saved to finish later (Revolut drafts). */
import { RiDraftLine } from "@/components/icons";
import { toast } from "vue-sonner";
import CardArt from "@/components/card/CardArt.vue";
import LinkButton from "@/components/LinkButton.vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import type { CardDraft } from "@/domain/types";
import { deleteCardDraft } from "@/services";

defineProps<{ drafts: CardDraft[] }>();
const namesOf = (d: CardDraft) => [d.card.nickname, ...d.names].map((n) => n.trim()).filter(Boolean);
const savedAt = (d: CardDraft) => new Date(d.savedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
function remove(d: CardDraft) {
  deleteCardDraft(d.id);
  toast("Draft deleted");
}
</script>

<template>
  <section aria-label="Drafts" class="mb-4 overflow-hidden rounded-[20px] bg-surface">
    <ul class="divide-y divide-line">
      <li v-for="d in drafts" :key="d.id" class="flex flex-wrap items-center gap-3 px-4 py-2.5">
        <CardArt :card="{ ...d.card, nickname: namesOf(d)[0] || 'Untitled card', last4: '' }" size="xs" class="opacity-50" />
        <span class="min-w-[60%] flex-1 text-[13px] sm:min-w-0">
          <span class="font-medium text-fg">{{ namesOf(d).length ? namesOf(d).join(", ") : "Untitled card" }}</span>
          <span class="text-fg-3"> · step {{ d.step + 1 }} of 5 · saved {{ savedAt(d) }}</span>
        </span>
        <ForenBadge size="sm" color="gray">
          <template #leadingIcon><RiDraftLine aria-hidden="true" /></template>
          Draft
        </ForenBadge>
        <ForenButton size="xxs" variant="ghost" @click="remove(d)">Delete</ForenButton>
        <LinkButton :href="`/cards/new?draft=${d.id}`" size="xxs" variant="secondary">Continue</LinkButton>
      </li>
    </ul>
  </section>
</template>
