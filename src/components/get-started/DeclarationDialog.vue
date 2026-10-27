<script setup lang="ts">
/**
 * The Director and UBO self-declaration, digital only. Sections 1–4 are filled in from sign-up and the
 * stakeholder list; Section 5 is the form's statement, confirmed with a tick instead of a signature.
 */
import { computed, ref } from "vue";
import Modal from "@/components/Modal.vue";
import { formatDate } from "@/components/onboarding/shared";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenCheckbox from "@/components/ui/ForenCheckbox.vue";
import { controlLabel, countryInfo, nationalityName } from "@/domain/onboarding";
import { effectiveOwnership, peopleOf, ubosOf, useOnboardingStore, type Stakeholder } from "@/stores/onboarding";
import DeclRow from "./DeclRow.vue";
import DeclSection from "./DeclSection.vue";
import Note from "./Note.vue";
import { fullName } from "./shared";

const props = defineProps<{ threshold: number; readOnly: boolean }>();
const emit = defineEmits<{ close: []; confirm: [] }>();

const s = useOnboardingStore();
const agreed = ref(false);
const tried = ref(false);
const all = computed(() => s.stakeholders);
const people = computed(() => peopleOf(all.value));
const ubos = computed(() => ubosOf(all.value, props.threshold));
const controllers = computed(() => people.value.filter((p) => p.controller && !ubos.value.includes(p)));
const companies = computed(() => all.value.filter((p) => p.kind === "company"));
const directors = computed(() => people.value.filter((p) => p.director));
const signatories = computed(() => people.value.filter((p) => p.signatory));
const b = computed(() => s.business);
const by = computed(() =>
  props.readOnly && s.declaration
    ? s.declaration
    : { name: `${s.firstName} ${s.lastName}`.trim(), email: s.email, position: s.position, phone: s.phone, confirmedAt: new Date().toISOString() }
);
const personLine = (p: Stakeholder) => [formatDate(p.dob), nationalityName(p.nationality), controlLabel(p.control, p.controlOther)].filter(Boolean).join(" · ");
const companyLine = computed(() =>
  [b.value?.regType && b.value.regNumber ? `${b.value.regType}-${b.value.regNumber}` : b.value?.regNumber, countryInfo(s.country)?.name].filter(Boolean).join(" · ")
);
const via = (p: Stakeholder) => all.value.find((x) => x.id === p.parentId);

function confirm() {
  tried.value = true;
  if (agreed.value) emit("confirm");
}
</script>

<template>
  <Modal
    open
    title="Director and UBO declaration"
    :description="readOnly ? undefined : 'We filled this in from your details. Check it, then confirm it on behalf of the business.'"
    class="sm:max-w-[560px]"
    @update:open="(o) => !o && emit('close')"
  >
    <div class="flex flex-col gap-6">
      <DeclSection title="Company information">
        <DeclRow :primary="b?.name ?? ''" :secondary="companyLine" />
      </DeclSection>
      <DeclSection :title="`Beneficial owners (${threshold}% or more)`">
        <template v-if="ubos.length">
          <DeclRow
            v-for="p in ubos"
            :key="p.id"
            :primary="`${fullName(p)} · ${effectiveOwnership(p, all)}%${via(p) ? ` through ${fullName(via(p)!)}` : ''}`"
            :secondary="personLine(p)"
          />
        </template>
        <p v-else class="text-[13px] leading-[19px] font-medium text-fg-2">No individual owns {{ threshold }}% or more.</p>
      </DeclSection>
      <DeclSection v-if="controllers.length > 0" title="Significant management control">
        <DeclRow v-for="p in controllers" :key="p.id" :primary="`${fullName(p)} · ${p.position}`" :secondary="personLine(p)" />
      </DeclSection>
      <DeclSection v-if="companies.length > 0" title="Companies that own shares">
        <DeclRow
          v-for="c in companies"
          :key="c.id"
          :primary="`${fullName(c)} · ${c.ownership}%`"
          :secondary="[c.regNumber, nationalityName(c.regCountry)].filter(Boolean).join(' · ')"
        />
      </DeclSection>
      <DeclSection title="Directors">
        <DeclRow v-for="p in directors" :key="p.id" :primary="fullName(p)" :secondary="`${p.position} · ${p.email}`" />
      </DeclSection>
      <DeclSection title="Authorised signatories">
        <DeclRow v-for="p in signatories" :key="p.id" :primary="fullName(p)" :secondary="`${p.position} · ${p.email}`" />
      </DeclSection>
      <DeclSection title="Statement of accuracy and compliance">
        <div class="flex flex-col gap-2 rounded-[12px] bg-subtle px-3 py-3 text-[13px] leading-[19px] font-medium text-fg-2">
          <p>
            I hereby declare that the information provided above is accurate, complete, and up-to-date to the best of my knowledge. I understand that failure to
            disclose accurate Director and UBO details may result in regulatory and/or operational consequences.
          </p>
          <p>
            Furthermore, I confirm that the Company complies with all applicable Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) regulations.
            Any changes to the UBO structure will be communicated to Foren promptly.
          </p>
        </div>
      </DeclSection>
      <DeclSection title="Authorised representative">
        <DeclRow
          :primary="[by.name, by.position].filter(Boolean).join(' · ')"
          :secondary="[by.email, by.phone, formatDate(by.confirmedAt)].filter(Boolean).join(' · ')"
        />
      </DeclSection>

      <Note v-if="readOnly" intent="success">Confirmed by {{ by.name }} on {{ formatDate(by.confirmedAt) }}.</Note>
      <template v-else>
        <div>
          <ForenCheckbox
            :model-value="agreed"
            :label="`I confirm this declaration on behalf of ${b?.name ?? 'the business'}`"
            description="Ticking this box takes the place of a signature."
            @update:model-value="(c) => (agreed = c === true)"
          />
          <p v-if="tried && !agreed" role="alert" class="mt-2 pl-8 text-[12px] leading-[18px] font-medium text-error">Tick the box to confirm the declaration</p>
        </div>
        <div class="grid grid-cols-2 gap-3 border-t border-line pt-5">
          <ForenButton type="button" variant="outline" size="sm" @click="emit('close')">Back to edit</ForenButton>
          <ForenButton type="button" size="sm" @click="confirm">Confirm and send invitations</ForenButton>
        </div>
      </template>
    </div>
  </Modal>
</template>
