<script setup lang="ts">
/** "Review your details" (Figma 3035:74859 / 75756): everything from sign-up, each section editable. */
import { computed, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { ENTITY_LABEL, USE_CASES, countryInfo } from "@/domain/onboarding";
import { useSignupGuard } from "@/composables/useSignupGuard";
import { useOnboardingStore } from "@/stores/onboarding";
import DetailGrid from "./DetailGrid.vue";
import Note from "./Note.vue";
import OnboardingFrame from "./OnboardingFrame.vue";
import ReviewSection from "./ReviewSection.vue";
import { formatDate } from "./shared";

const ready = useSignupGuard("/onboarding/review");
const router = useRouter();
const s = useOnboardingStore();
const submitting = ref(false);

const missingProfile = computed(() => ready.value && !s.profile);
const missingEdd = computed(
  () => ready.value && s.entity === "mto" && !s.edd_done,
);
watchEffect(() => {
  if (missingProfile.value) router.replace("/onboarding/business/profile");
  else if (missingEdd.value) router.replace("/onboarding/compliance");
});

const useFor = computed(() =>
  USE_CASES.filter((u) => s.useCases.includes(u.id))
    .map((u) => u.title)
    .join(", "),
);
const footer = computed(() => ({
  primary: {
    label: "Submit",
    loading: submitting.value,
    onClick: () => {
      submitting.value = true;
      window.setTimeout(() => {
        s.set({ signedUpAt: new Date().toISOString() });
        router.push("/onboarding/welcome");
      }, 700);
    },
  },
}));
</script>

<template>
  <OnboardingFrame
    v-if="
      ready && s.business && s.profile && s.country && s.entity && !missingEdd
    "
    :step="s.entity === 'mto' ? 'edd' : 'business'"
    completed
    :back="
      s.entity === 'mto'
        ? '/onboarding/compliance'
        : '/onboarding/business/profile'
    "
    title="Review your details"
    description="Review your business and account information before submitting. If something is wrong, go back and fix it."
    :footer="footer"
  >
    <div class="flex flex-col gap-3">
      <ReviewSection title="Business and entity" edit="/onboarding">
        <DetailGrid
          :items="[
            { label: 'Country', value: countryInfo(s.country)?.name },
            { label: 'Entity type', value: ENTITY_LABEL[s.entity] },
            { label: 'Type', value: s.business.companyType },
            {
              label: 'Incorporated',
              value: formatDate(s.business.incorporatedOn),
            },
            { label: 'Address', value: s.business.address, wide: true },
          ]"
        />
      </ReviewSection>
      <ReviewSection title="Business" edit="/onboarding/business">
        <DetailGrid
          :items="[
            { label: 'Registered name', value: s.business.name },
            {
              label: 'Reg. number',
              value: [s.business.regType, s.business.regNumber]
                .filter(Boolean)
                .join('-'),
            },
            { label: 'Using Foren for', value: useFor, wide: true },
          ]"
        />
      </ReviewSection>
      <ReviewSection title="Profile" edit="/onboarding/business/profile">
        <DetailGrid
          :items="[
            {
              label: 'Annual turnover',
              value: `${countryInfo(s.country)?.currency} ${s.profile.turnover}`,
            },
            {
              label: 'Sector',
              value: `${s.profile.sector} · ${s.profile.category}`,
            },
            { label: 'Website', value: s.profile.website },
            {
              label: 'Trading',
              value: s.profile.notTrading ? 'Not trading yet' : 'Trading',
            },
          ]"
        />
      </ReviewSection>
      <ReviewSection title="Primary contact" edit="/onboarding/account">
        <DetailGrid
          :items="[
            { label: 'First name', value: s.firstName },
            { label: 'Last name', value: s.lastName },
            { label: 'Job title', value: s.position },
            { label: 'Phone number', value: s.phone },
            { label: 'Email address', value: s.email, wide: true },
          ]"
        />
      </ReviewSection>
      <ReviewSection
        v-if="s.entity === 'mto'"
        title="Enhanced due diligence"
        edit="/onboarding/compliance"
      >
        <DetailGrid :items="[{ label: 'Questionnaire', value: 'Completed' }]" />
      </ReviewSection>
      <Note intent="info"
        >Check everything is right before you submit. You can update business
        details later in Settings.</Note
      >
    </div>
  </OnboardingFrame>
</template>
