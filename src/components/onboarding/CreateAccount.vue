<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { RiCheckLine, RiCloseLine, RiEyeLine, RiEyeOffLine } from "@/components/icons";
import { DIAL_CODE } from "@/domain/onboarding";
import { useSignupGuard } from "@/composables/useSignupGuard";
import { useOnboardingStore } from "@/stores/onboarding";
import { cn } from "@/lib/utils";
import Field from "./Field.vue";
import FormCard from "./FormCard.vue";
import OnboardingFrame from "./OnboardingFrame.vue";
import { fieldCls } from "./frame";
import { EMAIL_RE } from "./welcome-requirements";

const CRITERIA: [string, (p: string) => boolean][] = [
  ["Minimum 8 characters", (p) => p.length >= 8],
  ["Uppercase", (p) => /[A-Z]/.test(p)],
  ["Lowercase", (p) => /[a-z]/.test(p)],
  ["Number", (p) => /\d/.test(p)],
  ["Special character", (p) => /[^A-Za-z0-9]/.test(p)],
];

const STRENGTH = ["Weak", "Weak", "Weak", "Fair", "Good", "Strong"];

const router = useRouter();
const ok = useSignupGuard("/onboarding/account");
const store = useOnboardingStore();
const email = ref(store.email);
const firstName = ref(store.firstName);
const lastName = ref(store.lastName);
const dial = computed(() => (store.country ? DIAL_CODE[store.country] : "+"));
const position = ref(store.position);
// Stored with the dialling code ("+234 803 555 0142"); edited without it.
const phone = ref(store.phone.replace(/^\+\d+\s*/, ""));
const phoneTouched = ref(false);
const password = ref("");
const show = ref(false);
const emailTouched = ref(false);
const pwRef = useTemplateRef<HTMLInputElement>("pw");

const met = computed(() => CRITERIA.map(([, test]) => test(password.value)));
const score = computed(() => met.value.filter(Boolean).length); // 0–5
const segments = computed(() => (password.value ? Math.max(1, score.value - 1) : 0));
const strong = computed(() => met.value.every(Boolean));
const emailOk = computed(() => EMAIL_RE.test(email.value.trim()));
const emailError = computed(() => (emailTouched.value && email.value && !emailOk.value ? "Enter a valid email, like name@company.com" : undefined));
const digits = computed(() => phone.value.replace(/\D/g, ""));
const phoneOk = computed(() => digits.value.length >= 7 && digits.value.length <= 12);
const phoneError = computed(() => (phoneTouched.value && phone.value && !phoneOk.value ? "Enter a valid phone number" : undefined));
const valid = computed(
  () => emailOk.value && !!firstName.value.trim() && !!lastName.value.trim() && !!position.value.trim() && phoneOk.value && strong.value
);

function submit() {
  store.set({
    email: email.value.trim(),
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    position: position.value.trim(),
    phone: `${dial.value} ${phone.value.trim().replace(/^0/, "")}`,
    emailVerified: false,
  });
  router.push("/onboarding/verify-email");
}
const onPhone = (e: Event) => {
  const el = e.target as HTMLInputElement;
  phone.value = el.value.replace(/[^\d\s]/g, "");
  el.value = phone.value;
};
function clearPassword() {
  password.value = "";
  pwRef.value?.focus();
}
const footer = computed(() => ({ primary: { label: "Continue", disabled: !valid.value, onClick: submit } }));
</script>

