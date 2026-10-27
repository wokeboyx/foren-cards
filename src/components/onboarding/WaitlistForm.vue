<script setup lang="ts">
import { computed, ref } from "vue";
import { RiMailCheckLine } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import { useOnboardingStore } from "@/stores/onboarding";
import Field from "./Field.vue";
import { fieldCls } from "./frame";
import { EMAIL_RE } from "./welcome-requirements";

const props = defineProps<{ country: string; joined: string | null }>();
const store = useOnboardingStore();
const email = ref("");
const touched = ref(false);
const invalid = computed(() => touched.value && !EMAIL_RE.test(email.value.trim()));
const place = computed(() => (props.country === "Other country" ? "your country" : props.country));

function submit() {
  touched.value = true;
  if (EMAIL_RE.test(email.value.trim())) store.set({ waitlist: { country: props.country, email: email.value.trim() } });
}
</script>

<template>
  <div v-if="joined" role="status" class="flex flex-col items-start gap-3 rounded-[16px] bg-success-subtle p-4 animate-[rise-in_200ms_ease-out]">
    <span class="grid size-8 place-items-center rounded-full bg-surface text-success">
      <RiMailCheckLine class="size-4" aria-hidden="true" />
    </span>
    <div class="flex flex-col gap-1">
      <p class="text-[14px] leading-[21px] font-medium text-fg">You’re on the list</p>
      <p class="text-[12px] leading-[18px] font-medium text-fg-2">We’ll email {{ joined }} when Foren launches in {{ place }}.</p>
    </div>
  </div>
  <form v-else novalidate class="flex flex-col gap-4 animate-[rise-in_200ms_ease-out]" @submit.prevent="submit">
    <div class="flex flex-col gap-1">
      <p class="text-[14px] leading-[21px] font-medium text-fg">We’re not in {{ place }} yet</p>
      <p class="text-[12px] leading-[18px] font-medium text-fg-2">Join the waitlist and we’ll email you when we launch there.</p>
    </div>
    <Field label="Email" html-for="ob-wait-email" :error="invalid ? 'Enter a valid email, like name@company.com' : undefined">
      <input
        id="ob-wait-email"
        v-model="email"
        type="email"
        autocomplete="email"
        inputmode="email"
        placeholder="name@company.com"
        :aria-invalid="invalid || undefined"
        :class="fieldCls"
        @blur="email && (touched = true)"
      />
    </Field>
    <ForenButton type="submit" size="sm" variant="primary" class="w-fit" :disabled="!email.trim()">Join the waitlist</ForenButton>
  </form>
</template>
