<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { RiCheckLine, RiErrorWarningLine } from "@/components/icons";
import {
  ENTITY_HINT,
  ENTITY_LABEL,
  ONBOARDING_COUNTRIES,
  WAITLIST_COUNTRIES,
  countryInfo,
  type CountryCode,
  type EntityType,
} from "@/domain/onboarding";
import { useOnboardingStore } from "@/stores/onboarding";
import { cn } from "@/lib/utils";
import Field from "./Field.vue";
import FormCard from "./FormCard.vue";
import OnboardingFrame from "./OnboardingFrame.vue";
import RequirementsDocuments from "./RequirementsDocuments.vue";
import WaitlistForm from "./WaitlistForm.vue";
import WhyWeNeedThisModal from "./WhyWeNeedThisModal.vue";
import { fieldCls } from "./frame";

const FLAG: Record<CountryCode, string> = {
  NG: "🇳🇬",
  GB: "🇬🇧",
  CA: "🇨🇦",
  KE: "🇰🇪",
};
const WAIT_PREFIX = "wait:";

/** What each entity type can do once verified. */
function capabilities(entity: EntityType): string[] {
  if (entity === "mto")
    return [
      "Pay out to your customers in many currencies",
      "Hold NGN, USD, GBP, CAD and more",
      "Collect and settle through our API",
    ];
  return [
    "Send and receive domestically and internationally",
    "Hold NGN, USD, GBP, CAD and more",
    entity === "company"
      ? "Collect and settle in multiple currencies"
      : "Collect and pay in multiple currencies",
  ];
}

const router = useRouter();
const store = useOnboardingStore();
// A waitlist country isn't stored as `country` (we can't onboard it); keep the pick locally.
const waitCountry = ref<string | null>(null);
const whyOpen = ref(false);
const expanded = ref(false);

const info = computed(() => countryInfo(store.country));
const allowed = computed(() => info.value?.entities ?? []);
const validEntity = computed(() =>
  store.entity && allowed.value.includes(store.entity) ? store.entity : null,
);
const ready = computed(
  () => !waitCountry.value && !!info.value && !!validEntity.value,
);

const selectValue = computed(() =>
  waitCountry.value ? WAIT_PREFIX + waitCountry.value : (store.country ?? ""),
);
function onCountry(v: string) {
  if (v.startsWith(WAIT_PREFIX)) {
    waitCountry.value = v.slice(WAIT_PREFIX.length);
    store.set({ country: null });
    return;
  }
  waitCountry.value = null;
  const next = v as CountryCode;
  const nextAllowed = countryInfo(next)?.entities ?? [];
  store.set({
    country: next,
    entity:
      store.entity && nextAllowed.includes(store.entity) ? store.entity : null,
  });
  expanded.value = false;
}
function onEntity(v: string) {
  store.set({ entity: v as EntityType });
  expanded.value = false;
}
const entityHint = computed(() =>
  validEntity.value
    ? ENTITY_HINT[validEntity.value]
    : store.country === "KE"
      ? "In Kenya we can onboard companies and licensed MTOs/PSPs for now."
      : undefined,
);
const footer = computed(() => ({
  primary: {
    label: "Continue",
    disabled: !ready.value,
    onClick: () => router.push("/onboarding/use"),
  },
}));
</script>

<template>
  <OnboardingFrame
    step="welcome"
    title="Let’s get your business set up"
    description="Answer two quick questions and we’ll show you exactly what to prepare. No surprises later."
    :footer="footer"
  >
    <div class="overflow-hidden rounded-[24px] bg-subtle">
      <FormCard class="gap-8">
        <Field
          label="Country of incorporation or residence"
          description="This decides which documents and IDs we’ll ask for."
          html-for="ob-country"
        >
          <div>
            <select
              id="ob-country"
              :value="selectValue"
              :class="cn(fieldCls, !selectValue && 'text-fg-3')"
              @change="onCountry(($event.target as HTMLSelectElement).value)"
            >
              <option value="" disabled>Select your country</option>
              <option
                v-for="c in ONBOARDING_COUNTRIES"
                :key="c.code"
                :value="c.code"
              >
                {{ FLAG[c.code] }} {{ c.name }}
              </option>
              <optgroup label="Coming soon">
                <option
                  v-for="c in WAITLIST_COUNTRIES"
                  :key="c"
                  :value="WAIT_PREFIX + c"
                >
                  {{ c }}
                </option>
              </optgroup>
            </select>
          </div>
        </Field>

        <WaitlistForm
          v-if="waitCountry"
          :country="waitCountry"
          :joined="
            store.waitlist?.country === waitCountry
              ? store.waitlist.email
              : null
          "
        />
        <Field
          v-else
          label="Entity type"
          description="This decides your account limits and what you can use."
          html-for="ob-entity"
          :hint="entityHint"
        >
          <select
            id="ob-entity"
            :value="validEntity ?? ''"
            :disabled="!info"
            :class="cn(fieldCls, !validEntity && 'text-fg-3')"
            @change="onEntity(($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Select your entity type</option>
            <option v-for="e in allowed" :key="e" :value="e">
              {{ ENTITY_LABEL[e] }}
            </option>
          </select>
        </Field>

        <div
          v-if="ready && validEntity && info"
          class="flex flex-col gap-3 animate-[rise-in_200ms_ease-out]"
        >
          <p class="text-[12px] leading-[18px] font-medium text-fg-2">
            As a
            <span class="text-fg">{{
              validEntity === "mto"
                ? "licensed MTO or PSP"
                : ENTITY_LABEL[validEntity].toLowerCase()
            }}</span>
            in <span class="text-fg">{{ info.name }}</span> you can
          </p>
          <ul class="flex flex-col gap-3">
            <li
              v-for="c in capabilities(validEntity)"
              :key="c"
              class="flex items-center gap-2 text-[12px] leading-[18px] font-medium text-fg"
            >
              <RiCheckLine
                class="size-4 shrink-0 text-success"
                aria-hidden="true"
              />
              {{ c }}
            </li>
            <li
              v-if="validEntity !== 'sole_trader'"
              class="flex items-center gap-2 text-[12px] leading-[18px] font-medium text-warning"
            >
              <RiErrorWarningLine class="size-4 shrink-0" aria-hidden="true" />
              You’ll need to add directors and beneficial owners
            </li>
          </ul>
        </div>
      </FormCard>

      <RequirementsDocuments
        v-if="ready && validEntity && info"
        :country="info.code"
        :entity="validEntity"
        :expanded="expanded"
        @toggle="expanded = !expanded"
        @why="whyOpen = true"
      />
    </div>

    <WhyWeNeedThisModal
      v-if="ready && validEntity && info"
      v-model:open="whyOpen"
      :subtitle="`${ENTITY_LABEL[validEntity]} in ${info.name}`"
    />
  </OnboardingFrame>
</template>
