<script setup lang="ts">
/**
 * "Who's it for?" — a team member's card (in their name) or a company card (in the company's name,
 * Revolut's "virtual company card"), plus adding someone who isn't on Foren yet.
 */
import { computed, ref } from "vue";
import { RiBuilding2Line, RiUser3Line } from "@/components/icons";
import type { Card, Person } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { allPeople, useAppStore } from "@/stores/app";
import ChoiceCard from "./ChoiceCard.vue";
import InviteSomeone from "./InviteSomeone.vue";
import PersonSelect from "./PersonSelect.vue";

const MAX_CONTACTS = 5;

const props = defineProps<{
  card: Pick<Card, "holderId" | "companyCard" | "contactIds">;
  error?: string;
  disabled?: boolean;
  /** The step heading already asks "Who's this card for?" */
  hideTitle?: boolean;
}>();
const emit = defineEmits<{ change: [patch: Partial<Card>] }>();

const store = useAppStore();
// Re-evaluate when someone is invited.
const people = computed(() => (store.invitedPeople, allPeople()));
const company = computed(() => !!props.card.companyCard);
const inviting = ref(false);
const contacts = computed(() => props.card.contactIds ?? (props.card.holderId ? [props.card.holderId] : []));

function toggleContact(id: string) {
  const c = contacts.value;
  const next = c.includes(id) ? c.filter((x) => x !== id) : c.length >= MAX_CONTACTS ? c : [...c, id];
  emit("change", { contactIds: next, holderId: next[0] ?? "" });
}

function onPick(id: string) {
  if (company.value) toggleContact(id);
  else emit("change", { holderId: id });
}

function onAdded(p: Person) {
  if (company.value) toggleContact(p.id);
  else emit("change", { holderId: p.id });
  inviting.value = false;
}
</script>

<template>
  <div class="space-y-4">
    <fieldset :disabled="disabled">
      <legend :class="hideTitle ? 'sr-only' : 'mb-2 text-[14px] font-medium text-fg'">Who’s it for?</legend>
      <div class="grid gap-2">
        <ChoiceCard
          name="card-for"
          value="member"
          :checked="!company"
          title="A team member"
          description="Issued in their name. Best for travel and day-to-day spending."
          :disabled="disabled"
          @change="emit('change', { companyCard: false, contactIds: undefined, holderId: contacts[0] ?? '' })"
        >
          <template #icon><RiUser3Line /></template>
        </ChoiceCard>
        <ChoiceCard
          name="card-for"
          value="company"
          :checked="company"
          title="The company"
          :description="`Issued in ${COMPANY.name}’s name. Best for subscriptions and suppliers.`"
          :disabled="disabled"
          @change="emit('change', { companyCard: true, contactIds: card.holderId ? [card.holderId] : [], holderId: card.holderId })"
        >
          <template #icon><RiBuilding2Line /></template>
        </ChoiceCard>
      </div>
    </fieldset>

    <div>
      <div id="people-label" class="text-[14px] font-medium text-fg">
        {{ company ? "Who can use and manage it?" : "Who will use it?" }}
      </div>
      <p class="mt-0.5 mb-2 text-[13px] text-fg-3">
        {{
          company
            ? `Up to ${MAX_CONTACTS} people. They can see the card’s details and transactions. The card shows the company name.`
            : "The card is issued in this person’s name. Only they and the account owner can see its full details."
        }}
      </p>
      <PersonSelect
        :people="people"
        :multiple="company"
        :selected="company ? contacts : card.holderId ? [card.holderId] : []"
        :disabled="disabled"
        :invalid="!!error"
        :max="MAX_CONTACTS"
        @pick="onPick"
        @add-new="inviting = true"
      />
      <p v-if="error" id="holder-err" class="mt-1.5 text-[12px] text-error">{{ error }}</p>
      <InviteSomeone v-if="!disabled && inviting" @close="inviting = false" @added="onAdded" />
    </div>
  </div>
</template>
