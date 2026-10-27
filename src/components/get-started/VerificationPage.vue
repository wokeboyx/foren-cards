<script setup lang="ts">
import { computed } from "vue";
import { RiFlaskLine } from "@/components/icons";
import EmptyState from "@/components/EmptyState.vue";
import LinkButton from "@/components/LinkButton.vue";
import Panel from "@/components/Panel.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { peopleOf, useOnboardingStore } from "@/stores/onboarding";
import GroupLabel from "./GroupLabel.vue";
import SetupColumn from "./SetupColumn.vue";
import SetupHeader from "./SetupHeader.vue";
import VerificationRow from "./VerificationRow.vue";

const s = useOnboardingStore();

// Companies that own shares aren't verified themselves; the people behind them are.
const people = computed(() => peopleOf(s.stakeholders));
const groups = computed(() =>
  [
    { label: "Requires action", people: people.value.filter((p) => p.status === "action_required") },
    { label: "Awaiting response", people: people.value.filter((p) => p.status === "pending" || p.status === "not_sent") },
    { label: "Verified", people: people.value.filter((p) => p.status === "verified") },
  ].filter((g) => g.people.length > 0)
);
/** Prototype-only: stand in for stakeholders finishing (or failing) their checks. */
const open = computed(() => people.value.filter((p) => p.status !== "verified"));

function everyoneVerifies() {
  s.set({ stakeholders: s.stakeholders.map((p) => ({ ...p, status: "verified" as const, note: undefined })) });
}
function oneNeedsAction() {
  const target = open.value[0];
  s.patchStakeholder(target.id, { status: "action_required", note: `${target.firstName}’s ID photo was too blurry to read. Ask them to retake it in good light.` });
}
</script>

<template>
  <SetupColumn v-if="!s.invitesSentAt">
    <SetupHeader back="/get-started" title="Stakeholder verification" />
    <Panel>
      <EmptyState title="No invitations sent yet" body="Add your directors and owners first. We’ll email each of them a link to verify their identity.">
        <template #action>
          <LinkButton href="/get-started/stakeholders" size="sm">Add stakeholders</LinkButton>
        </template>
      </EmptyState>
    </Panel>
  </SetupColumn>

  <SetupColumn v-else>
    <SetupHeader
      back="/get-started"
      title="Stakeholder verification"
      description="Track each stakeholder’s identity check. Everyone must finish before we can activate your account."
    >
      <template #action>
        <LinkButton href="/get-started" variant="secondary" size="xs">Skip</LinkButton>
      </template>
    </SetupHeader>
    <div aria-live="polite" class="flex flex-col gap-8">
      <section v-for="g in groups" :key="g.label">
        <GroupLabel>{{ g.label }}</GroupLabel>
        <ul class="flex flex-col gap-4">
          <li v-for="p in g.people" :key="p.id">
            <VerificationRow :person="p" />
          </li>
        </ul>
      </section>
    </div>
    <div v-if="open.length" class="mt-10 rounded-[16px] border border-dashed border-line-2 px-4 py-3">
      <p class="flex items-center gap-1.5 text-[12px] leading-[18px] font-semibold text-fg-3">
        <RiFlaskLine class="size-3.5" aria-hidden="true" />
        Prototype: simulate stakeholder responses
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <ForenButton variant="secondary" size="xxs" @click="everyoneVerifies">Everyone verifies</ForenButton>
        <ForenButton variant="secondary" size="xxs" @click="oneNeedsAction">One needs action</ForenButton>
      </div>
    </div>
  </SetupColumn>
</template>
