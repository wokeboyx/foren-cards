<script setup lang="ts">
/**
 * Try Payment Links before signing up. A short version of the in-app flow (Business Banking Figma 4504:121971):
 * the details, then the customer's checkout as on "Review payment link", then open an account to make it live.
 */
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { RiLockLine, RiShoppingBag3Line } from "@/components/icons";
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding";
import { CURRENCIES, formatAmount } from "./data";
import CurrencyPill from "./CurrencyPill.vue";
import FieldError from "./FieldError.vue";
import FieldLabel from "./FieldLabel.vue";
import Flag from "./Flag.vue";
import GlassCard from "./GlassCard.vue";
import ImagePick from "./ImagePick.vue";
import Intro from "./Intro.vue";
import LinkField from "./LinkField.vue";
import Panel from "./Panel.vue";
import StepList from "./StepList.vue";
import { ink, muted, primaryBtn, secondaryBtn } from "./shared";

const LINK_CURRENCIES = ["NGN", "USD", "GBP", "EUR", "CAD"];
/** Link types, worded as in the in-app flow ("How will this link be used"). */
const LINK_TYPES = [
  {
    id: "single",
    title: "Single-use link",
    description: "Valid for one transaction only; the link expires after use.",
  },
  {
    id: "reusable",
    title: "Reusable link",
    description:
      "For multiple transactions. Any number of customers can use it.",
  },
] as const;

type View = "details" | "preview";

/** Sample branding until the business adds its own. */
const SAMPLE_LOGO = asset("/foren-logo.svg");
const SAMPLE_COVER = asset("/website/foren-cover.webp");

const router = useRouter();
const ob = useOnboardingStore();
const view = ref<View>("details");
const business = ref("");
const title = ref("");
const amount = ref("");
const currency = ref("NGN");
const logo = ref<string | null>(null);
const cover = ref<string | null>(null);
const linkType = ref<(typeof LINK_TYPES)[number]["id"]>("single");
const tried = ref(false);

// Uploaded images stay in the browser as object URLs; free them when replaced.
watch(logo, (_n, old) => old && URL.revokeObjectURL(old));
watch(cover, (_n, old) => old && URL.revokeObjectURL(old));

const value = computed(() => Number(amount.value.replace(/,/g, "")) || 0);
const missing = computed(() => ({
  business: !business.value.trim(),
  title: !title.value.trim(),
  amount: value.value <= 0,
}));
const c = computed(() => CURRENCIES[currency.value]);
const ready = computed(
  () =>
    !missing.value.business && !missing.value.title && !missing.value.amount,
);

/** Show the first missing field; true when everything is filled in. */
function check() {
  tried.value = true;
  const m = missing.value;
  const first = (Object.keys(m) as (keyof typeof m)[]).find((k) => m[k]);
  if (!first) return true;
  view.value = "details";
  requestAnimationFrame(() => document.getElementById(`pl-${first}`)?.focus());
  return false;
}
// Creating the link means opening an account: sign-up starts with Payment Links already picked.
function create() {
  if (!check()) return;
  ob.set({
    useCases: ob.useCases.includes("payment_links")
      ? ob.useCases
      : [...ob.useCases, "payment_links"],
  });
  router.push("/onboarding");
}

function onAmount(e: Event) {
  const el = e.target as HTMLInputElement;
  el.value = el.value.replace(/[^\d.,]/g, "");
  amount.value = el.value;
}
function onAmountBlur() {
  if (value.value)
    amount.value = value.value.toLocaleString("en-GB", {
      maximumFractionDigits: 2,
    });
}
</script>

