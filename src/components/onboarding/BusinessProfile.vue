<script setup lang="ts">
/** Step 4b "A few more things" (Figma 3035:73737–73923): turnover, sector, category, website. */
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import ForenCheckbox from "@/components/ui/ForenCheckbox.vue";
import { SECTORS, TURNOVER_BANDS, countryInfo, isNewBusiness, isScumlCategory } from "@/domain/onboarding";
import { useSignupGuard } from "@/composables/useSignupGuard";
import { useOnboardingStore } from "@/stores/onboarding";
import { cn } from "@/lib/utils";
import Field from "./Field.vue";
import FormCard from "./FormCard.vue";
import Note from "./Note.vue";
import OnboardingFrame from "./OnboardingFrame.vue";
import { fieldCls } from "./frame";

const ready = useSignupGuard("/onboarding/business/profile");
const router = useRouter();
const store = useOnboardingStore();
const saved = store.profile;

const turnover = ref(saved?.turnover ?? "");
const sector = ref(saved?.sector ?? "");
const category = ref(saved?.category ?? "");
const website = ref(saved?.website ?? "");
const notTrading = ref(saved?.notTrading ?? false);
const websiteTouched = ref(false);

const currency = computed(() => countryInfo(store.country)?.currency ?? "");
const categories = computed(() => SECTORS.find((s) => s.name === sector.value)?.categories ?? []);
const websiteError = computed(() =>
  website.value && !/^https:\/\/[^\s.]+\.[^\s]+$/.test(website.value.trim()) ? "Enter a full address starting with https://" : undefined
);
const scuml = computed(() => store.country === "NG" && isScumlCategory(sector.value, category.value));
const isNew = computed(() => notTrading.value || isNewBusiness(store.business?.incorporatedOn));
const complete = computed(() => !!(turnover.value && sector.value && category.value && !websiteError.value));

const footer = computed(() => ({
  primary: {
    label: "Continue",
    disabled: !complete.value,
    onClick: () => {
      store.set({
        profile: { turnover: turnover.value, sector: sector.value, category: category.value, website: website.value.trim(), notTrading: notTrading.value },
      });
      router.push(store.entity === "mto" ? "/onboarding/compliance" : "/onboarding/review");
    },
  },
}));

function onSector(e: Event) {
  sector.value = (e.target as HTMLSelectElement).value;
  category.value = "";
}
function onWebsiteBlur() {
  if (website.value === "https://") website.value = "";
  websiteTouched.value = true;
}
</script>

<template>
  <OnboardingFrame
    v-if="ready && store.country"
    step="business"
    back="/onboarding/business"
    title="A few more things"
    description="Enter your official business information to complete KYB verification and activate your account."
    :footer="footer"
  >
    <div class="flex flex-col gap-4">
      <FormCard>
        <Field label="Annual turnover" html-for="turnover">
          <select id="turnover" v-model="turnover" :class="cn(fieldCls, !turnover && 'text-fg-3')">
            <option value="">Select a range</option>
            <option v-for="b in TURNOVER_BANDS" :key="b" :value="b">{{ currency }} {{ b }}</option>
          </select>
        </Field>
        <Field label="Business sector" html-for="sector">
          <select id="sector" :value="sector" :class="cn(fieldCls, !sector && 'text-fg-3')" @change="onSector">
            <option value="">Select a sector</option>
            <option v-for="s in SECTORS" :key="s.name">{{ s.name }}</option>
          </select>
        </Field>
        <Field label="Business category" html-for="category" :hint="!sector ? 'Choose a sector first.' : undefined">
          <select id="category" v-model="category" :disabled="!sector" :class="cn(fieldCls, !category && 'text-fg-3')">
            <option value="">Select a category</option>
            <option v-for="c in categories" :key="c.name">{{ c.name }}</option>
          </select>
        </Field>
        <Field label="Website/Socials (optional)" html-for="website" :error="websiteTouched ? websiteError : undefined">
          <input
            id="website"
            v-model="website"
            type="url"
            inputmode="url"
            placeholder="https://"
            :aria-invalid="(websiteTouched && !!websiteError) || undefined"
            :class="fieldCls"
            autocomplete="url"
            @focus="!website && (website = 'https://')"
            @blur="onWebsiteBlur"
          />
        </Field>
        <ForenCheckbox
          :model-value="notTrading"
          label="We haven’t started trading yet"
          description="Tick this if the business has no sales or customers yet."
          @update:model-value="(v) => (notTrading = v === true)"
        />
      </FormCard>
      <Note v-if="scuml" intent="info">You’ll need a SCUML certificate for this category. We’ll ask for it with your documents.</Note>
      <Note v-if="isNew" intent="info">New businesses also share the owner’s bank statement and a business plan or proof of funding.</Note>
    </div>
  </OnboardingFrame>
</template>
