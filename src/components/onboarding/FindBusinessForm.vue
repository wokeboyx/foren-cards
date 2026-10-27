<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import ForenSpinner from "@/components/ui/ForenSpinner.vue";
import { countryInfo, registrationTypes, type CountryCode } from "@/domain/onboarding";
import { registryBusiness, useOnboardingStore, type Business } from "@/stores/onboarding";
import { cn } from "@/lib/utils";
import Field from "./Field.vue";
import ManualEntry from "./ManualEntry.vue";
import ManualLink from "./ManualLink.vue";
import Note from "./Note.vue";
import RegTypePicker from "./RegTypePicker.vue";
import RegistryCard from "./RegistryCard.vue";
import RegistrySearch from "./RegistrySearch.vue";
import OnboardingFrame from "./OnboardingFrame.vue";
import { fieldCls } from "./frame";
import { EMPTY_MANUAL, fromBusiness, toBusiness, type Manual } from "./find-business";

const props = defineProps<{ country: CountryCode }>();

const router = useRouter();
const store = useOnboardingStore();
const entity = store.entity!;
const saved = store.business;
const info = countryInfo(props.country)!;
const types = registrationTypes(props.country, entity);
const searchCountry = types.length === 0;

const mode = ref<"lookup" | "manual">(saved?.source === "manual" ? "manual" : "lookup");
const regType = ref(saved?.regType ?? types[0]?.code ?? "");
const regNumber = ref(saved?.source === "registry" ? saved.regNumber : "");
const status = ref<"idle" | "loading" | "found" | "not_found">(saved?.source === "registry" ? "found" : "idle");
const result = ref<Business | null>(saved?.source === "registry" ? saved : null);
const manual = ref<Manual>(saved?.source === "manual" ? fromBusiness(saved) : { ...EMPTY_MANUAL });
const touched = ref(false);

let timer: number | undefined;
onBeforeUnmount(() => window.clearTimeout(timer));
function lookup(number: string, type = regType.value) {
  status.value = "loading";
  result.value = null;
  timer = window.setTimeout(() => {
    if (store.demo.lookup === "not_found") return (status.value = "not_found");
    result.value = registryBusiness(props.country, type || undefined, number);
    status.value = "found";
  }, 1200);
}

const manualComplete = computed(
  () => !!(manual.value.name.trim() && manual.value.incorporatedOn && manual.value.street.trim() && manual.value.city.trim() && manual.value.region)
);
const canContinue = computed(() => (mode.value === "lookup" ? status.value === "found" && !!result.value : manualComplete.value));

function onContinue() {
  if (mode.value === "manual") {
    touched.value = true;
    if (!manualComplete.value) return;
    store.set({ business: toBusiness(manual.value, regType.value, regNumber.value) });
  } else if (result.value) store.set({ business: result.value });
  router.push("/onboarding/business/profile");
}

const description = searchCountry
  ? `Enter your official company name or registration number. We’ll match your details with ${info.registry}.`
  : `Select your registration type and enter your number. We’ll pull your official records from the ${info.registry} registry.`;
const footer = computed(() => ({ primary: { label: "Continue", onClick: onContinue, disabled: !canContinue.value } }));

function onRegNumber(e: Event) {
  const el = e.target as HTMLInputElement;
  regNumber.value = el.value.replace(/[^0-9A-Za-z]/g, "");
  el.value = regNumber.value;
  if (status.value === "not_found") status.value = "idle";
}
function backToLookup() {
  mode.value = "lookup";
  status.value = "idle";
}
function pick(b: Business) {
  result.value = b;
  status.value = "found";
}
function clear() {
  result.value = null;
  status.value = "idle";
}
function onRegType(v: string) {
  regType.value = v;
  status.value = "idle";
}
</script>

<template>
  <OnboardingFrame step="business" back="/onboarding/identity" title="Find your business" :description="description" :footer="footer">
    <ManualEntry
      v-if="mode === 'manual'"
      v-model="manual"
      v-model:reg-type="regType"
      v-model:reg-number="regNumber"
      :country="country"
      :types="types"
      :touched="touched"
      @back="backToLookup"
    />
    <RegistrySearch v-else-if="searchCountry" :country="country" :result="result" @pick="pick" @clear="clear" @manual="mode = 'manual'" />
    <RegistryCard v-else-if="status === 'found' && result" :business="result" :registry="info.registry" @search-again="status = 'idle'" />
    <div v-else class="flex flex-col gap-6">
      <RegTypePicker :types="types" :model-value="regType" @update:model-value="onRegType" />
      <Field label="Registration number" html-for="reg-number" :hint="`Enter the number exactly as it appears on your ${info.registry} certificate.`">
        <div class="flex gap-2">
          <span class="grid h-12 min-w-12 shrink-0 place-items-center rounded-[16px] border border-line bg-subtle px-3 text-[14px] font-medium text-fg-2"
            >{{ regType }}-</span
          >
          <div class="relative min-w-0 flex-1">
            <input
              id="reg-number"
              inputmode="numeric"
              autocomplete="off"
              :value="regNumber"
              :aria-invalid="status === 'not_found' || undefined"
              aria-describedby="lookup-status"
              :class="cn(fieldCls, 'pr-28')"
              @input="onRegNumber"
              @keydown.enter="regNumber.length >= 4 && lookup(regNumber)"
            />
            <button
              type="button"
              :disabled="regNumber.length < 4 || status === 'loading'"
              :class="
                cn(
                  'absolute top-1/2 right-2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus',
                  status === 'loading'
                    ? 'bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]'
                    : 'bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)] disabled:bg-[var(--color-foren-bg-button-disabled)] disabled:text-fg-disabled'
                )
              "
              @click="lookup(regNumber)"
            >
              <template v-if="status === 'loading'">
                <ForenSpinner size="sm" class="text-current" />
                Looking up…
              </template>
              <template v-else>Verify</template>
            </button>
          </div>
        </div>
      </Field>
      <div id="lookup-status" aria-live="polite">
        <Note v-if="status === 'not_found'" intent="error" title="We couldn’t find a business with that number">
          Check the number on your certificate, or enter your details manually.
        </Note>
      </div>
      <ManualLink @click="mode = 'manual'" />
    </div>
  </OnboardingFrame>
</template>
