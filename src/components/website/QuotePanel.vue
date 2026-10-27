<script setup lang="ts">
// Get a quote on WhatsApp: pick both currencies, say who you are, continue in WhatsApp with the request typed.
import { computed, onMounted, reactive, ref, useTemplateRef } from "vue";
import { RouterLink } from "vue-router";
import { RiArrowLeftLine, RiArrowRightLine, RiWhatsappLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import { PAY_IN, RECEIVE_IN, defaultDialIso, whatsappLink } from "./data";
import CurrencyPill from "./CurrencyPill.vue";
import FieldError from "./FieldError.vue";
import FieldLabel from "./FieldLabel.vue";
import Flag from "./Flag.vue";
import GlassCard from "./GlassCard.vue";
import Intro from "./Intro.vue";
import Panel from "./Panel.vue";
import PhoneField from "./PhoneField.vue";
import QuoteTextField from "./QuoteTextField.vue";
import StepList from "./StepList.vue";
import { ink, linkBtn, muted, primaryBtn, validPhone } from "./shared";

type Step = "route" | "details" | "sent";
const LIST_INDEX: Record<Step, number> = { route: 0, details: 1, sent: 3 };

const step = ref<Step>("route");
const from = ref("NGN");
const to = ref("USD");
const form = reactive({ first: "", last: "", company: "", dial: "ng", phone: "" });
const tried = ref(false);
const heading = useTemplateRef<HTMLHeadingElement>("heading");
// Browser-only default.
onMounted(() => (form.dial = defaultDialIso()));

function go(next: Step) {
  step.value = next;
  requestAnimationFrame(() => heading.value?.focus());
}
function pickFrom(v: string) {
  from.value = v;
  if (v === to.value) to.value = RECEIVE_IN.find((c) => c !== v)!;
}

const message = computed(() => `Hi Foren, I’m ${form.first.trim()} ${form.last.trim()} from ${form.company.trim()}. I’d like a quote for ${from.value}/${to.value}.`);
const missing = computed(() => ({ first: !form.first.trim(), last: !form.last.trim(), company: !form.company.trim(), phone: !validPhone(form.phone) }));

function submit() {
  tried.value = true;
  const m = missing.value;
  const first = (Object.keys(m) as (keyof typeof m)[]).find((k) => m[k]);
  if (first) return document.getElementById(`wa-${first}`)?.focus();
  window.open(whatsappLink(message.value), "_blank", "noopener");
  go("sent");
}
</script>

<template>
  <div class="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
    <Intro title="Get a quote on WhatsApp." description="Pick your currencies. Our team sends your rate on WhatsApp.">
      <StepList :steps="['Choose your currencies', 'Tell us who you are', 'Get your quote on WhatsApp']" :current="LIST_INDEX[step]" />
    </Intro>

    <GlassCard>
      <div v-if="step === 'route'" class="flex flex-col gap-4">
        <h3 ref="heading" tabindex="-1" class="sr-only">Choose your currencies</h3>
        <Panel class="flex items-center justify-between gap-4 py-3 pr-3 pl-5">
          <span :class="cn('text-[14px] font-medium', muted)">You pay</span>
          <CurrencyPill label="Currency you pay in" :model-value="from" :options="PAY_IN" @update:model-value="pickFrom" />
        </Panel>
        <Panel class="flex items-center justify-between gap-4 py-3 pr-3 pl-5">
          <span :class="cn('text-[14px] font-medium', muted)">Your supplier receives</span>
          <CurrencyPill v-model="to" label="Your supplier’s currency" :options="RECEIVE_IN.filter((c) => c !== from)" />
        </Panel>
        <Panel class="flex flex-col items-center px-6 py-8 text-center" aria-live="polite">
          <div class="flex -space-x-3">
            <Flag :code="from" :size="56" class="ring-4 ring-[#f3f3f3]" />
            <Flag :code="to" :size="56" class="ring-4 ring-[#f3f3f3]" />
          </div>
          <p :class="cn('mt-4 inline-flex items-center gap-2 text-[22px] font-semibold tracking-[-0.3px]', ink)">
            {{ from }} <RiArrowRightLine class="size-5 text-[#95908b]" aria-label="to" /> {{ to }}
          </p>
          <p :class="cn('mt-1 text-[14px]', muted)">You pay in {{ from }}. Your supplier gets {{ to }}.</p>
        </Panel>
        <button type="button" :class="cn(primaryBtn, 'mt-4 w-full')" @click="go('details')">Get a quote</button>
      </div>

      <form v-else-if="step === 'details'" novalidate @submit.prevent="submit">
        <Panel class="p-5 sm:p-6">
          <h3 ref="heading" tabindex="-1" :class="cn('text-[18px] font-semibold tracking-[-0.2px] outline-none', ink)">Who should we send the {{ from }}/{{ to }} quote to?</h3>
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <QuoteTextField id="wa-first" v-model="form.first" label="First name" autocomplete="given-name" :error="tried && missing.first" />
            <QuoteTextField id="wa-last" v-model="form.last" label="Last name" autocomplete="family-name" :error="tried && missing.last" />
            <QuoteTextField id="wa-company" v-model="form.company" class="sm:col-span-2" label="Company" autocomplete="organization" :error="tried && missing.company" />
            <div class="sm:col-span-2">
              <FieldLabel html-for="wa-phone">WhatsApp number</FieldLabel>
              <PhoneField id="wa-phone" v-model:dial="form.dial" v-model:number="form.phone" :invalid="tried && missing.phone" />
              <FieldError v-if="tried && missing.phone">Enter your WhatsApp number</FieldError>
            </div>
          </div>
        </Panel>
        <div class="mt-6 flex flex-wrap items-center justify-between gap-4 px-2">
          <button type="button" :class="cn('inline-flex items-center gap-1', linkBtn)" @click="go('route')">
            <RiArrowLeftLine class="size-4" aria-hidden="true" /> Back
          </button>
          <button type="submit" :class="primaryBtn"><RiWhatsappLine class="size-5" aria-hidden="true" /> Continue on WhatsApp</button>
        </div>
      </form>

      <div v-else>
        <Panel class="flex flex-col items-center px-6 py-10 text-center">
          <RiWhatsappLine class="size-10 text-[#1da851]" aria-hidden="true" />
          <h3 ref="heading" tabindex="-1" :class="cn('mt-4 text-[22px] font-semibold tracking-[-0.3px] outline-none', ink)">Check WhatsApp</h3>
          <p :class="cn('mt-2 max-w-[320px] text-[14px] leading-[21px]', muted)">Send the message and we’ll reply with your {{ from }}/{{ to }} quote.</p>
          <a :href="whatsappLink(message)" target="_blank" rel="noopener noreferrer" :class="cn('mt-3', linkBtn)">Didn’t open? Try again</a>
        </Panel>
        <div class="mt-6 flex flex-wrap items-center justify-end gap-6 px-2">
          <button type="button" :class="linkBtn" @click="go('route')">Start over</button>
          <RouterLink to="/onboarding" :class="primaryBtn">Open business account</RouterLink>
        </div>
      </div>
    </GlassCard>
  </div>
</template>
