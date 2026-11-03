<script setup lang="ts">
import { computed } from "vue";
import { countryInfo, type CountryCode } from "@/domain/onboarding";
import { cn } from "@/lib/utils";
import Field from "./Field.vue";
import FormCard from "./FormCard.vue";
import Note from "./Note.vue";
import RegTypePicker from "./RegTypePicker.vue";
import { fieldCls } from "./frame";
import {
  POSTCODE_LABEL,
  REGIONS,
  type Manual,
  type RegType,
} from "./find-business";

const props = defineProps<{
  country: CountryCode;
  types: RegType[];
  touched: boolean;
}>();
const emit = defineEmits<{ back: [] }>();
const value = defineModel<Manual>({ required: true });
const regType = defineModel<string>("regType", { required: true });
const regNumber = defineModel<string>("regNumber", { required: true });

const info = computed(() => countryInfo(props.country)!);
const region = computed(() => REGIONS[props.country]);
const up = (k: keyof Manual, e: Event) =>
  (value.value = {
    ...value.value,
    [k]: (e.target as HTMLInputElement | HTMLSelectElement).value,
  });
const err = (k: keyof Manual) =>
  props.touched && !value.value[k] ? "Required" : undefined;
const today = new Date().toISOString().slice(0, 10);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-[16px] leading-6 font-semibold text-fg">
        Enter your business manually
      </h2>
      <button
        type="button"
        class="shrink-0 text-[12px] font-medium text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
        @click="emit('back')"
      >
        Back to auto-lookup
      </button>
    </div>

    <RegTypePicker v-model="regType" :types="types" />

    <Field
      label="Registration number"
      html-for="m-reg"
      :hint="`Enter the number exactly as it appears on your ${info.registry} certificate.`"
    >
      <div class="flex gap-2">
        <span
          v-if="regType"
          class="grid h-12 min-w-12 shrink-0 place-items-center rounded-[16px] border border-line bg-subtle px-3 text-[14px] font-medium text-fg-2"
          >{{ regType }}-</span
        >
        <input
          id="m-reg"
          v-model="regNumber"
          :class="fieldCls"
          autocomplete="off"
        />
      </div>
    </Field>

    <FormCard>
      <Field
        label="Registered business name"
        html-for="m-name"
        :error="err('name')"
      >
        <input
          id="m-name"
          :value="value.name"
          :aria-invalid="!!err('name') || undefined"
          :class="fieldCls"
          autocomplete="organization"
          @input="up('name', $event)"
        />
      </Field>
      <Field
        label="Date incorporated"
        html-for="m-date"
        :error="err('incorporatedOn')"
      >
        <input
          id="m-date"
          type="date"
          :max="today"
          :value="value.incorporatedOn"
          :aria-invalid="!!err('incorporatedOn') || undefined"
          :class="fieldCls"
          @input="up('incorporatedOn', $event)"
        />
      </Field>
      <fieldset class="flex flex-col gap-4">
        <legend class="mb-4 text-[16px] leading-6 font-semibold text-fg">
          Business address
        </legend>
        <div class="grid gap-4 sm:grid-cols-2">
          <Field label="Street no." html-for="m-no">
            <input
              id="m-no"
              :value="value.streetNo"
              :class="fieldCls"
              autocomplete="address-line1"
              @input="up('streetNo', $event)"
            />
          </Field>
          <Field label="Street name" html-for="m-street" :error="err('street')">
            <input
              id="m-street"
              :value="value.street"
              :aria-invalid="!!err('street') || undefined"
              :class="fieldCls"
              autocomplete="address-line2"
              @input="up('street', $event)"
            />
          </Field>
          <Field label="City" html-for="m-city" :error="err('city')">
            <input
              id="m-city"
              :value="value.city"
              :aria-invalid="!!err('city') || undefined"
              :class="fieldCls"
              autocomplete="address-level2"
              @input="up('city', $event)"
            />
          </Field>
          <Field
            :label="region.label"
            html-for="m-region"
            :error="err('region')"
          >
            <select
              id="m-region"
              :value="value.region"
              :aria-invalid="!!err('region') || undefined"
              :class="cn(fieldCls, !value.region && 'text-fg-3')"
              @change="up('region', $event)"
            >
              <option value="">Select {{ region.label.toLowerCase() }}</option>
              <option v-for="o in region.options" :key="o">{{ o }}</option>
            </select>
          </Field>
          <Field label="Area" html-for="m-area">
            <input
              id="m-area"
              :value="value.area"
              :class="fieldCls"
              @input="up('area', $event)"
            />
          </Field>
          <Field :label="POSTCODE_LABEL[country]" html-for="m-post">
            <input
              id="m-post"
              :value="value.postcode"
              :class="fieldCls"
              autocomplete="postal-code"
              @input="up('postcode', $event)"
            />
          </Field>
        </div>
      </fieldset>
    </FormCard>
    <Note intent="info"
      >Our compliance team checks details entered by hand against your
      documents, so make sure they match your certificate.</Note
    >
  </div>
</template>
