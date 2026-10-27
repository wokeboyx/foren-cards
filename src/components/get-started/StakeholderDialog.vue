<script setup lang="ts">
/**
 * Add or edit a stakeholder: a person, a company that owns shares, or a person who owns the business
 * through one of those companies (`parent`).
 */
import { computed, reactive, ref } from "vue";
import Modal from "@/components/Modal.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenCheckbox from "@/components/ui/ForenCheckbox.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import { CONTROL_TYPES, type ControlType } from "@/domain/onboarding";
import { uid } from "@/stores/app";
import { PERSON, type Stakeholder } from "@/stores/onboarding";
import { fullName } from "./shared";
import StakeholderCountrySelect from "./StakeholderCountrySelect.vue";
import { adultCutoff, EMAIL } from "./stakeholders";

const props = defineProps<{
  kind: "person" | "company";
  person: Stakeholder | null;
  parent: Stakeholder | null;
  all: Stakeholder[];
  threshold: number;
}>();
const emit = defineEmits<{ close: []; save: [p: Stakeholder] }>();

const base: Stakeholder = props.person ?? {
  ...PERSON,
  kind: props.kind,
  id: uid("sh"),
  firstName: "",
  lastName: "",
  email: "",
  position: "",
  parentId: props.parent?.id,
  source: "added",
  status: "not_sent",
};
const v = reactive({ ...base, control: [...base.control], ownershipText: base.ownership ? String(base.ownership) : "" });
const tried = ref(false);
const company = props.kind === "company";
const nested = !!props.parent;
const today = new Date().toISOString().slice(0, 10);

const pct = computed(() => Number(v.ownershipText));
const siblingsTotal = computed(() =>
  props.all
    .filter((p) => p.id !== v.id && (nested ? p.parentId === props.parent!.id : !p.parentId && (p.shareholder || p.kind === "company")))
    .reduce((a, p) => a + p.ownership, 0)
);
const holdsShares = computed(() => company || nested || v.shareholder);
const effective = computed(() =>
  nested ? Math.round(((props.parent!.ownership * (pct.value || 0)) / 100) * 100) / 100 : holdsShares.value ? pct.value || 0 : 0
);
const needsControl = computed(() => !company && (effective.value >= props.threshold || v.controller));
const showControl = computed(() => !company && (holdsShares.value || v.controller));

const errors = computed(() => {
  const e: Partial<Record<string, string>> = {};
  if (!v.firstName.trim()) e.firstName = company ? "Enter the company name" : "Enter a first name";
  if (company) {
    if (!v.regNumber.trim()) e.regNumber = "Enter the registration number";
    if (!v.regCountry) e.regCountry = "Choose the country of registration";
  } else {
    if (!v.lastName.trim()) e.lastName = "Enter a last name";
    if (!EMAIL.test(v.email.trim())) e.email = "Enter a valid email address";
    else if (props.all.some((p) => p.id !== v.id && p.email && p.email.toLowerCase() === v.email.trim().toLowerCase())) e.email = "Someone else already uses this email";
    if (!v.position.trim()) e.position = nested ? "Enter their role, e.g. Owner" : "Enter their position, e.g. CEO";
    if (!v.dob) e.dob = "Enter their date of birth";
    else if (v.dob >= today) e.dob = "Date of birth must be in the past";
    else if ((v.director || v.signatory || v.controller) && v.dob > adultCutoff()) e.dob = "Directors, signatories and controllers must be 18 or older";
    if (!v.nationality) e.nationality = "Choose their nationality";
    if (!nested && !v.director && !v.shareholder && !v.signatory && !v.controller) e.role = "Choose at least one role";
    if (needsControl.value && !v.control.length) e.control = "Choose at least one";
    else if (v.control.includes("other") && !v.controlOther.trim()) e.control = "Describe the other control";
  }
  if (holdsShares.value) {
    if (!v.ownershipText || !Number.isFinite(pct.value) || pct.value <= 0) e.ownership = "Enter a percentage above 0";
    else if (pct.value > 100) e.ownership = "Can’t be more than 100%";
    else if (siblingsTotal.value + pct.value > 100) e.ownership = `Only ${Math.max(0, 100 - siblingsTotal.value)}% is left to assign`;
  }
  return e;
});
const show = (k: string) => (tried.value ? errors.value[k] : undefined);
const toggleControl = (c: ControlType, on: boolean) => (v.control = on ? [...v.control, c] : v.control.filter((x) => x !== c));
const pctOnly = (text: string | number | undefined) => (v.ownershipText = String(text ?? "").replace(/[^\d.]/g, ""));
const onShareholder = (c: boolean | "indeterminate") => {
  v.shareholder = c === true;
  if (c === true && !v.control.length) v.control = ["shares"];
};

const title = company
  ? props.person
    ? "Edit company details"
    : "Add a company that owns shares"
  : nested
    ? `${props.person ? "Edit" : "Add"} an owner of ${fullName(props.parent!)}`
    : props.person
      ? "Edit stakeholder details"
      : "Add stakeholder details";

function submit() {
  tried.value = true;
  if (Object.keys(errors.value).length) return;
  const rest: Stakeholder & { ownershipText?: string } = { ...v };
  delete rest.ownershipText;
  emit("save", {
    ...rest,
    firstName: v.firstName.trim(),
    lastName: company ? "" : v.lastName.trim(),
    email: v.email.trim(),
    position: v.position.trim(),
    regNumber: v.regNumber.trim(),
    ownership: holdsShares.value ? pct.value : 0,
    shareholder: company || nested ? false : v.shareholder,
    control: showControl.value ? [...v.control] : [],
    controlOther: showControl.value && v.control.includes("other") ? v.controlOther.trim() : "",
  });
}
</script>

