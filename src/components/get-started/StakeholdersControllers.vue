<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { RiAddLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import LinkButton from "@/components/LinkButton.vue";
import { formatDate } from "@/components/onboarding/shared";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenCheckbox from "@/components/ui/ForenCheckbox.vue";
import { countryInfo, minDirectors, uboThreshold } from "@/domain/onboarding";
import {
  peopleOf,
  ubosOf,
  useOnboardingStore,
  type Stakeholder,
} from "@/stores/onboarding";
import DeclarationDialog from "./DeclarationDialog.vue";
import GroupLabel from "./GroupLabel.vue";
import Note from "./Note.vue";
import PeopleList from "./PeopleList.vue";
import SentDialog from "./SentDialog.vue";
import SetupColumn from "./SetupColumn.vue";
import SetupHeader from "./SetupHeader.vue";
import { fullName } from "./shared";
import StakeholderDialog from "./StakeholderDialog.vue";
import type { Editing } from "./stakeholders";

const s = useOnboardingStore();
const router = useRouter();
const threshold = computed(() => uboThreshold(s.country!, s.entity!)!);
const needDirectors = computed(() => minDirectors(s.entity!));
const registry = computed(
  () => countryInfo(s.country!)?.registry ?? "registry",
);

const editing = ref<Editing | null>(null);
const removing = ref<Stakeholder | null>(null);
const sent = ref(false);
const tried = ref(false);
const declaring = ref(false);
const viewing = ref(false);

const all = computed(() => s.stakeholders);
const people = computed(() => peopleOf(all.value));
const top = computed(() => all.value.filter((p) => !p.parentId));
const fromRegistry = computed(() =>
  top.value.filter((p) => p.source === "registry"),
);
const added = computed(() => top.value.filter((p) => p.source === "added"));
const total = computed(() =>
  top.value
    .filter((p) => p.shareholder || p.kind === "company")
    .reduce((a, p) => a + p.ownership, 0),
);
const missingOwnership = computed(() =>
  all.value.filter(
    (p) =>
      (p.shareholder || p.kind === "company" || p.parentId) && !p.ownership,
  ),
);
const locked = computed(() => s.stakeholdersSubmitted);

const problems = computed(() => {
  const list: string[] = [];
  const ppl = people.value;
  const ubos = ubosOf(all.value, threshold.value);
  const controllers = ppl.filter((p) => p.controller);
  const directors = ppl.filter((p) => p.director).length;
  const signatories = ppl.filter((p) => p.signatory).length;
  const missingDetails = ppl.filter((p) => !p.dob || !p.nationality);
  const missingControl = ppl.filter(
    (p) => (ubos.includes(p) || p.controller) && !p.control.length,
  );
  const t = threshold.value;
  if (ppl.length === 0) list.push("Add at least one person.");
  if (directors < needDirectors.value)
    list.push(
      `Add at least ${needDirectors.value} directors. You have ${directors}.`,
    );
  if (ppl.length && signatories === 0)
    list.push("Add at least one authorised signatory.");
  if (missingOwnership.value.length)
    list.push(
      `Add the ownership percentage for ${missingOwnership.value.map(fullName).join(" and ")}.`,
    );
  if (missingDetails.length)
    list.push(
      `Add the date of birth and nationality for ${missingDetails.map(fullName).join(" and ")}.`,
    );
  if (missingControl.length)
    list.push(
      `Add the nature of control for ${missingControl.map(fullName).join(" and ")}.`,
    );
  if (total.value > 100)
    list.push(
      `Ownership adds up to ${total.value}%. It can’t be more than 100%.`,
    );
  for (const c of all.value.filter((p) => p.kind === "company")) {
    const owners = all.value.filter((p) => p.parentId === c.id);
    const held = owners.reduce((a, p) => a + p.ownership, 0);
    if (c.ownership >= t && owners.length === 0)
      list.push(`Add the people who own ${fullName(c)}.`);
    if (held > 100)
      list.push(
        `Owners of ${fullName(c)} add up to ${held}%. It can’t be more than 100%.`,
      );
  }
  if (ppl.length && !ubos.length && !s.noMajorOwner)
    list.push(
      `No individual owns ${t}% or more. Tick the box below and add the person with significant control.`,
    );
  if (s.noMajorOwner && ubos.length)
    list.push(
      `${ubos.map(fullName).join(" and ")} own ${t}% or more. Untick “No individual owns ${t}% or more”.`,
    );
  if (s.noMajorOwner && !ubos.length && !controllers.length)
    list.push(
      "Add the person with significant control, and tick “Has significant control” for them.",
    );
  return list;
});

// Checks first, then the declaration, built from this list. Confirming it sends the invitations.
function review() {
  tried.value = true;
  if (problems.value.length) return;
  declaring.value = true;
}
function confirm() {
  const now = new Date().toISOString();
  declaring.value = false;
  s.set({
    stakeholdersSubmitted: true,
    declaration: {
      confirmedAt: now,
      name: `${s.firstName} ${s.lastName}`.trim(),
      email: s.email,
      position: s.position,
      phone: s.phone,
    },
    invitesSentAt: now,
    stakeholders: all.value.map((p) =>
      p.kind === "company" || p.status === "verified"
        ? p
        : { ...p, status: "pending" as const },
    ),
  });
  sent.value = true;
}

const edit = (p: Stakeholder) =>
  (editing.value = {
    kind: p.kind,
    person: p,
    parent: all.value.find((x) => x.id === p.parentId) ?? null,
  });
const addOwner = (c: Stakeholder) =>
  (editing.value = { kind: "person", person: null, parent: c });
function save(p: Stakeholder) {
  const wasEdit = !!editing.value?.person;
  s.upsertStakeholder(p);
  editing.value = null;
  toast.success(wasEdit ? "Changes saved" : `${fullName(p)} added`);
}
const removeConsequence = computed(() =>
  removing.value?.source === "registry"
    ? `They’re listed in the ${registry.value} record. Only remove them if they’ve left the business.`
    : removing.value?.kind === "company"
      ? "The people listed as its owners are removed too."
      : "They won’t get a verification link.",
);
function remove() {
  if (removing.value) s.removeStakeholder(removing.value.id);
  removing.value = null;
}
function done() {
  sent.value = false;
  router.push("/get-started");
}
const addCls =
  "flex h-12 items-center gap-3 rounded-[16px] px-2 text-left text-[14px] font-medium text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus";
</script>

<template>
  <SetupColumn>
    <SetupHeader
      back="/get-started"
      title="Add key business controllers"
      :description="`List everyone who is a director, owns ${threshold}% or more (directly or through another company), or can sign for the business.`"
    />

    <div v-if="!locked" class="mb-8 flex flex-col gap-1 sm:flex-row sm:gap-3">
      <button
        type="button"
        :class="addCls"
        @click="editing = { kind: 'person', person: null, parent: null }"
      >
        <span
          class="grid size-7 shrink-0 place-items-center rounded-full border border-line-2 text-fg-2"
          ><RiAddLine class="size-4" aria-hidden="true"
        /></span>
        Add a person
      </button>
      <button
        type="button"
        :class="addCls"
        @click="editing = { kind: 'company', person: null, parent: null }"
      >
        <span
          class="grid size-7 shrink-0 place-items-center rounded-full border border-line-2 text-fg-2"
          ><RiAddLine class="size-4" aria-hidden="true"
        /></span>
        Add a company that owns shares
      </button>
    </div>
    <Note
      v-else
      intent="success"
      class="mb-8"
      title="Declaration confirmed and invitations sent"
    >
      <template v-if="s.declaration">
        {{ s.declaration.name }} confirmed the declaration on
        {{ formatDate(s.declaration.confirmedAt) }}.
        <button
          type="button"
          class="font-semibold underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
          @click="viewing = true"
        >
          View declaration
        </button>
        <br />
      </template>
      You can follow each person’s progress on the verification page.
      <LinkButton
        href="/get-started/verification"
        variant="link"
        size="xs"
        class="text-success underline"
        >View verification</LinkButton
      >
    </Note>

    <section v-if="added.length > 0" class="mb-6">
      <GroupLabel>Newly added</GroupLabel>
      <PeopleList
        :items="added"
        :all="all"
        :threshold="threshold"
        :locked="locked"
        @edit="edit"
        @remove="removing = $event"
        @add-owner="addOwner"
      />
    </section>
    <section v-if="fromRegistry.length > 0" class="mb-6">
      <GroupLabel>From {{ registry }}</GroupLabel>
      <PeopleList
        :items="fromRegistry"
        :all="all"
        :threshold="threshold"
        :locked="locked"
        @edit="edit"
        @remove="removing = $event"
        @add-owner="addOwner"
      />
    </section>

    <div
      v-if="top.length > 0 && missingOwnership.length === 0"
      class="mb-3"
      aria-live="polite"
    >
      <Note v-if="total === 100" intent="success"
        >Total ownership: 100% — fully allocated</Note
      >
      <Note v-else-if="total > 100" intent="error"
        >Total allocated: {{ total }}% — {{ total - 100 }}% too much</Note
      >
      <Note v-else intent="warning">
        Total allocated: {{ total }}% — {{ 100 - total }}% unassigned. That’s
        fine if the rest is held by people who own less than {{ threshold }}%.
      </Note>
    </div>

    <div
      v-if="people.length > 0"
      class="mb-6 rounded-[16px] bg-surface px-4 py-3.5"
    >
      <ForenCheckbox
        :model-value="s.noMajorOwner"
        :disabled="locked"
        :label="`No individual owns ${threshold}% or more`"
        description="Then add the person with significant management control, such as the CEO or managing director, and tick “Has significant control” for them."
        @update:model-value="(c) => s.set({ noMajorOwner: c === true })"
      />
    </div>

    <template v-if="!locked">
      <Note intent="info" class="mb-6">
        Each person gets a unique link to verify their ID, upload proof of
        address and take a liveness check. Links expire in 72 hours. Companies
        don’t get a link: their owners do.
      </Note>
      <div
        v-if="tried && problems.length > 0"
        role="alert"
        class="mb-4 rounded-[12px] bg-error-subtle px-3 py-2.5 text-[13px] leading-[19px] font-medium text-error"
      >
        <ul class="list-disc space-y-0.5 pl-4">
          <li v-for="p in problems" :key="p">{{ p }}</li>
        </ul>
      </div>
      <ForenButton size="md" class="w-full" @click="review"
        >Review declaration</ForenButton
      >
    </template>

    <StakeholderDialog
      v-if="editing"
      :key="
        editing.person?.id ?? `new-${editing.kind}-${editing.parent?.id ?? ''}`
      "
      :kind="editing.kind"
      :person="editing.person"
      :parent="editing.parent"
      :all="all"
      :threshold="threshold"
      @close="editing = null"
      @save="save"
    />

    <ConfirmDialog
      :open="!!removing"
      :title="`Remove ${removing ? fullName(removing) : ''}?`"
      :consequence="removeConsequence"
      confirm-label="Remove"
      destructive
      @update:open="(o) => !o && (removing = null)"
      @confirm="remove"
    />

    <DeclarationDialog
      v-if="declaring || viewing"
      :threshold="threshold"
      :read-only="viewing"
      @close="
        declaring = false;
        viewing = false;
      "
      @confirm="confirm"
    />

    <SentDialog :open="sent" :people="peopleOf(s.stakeholders)" @done="done" />
  </SetupColumn>
</template>