<template>
  <div class="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
    <Intro
      title="Get paid with a link."
      description="Share a link and get paid in minutes. No code, no website needed."
    >
      <StepList
        :steps="[
          'Add the payment details',
          'Preview your customer’s checkout',
          'Create your link',
        ]"
        :current="view === 'preview' && ready ? 1 : 0"
      />
    </Intro>

    <GlassCard>
      <div
        role="tablist"
        aria-label="Payment link"
        class="mb-4 grid grid-cols-2 gap-1 rounded-full bg-white/70 p-1"
      >
        <button
          v-for="v in ['details', 'preview'] as const"
          :key="v"
          role="tab"
          :id="`pl-tab-${v}`"
          :aria-selected="view === v"
          :aria-controls="`pl-panel-${v}`"
          :class="
            cn(
              'h-10 rounded-full text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30',
              view === v
                ? 'bg-white text-[#2f2d2b] shadow-[0_1px_3px_rgba(23,18,13,0.12)]'
                : 'text-[#6b6661] hover:text-[#2f2d2b]',
            )
          "
          @click="view = v"
        >
          {{ v === "details" ? "Details" : "Preview" }}
        </button>
      </div>

      <div
        v-if="view === 'details'"
        role="tabpanel"
        id="pl-panel-details"
        aria-labelledby="pl-tab-details"
      >
        <Panel class="flex flex-col gap-4 p-5 sm:p-6">
          <div class="grid grid-cols-2 gap-3">
            <ImagePick
              id="pl-logo"
              v-model="logo"
              label="Logo"
              hint="Square, PNG or JPG"
              shape="logo"
            />
            <ImagePick
              id="pl-cover"
              v-model="cover"
              label="Cover image"
              hint="Wide, PNG or JPG"
              shape="cover"
            />
          </div>
          <LinkField
            id="pl-business"
            v-model="business"
            label="Company name"
            placeholder="Kola Logistics"
            :error="
              tried && missing.business ? 'Enter your company name' : undefined
            "
          />
          <LinkField
            id="pl-title"
            v-model="title"
            label="Payment title"
            placeholder="Consultation fee"
            :error="
              tried && missing.title
                ? 'Enter what the payment is for'
                : undefined
            "
          />
          <div>
            <FieldLabel html-for="pl-amount">Amount</FieldLabel>
            <div
              :class="
                cn(
                  'flex items-center gap-2 rounded-[16px] border bg-white py-1.5 pr-1.5 pl-4 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#2f2d2b]/15',
                  tried && missing.amount
                    ? 'border-[#d92d20]'
                    : 'border-[#e6e4e2] has-[input:focus-visible]:border-[#2f2d2b]',
                )
              "
            >
              <span :class="cn('text-[15px] font-medium', muted)">{{
                c.symbol
              }}</span>
              <input
                id="pl-amount"
                inputmode="decimal"
                placeholder="50,000"
                :value="amount"
                :aria-invalid="tried && missing.amount"
                :class="
                  cn(
                    'h-9 min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#b5b0ab]',
                    ink,
                  )
                "
                @input="onAmount"
                @blur="onAmountBlur"
              />
              <CurrencyPill
                v-model="currency"
                label="Currency"
                :options="LINK_CURRENCIES"
              />
            </div>
            <FieldError v-if="tried && missing.amount"
              >Enter an amount</FieldError
            >
          </div>
          <fieldset>
            <legend :class="cn('mb-2 text-[14px] font-medium', ink)">
              How will this link be used?
            </legend>
            <div class="flex flex-col gap-2">
              <label
                v-for="t in LINK_TYPES"
                :key="t.id"
                :class="
                  cn(
                    'flex cursor-pointer items-start gap-3 rounded-[16px] border bg-white p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/30',
                    linkType === t.id
                      ? 'border-[#2f2d2b]'
                      : 'border-[#e6e4e2] hover:border-[#b5b0ab]',
                  )
                "
              >
                <span class="min-w-0 flex-1">
                  <span :class="cn('block text-[14px] font-semibold', ink)">{{
                    t.title
                  }}</span>
                  <span
                    :class="
                      cn('mt-0.5 block text-[13px] leading-[19px]', muted)
                    "
                    >{{ t.description }}</span
                  >
                </span>
                <input
                  v-model="linkType"
                  type="radio"
                  name="pl-type"
                  :value="t.id"
                  class="mt-0.5 size-4 shrink-0 accent-[#1e1711]"
                />
              </label>
            </div>
          </fieldset>
        </Panel>
        <button
          type="button"
          :class="cn(primaryBtn, 'mt-4 w-full')"
          @click="create"
        >
          Create link
        </button>
        <p :class="cn('mt-3 text-center text-[13px]', muted)">
          You’ll open a Foren account to start getting paid.
        </p>
      </div>

      <div
        v-else
        role="tabpanel"
        id="pl-panel-preview"
        aria-labelledby="pl-tab-preview"
      >
        <Panel
          v-if="!ready"
          class="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center"
        >
          <span
            class="grid size-14 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(23,18,13,0.08)]"
          >
            <RiShoppingBag3Line
              class="size-6 text-[#95908b]"
              aria-hidden="true"
            />
          </span>
          <p
            :class="cn('mt-5 text-[18px] font-semibold tracking-[-0.2px]', ink)"
          >
            Your checkout appears here
          </p>
          <p
            :class="
              cn('mt-1.5 max-w-[300px] text-[14px] leading-[21px]', muted)
            "
          >
            Add your company name, a payment title and an amount to see what
            customers will see.
          </p>
          <button
            type="button"
            :class="cn(secondaryBtn, 'mt-6 h-10 px-5')"
            @click="view = 'details'"
          >
            Add details
          </button>
        </Panel>
        <template v-else>
          <!-- The customer's checkout, branded for the business. Nothing in it is clickable. -->
          <div
            class="pointer-events-none overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_-20px_rgba(23,18,13,0.3)] select-none"
            aria-label="Checkout preview"
          >
            <div class="relative h-40 bg-[#17120d]">
              <img
                :src="cover ?? SAMPLE_COVER"
                alt=""
                class="size-full object-cover"
              />
              <span
                class="absolute -bottom-6 left-5 grid size-14 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-white"
              >
                <img
                  :src="logo ?? SAMPLE_LOGO"
                  alt=""
                  :class="
                    cn(
                      'size-full',
                      logo ? 'object-cover' : 'object-contain p-3.5',
                    )
                  "
                />
              </span>
            </div>
            <div class="px-5 pt-9 pb-5 sm:px-6">
              <p :class="cn('text-[13px] font-medium', muted)">
                {{ business.trim() }}
              </p>
              <p
                :class="
                  cn('mt-0.5 text-[18px] font-semibold tracking-[-0.2px]', ink)
                "
              >
                {{ title.trim() }}
              </p>
              <div
                class="mt-4 flex items-center justify-between rounded-[20px] bg-[#f6f5f2] px-4 py-3"
              >
                <div>
                  <p :class="cn('text-[12px]', muted)">Amount due</p>
                  <p
                    :class="
                      cn(
                        'text-[28px] leading-[36px] font-semibold tracking-[-0.5px]',
                        ink,
                      )
                    "
                  >
                    {{ c.symbol }}{{ formatAmount(value) }}
                  </p>
                </div>
                <span
                  :class="
                    cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-full bg-white pr-3 pl-1.5 text-[13px] font-semibold',
                      ink,
                    )
                  "
                >
                  <Flag :code="currency" :size="20" /> {{ currency }}
                </span>
              </div>
              <div
                class="mt-4 flex h-11 items-center justify-center rounded-full bg-[#ebe9e5] text-[14px] font-semibold text-[#95908b]"
                aria-hidden="true"
              >
                Pay {{ c.symbol }}{{ formatAmount(value) }}
              </div>
              <p
                :class="
                  cn(
                    'mt-3 flex items-center justify-center gap-1 text-[12px]',
                    muted,
                  )
                "
              >
                <RiLockLine class="size-3.5" aria-hidden="true" /> Secured by
                Foren
              </p>
            </div>
          </div>

          <button
            type="button"
            :class="cn(primaryBtn, 'mt-4 w-full')"
            @click="create"
          >
            Create link
          </button>
          <p :class="cn('mt-3 text-center text-[13px]', muted)">
            You’ll open a Foren account to start getting paid.
          </p>
        </template>
      </div>
    </GlassCard>
  </div>
</template>
