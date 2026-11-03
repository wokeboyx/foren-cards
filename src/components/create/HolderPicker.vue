<script setup lang="ts">
/**
 * "Who's it for?" Only the account admin creates cards. The default is a card for the company, which only the
 * admin can see and manage. The admin can instead issue one in a team member's name, who can be someone who isn't on Foren yet.
 */
import { computed, ref } from "vue";
import { RiBuilding2Line, RiLockLine, RiUserLine } from "@/components/icons";
import type { Card, Person } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { allPeople, useAppStore } from "@/stores/app";
import ChoiceCard from "./ChoiceCard.vue";
import InviteSomeone from "./InviteSomeone.vue";
import PersonSelect from "./PersonSelect.vue";

const props = defineProps<{
  card: Pick<Card, "holderId" | "companyCard">;
  error?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ change: [patch: Partial<Card>] }>();

const store = useAppStore();
// Re-evaluate when someone is invited.
const everyone = computed(() => (store.invitedPeople, allPeople()));
const owner = computed(() => everyone.value.find((p) => p.role === "owner"));
// The admin isn't "staff": only team members can be picked.
const people = computed(() => everyone.value.filter((p) => p.role !== "owner"));
const company = computed(() => !!props.card.companyCard);
const inviting = ref(false);
// Remember the team member while the admin flips back and forth.
const lastMember = ref(company.value ? "" : props.card.holderId);

function choose(kind: "company" | "member") {
  if (kind === "company") {
    if (props.card.holderId) lastMember.value = props.card.holderId;
    inviting.value = false;
    emit("change", { companyCard: true, holderId: owner.value?.id ?? "" });
  } else emit("change", { companyCard: false, holderId: lastMember.value });
}

function onPick(id: string) {
  lastMember.value = id;
  emit("change", { holderId: id });
}

function onAdded(p: Person) {
  onPick(p.id);
  inviting.value = false;
}
</script>

<template>
  <fieldset class="space-y-3" :disabled="disabled">
    <legend class="mb-2 text-[14px] font-medium text-fg">
      Who is this card for?
    </legend>
    <div class="grid gap-2">
      <ChoiceCard
        name="card-for"
        value="company"
        :checked="company"
        :disabled="disabled"
        :title="`For ${COMPANY.name}`"
        @change="choose('company')"
      >
        <template #icon><RiBuilding2Line aria-hidden="true" /></template>
        <template #badge
          ><span
            class="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-fg-2"
            >Default</span
          ></template
        >
        <template #description>For suppliers and shared spending.</template>
      </ChoiceCard>
      <ChoiceCard
        name="card-for"
        value="member"
        :checked="!company"
        :disabled="disabled"
        title="A team member"
        @change="choose('member')"
      >
        <template #icon><RiUserLine aria-hidden="true" /></template>
        <template #description
          >Issued in their name, for travel and their own spending.</template
        >
      </ChoiceCard>
    </div>

    <p
      v-if="company"
      class="flex items-start gap-2 rounded-[14px] bg-subtle px-3.5 py-2.5 text-[13px] leading-[18px] text-fg-2"
    >
      <RiLockLine class="mt-px size-4 shrink-0 text-fg-3" aria-hidden="true" />
      Only you can see and manage this card.
    </p>
    <div v-else>
      <div id="people-label" class="text-[14px] font-medium text-fg">
        Which team member is it for?
      </div>
      <p class="mt-0.5 mb-2 text-[13px] text-fg-3">
        The card is issued in their name. Only they and you can see its full
        details.
      </p>
      <PersonSelect
        :people="people"
        :multiple="false"
        :selected="card.holderId ? [card.holderId] : []"
        :disabled="disabled"
        :invalid="!!error"
        :max="1"
        @pick="onPick"
        @add-new="inviting = true"
      />
      <p v-if="error" id="holder-err" class="mt-1.5 text-[12px] text-error">
        {{ error }}
      </p>
      <InviteSomeone
        v-if="!disabled && inviting"
        @close="inviting = false"
        @added="onAdded"
      />
    </div>
  </fieldset>
</template>