<template>
  <OnboardingFrame
    v-if="ok"
    step="account"
    back="/onboarding/use"
    title="Create your account"
    description="This is what you’ll use to log in and manage your business account."
    :footer="footer"
  >
    <form novalidate @submit.prevent="valid && submit()">
      <FormCard>
        <Field label="Email" html-for="ob-email" :error="emailError">
          <input
            id="ob-email"
            v-model="email"
            type="email"
            autocomplete="email"
            inputmode="email"
            placeholder="Enter a valid email address"
            :aria-invalid="!!emailError || undefined"
            :class="fieldCls"
            @blur="emailTouched = true"
          />
        </Field>
        <div class="grid gap-8 sm:grid-cols-2 sm:gap-4">
          <Field label="First name" html-for="ob-first">
            <input id="ob-first" v-model="firstName" autocomplete="given-name" :class="fieldCls" />
          </Field>
          <Field label="Last name" html-for="ob-last">
            <input id="ob-last" v-model="lastName" autocomplete="family-name" :class="fieldCls" />
          </Field>
        </div>
        <div class="grid gap-8 sm:grid-cols-2 sm:gap-4">
          <Field label="Job title" html-for="ob-position" hint="You’re the authorised representative on the declaration.">
            <input id="ob-position" v-model="position" autocomplete="organization-title" placeholder="e.g. Finance Director" :class="fieldCls" />
          </Field>
          <Field label="Phone number" html-for="ob-phone" :error="phoneError">
            <div class="relative">
              <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[14px] font-medium text-fg-2">{{ dial }}</span>
              <input
                id="ob-phone"
                type="tel"
                inputmode="tel"
                autocomplete="tel-national"
                :value="phone"
                :aria-invalid="!!phoneError || undefined"
                :class="cn(fieldCls, 'pl-14')"
                @input="onPhone"
                @blur="phoneTouched = true"
              />
            </div>
          </Field>
        </div>
        <Field label="Password" html-for="ob-password">
          <div class="relative">
            <input
              id="ob-password"
              ref="pw"
              v-model="password"
              :type="show ? 'text' : 'password'"
              autocomplete="new-password"
              aria-describedby="ob-password-rules"
              :class="cn(fieldCls, 'pr-20', !show && password && 'text-[20px] tracking-[0.15em]')"
            />
            <div class="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
              <button
                type="button"
                :aria-label="show ? 'Hide password' : 'Show password'"
                :aria-pressed="show"
                class="grid size-8 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
                @click="show = !show"
              >
                <RiEyeLine v-if="show" class="size-[18px]" aria-hidden="true" />
                <RiEyeOffLine v-else class="size-[18px]" aria-hidden="true" />
              </button>
              <button
                v-if="password"
                type="button"
                aria-label="Clear password"
                class="grid size-8 place-items-center rounded-full text-fg outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
                @click="clearPassword"
              >
                <RiCloseLine class="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div v-if="password" class="flex items-center gap-1 px-1" aria-hidden="true">
            <span
              v-for="i in [0, 1, 2, 3]"
              :key="i"
              :class="cn('h-1 flex-1 rounded-[4px] transition-colors', i < segments ? (strong ? 'bg-[#4c9a4e]' : score >= 3 ? 'bg-warning' : 'bg-error') : 'bg-line')"
            />
            <span class="w-14 text-right text-[12px] leading-[18px] font-medium text-fg-2">{{ STRENGTH[score] }}</span>
          </div>
          <ul id="ob-password-rules" class="flex flex-wrap gap-2" aria-label="Password rules">
            <li
              v-for="([label], i) in CRITERIA"
              :key="label"
              class="inline-flex h-5 items-center gap-1.5 rounded-full bg-[var(--color-foren-bg-button-secondary)] pr-2 pl-1.5 text-[12px] leading-[18px] font-medium text-fg-2"
            >
              <RiCheckLine v-if="met[i]" class="size-3 text-success" aria-hidden="true" />
              <span v-else class="size-3" aria-hidden="true" />
              {{ label }}
              <span class="sr-only">{{ met[i] ? " (met)" : " (not met)" }}</span>
            </li>
          </ul>
          <p class="sr-only" aria-live="polite">{{ password ? `Password strength: ${STRENGTH[score]}` : "" }}</p>
        </Field>
      </FormCard>
    </form>
  </OnboardingFrame>
</template>