<template>
  <Modal open :title="title" class="sm:max-w-[480px]" @update:open="(o) => !o && emit('close')">
    <form novalidate class="flex flex-col gap-5" @submit.prevent="submit">
      <template v-if="company">
        <p class="-mt-2 text-[13px] leading-[19px] font-medium text-fg-2">A company that holds shares in your business. After adding it, add the people who own it.</p>
        <ForenInput v-model="v.firstName" label="Company name" :error="show('firstName')" autocomplete="off" />
        <div class="grid gap-3 sm:grid-cols-2">
          <ForenInput v-model="v.regNumber" label="Registration number" :error="show('regNumber')" />
          <StakeholderCountrySelect id="sh-reg-country" v-model="v.regCountry" label="Country of registration" :error="show('regCountry')" />
        </div>
      </template>
      <template v-else>
        <p v-if="nested" class="-mt-2 text-[13px] leading-[19px] font-medium text-fg-2">
          {{ fullName(parent!) }} owns {{ parent!.ownership }}% of your business. Add each person who owns or controls it.
        </p>
        <div class="grid grid-cols-2 gap-3">
          <ForenInput v-model="v.firstName" label="First name" :error="show('firstName')" autocomplete="off" />
          <ForenInput v-model="v.lastName" label="Last name" :error="show('lastName')" autocomplete="off" />
        </div>
        <ForenInput
          v-model="v.email"
          label="Email address"
          type="email"
          :error="show('email')"
          description="Use an inbox they check. We’ll send their verification link here."
          autocomplete="off"
        />
        <ForenInput
          v-model="v.position"
          :label="nested ? `Role at ${fullName(parent!)}` : 'Position'"
          :placeholder="nested ? 'e.g. Owner' : 'e.g. CFO'"
          :error="show('position')"
        />
        <div class="grid gap-3 sm:grid-cols-2">
          <ForenInput v-model="v.dob" label="Date of birth" type="date" :max="today" :error="show('dob')" />
          <StakeholderCountrySelect id="sh-nationality" v-model="v.nationality" label="Nationality" :error="show('nationality')" />
        </div>
        <p class="-mt-3 text-[12px] leading-[18px] font-medium text-fg-3">As shown on their ID. Their ID check confirms these.</p>
      </template>

      <ForenInput
        v-if="company || nested"
        :model-value="v.ownershipText"
        :label="nested ? `Share of ${fullName(parent!)}` : 'Shareholding in your business'"
        inputmode="decimal"
        :error="show('ownership')"
        :description="nested && pct > 0 ? `That’s ${effective}% of your business.` : undefined"
        @update:model-value="pctOnly"
      >
        <template #trailingIcon><span class="text-[14px] font-medium text-fg-3">%</span></template>
      </ForenInput>
      <fieldset v-else class="flex flex-col gap-3" :aria-describedby="show('role') ? 'role-error' : undefined">
        <legend class="sr-only">Their role</legend>
        <ForenCheckbox
          :model-value="v.director"
          label="A director"
          description="An executive with legal authority to act for the company."
          @update:model-value="(c) => (v.director = c === true)"
        />
        <ForenCheckbox
          :model-value="v.shareholder"
          label="A shareholder"
          :description="`Owns shares. Everyone with ${threshold}% or more must be listed.`"
          @update:model-value="onShareholder"
        />
        <div v-if="v.shareholder" class="pl-8">
          <ForenInput :model-value="v.ownershipText" label="Shareholding percentage" inputmode="decimal" :error="show('ownership')" @update:model-value="pctOnly">
            <template #trailingIcon><span class="text-[14px] font-medium text-fg-3">%</span></template>
          </ForenInput>
        </div>
        <ForenCheckbox
          :model-value="v.signatory"
          label="An authorised signatory"
          description="Can sign documents and approve payments for the business."
          @update:model-value="(c) => (v.signatory = c === true)"
        />
        <ForenCheckbox
          :model-value="v.controller"
          label="Has significant control"
          :description="`Controls the business without owning ${threshold}% or more, e.g. the CEO or managing director.`"
          @update:model-value="(c) => (v.controller = c === true)"
        />
        <p v-if="show('role')" id="role-error" role="alert" class="text-[12px] leading-[18px] font-medium text-error">{{ errors.role }}</p>
      </fieldset>

      <fieldset v-if="showControl" class="flex flex-col gap-3 rounded-[16px] border border-line p-4" :aria-describedby="show('control') ? 'control-error' : undefined">
        <legend class="px-1 text-[14px] leading-[21px] font-medium text-fg">
          Nature of control<span v-if="!needsControl" class="text-fg-3"> (optional)</span>
        </legend>
        <p class="-mt-1 text-[12px] leading-[18px] font-medium text-fg-3">How they own or control {{ nested ? "it" : "the business" }}. Tick all that apply.</p>
        <ForenCheckbox
          v-for="t in CONTROL_TYPES"
          :key="t.id"
          :model-value="v.control.includes(t.id)"
          :label="t.label"
          @update:model-value="(c) => toggleControl(t.id, c === true)"
        />
        <ForenInput v-if="v.control.includes('other')" v-model="v.controlOther" label="Describe their control" placeholder="e.g. Veto over major decisions" />
        <p v-if="show('control')" id="control-error" role="alert" class="text-[12px] leading-[18px] font-medium text-error">{{ errors.control }}</p>
      </fieldset>

      <div class="mt-1 grid grid-cols-2 gap-3 border-t border-line pt-5">
        <ForenButton type="button" variant="outline" size="sm" @click="emit('close')">Cancel</ForenButton>
        <ForenButton type="submit" size="sm">{{ person ? "Save changes" : company ? "Add company" : "Add person" }}</ForenButton>
      </div>
    </form>
  </Modal>
</template>
