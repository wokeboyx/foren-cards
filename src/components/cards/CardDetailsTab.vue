<script setup lang="ts">
/** Every detail of the card in one place (Global account "Account details" pattern): label over value, a copy button per row, and "Copy all details". */
import { computed, onBeforeUnmount, ref } from "vue";
import { RiEyeLine, RiEyeOffLine, RiFileCopyLine } from "@/components/icons";
import { toast } from "vue-sonner";
import TransactionPinDialog from "@/components/TransactionPinDialog.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { nameOnCard } from "@/components/card/holder";
import type { Card } from "@/domain/types";
import { can } from "@/lib/permissions";
import { personById, useAppStore } from "@/stores/app";
import { copyToClipboard } from "./card-detail";

const props = defineProps<{ card: Card }>();

const store = useAppStore();
/** The number and security code stay hidden until the transaction PIN is entered, and hide again after this long. */
const REVEAL_SECONDS = 45;
const shown = ref(false);
const pinOpen = ref(false);
const left = ref(0);
/** Runs once the details are showing (e.g. "Copy all details" asked for the PIN). */
let afterReveal: (() => void) | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
function hide() {
  shown.value = false;
  clearInterval(timer);
}
function reveal(): Promise<boolean> {
  shown.value = true;
  left.value = REVEAL_SECONDS;
  clearInterval(timer);
  timer = setInterval(() => {
    left.value -= 1;
    if (left.value <= 0) hide();
  }, 1000);
  pinOpen.value = false;
  afterReveal?.();
  afterReveal = null;
  return Promise.resolve(true);
}
function toggle() {
  if (shown.value) hide();
  else pinOpen.value = true;
}
onBeforeUnmount(() => clearInterval(timer));
const allowed = computed(
  () =>
    can(store.role, "viewDetails", props.card) &&
    props.card.status !== "canceled",
);
// Test number only: Visa test range.
const pan = computed(() => `4000 0012 3456 ${props.card.last4}`);
const expiry = computed(
  () => `${props.card.expiry.slice(5)}/${props.card.expiry.slice(2, 4)}`,
);
const holder = computed(() => nameOnCard(props.card) ?? "");
const billing = computed(
  () =>
    `${props.card.billingAddress.line1}, ${props.card.billingAddress.city} ${props.card.billingAddress.postcode}, ${props.card.billingAddress.country}`,
);
const created = computed(() =>
  new Date(props.card.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }),
);

type Row = { label: string; value: string; copy?: string; sensitive?: boolean };
const rows = computed<Row[]>(() => [
  ...(allowed.value
    ? [
        {
          label: "Card number",
          value: shown.value ? pan.value : `•••• •••• •••• ${props.card.last4}`,
          copy: shown.value ? pan.value : undefined,
          sensitive: true,
        },
        { label: "Expiry", value: expiry.value, copy: expiry.value },
        {
          label: "Security code (CVC)",
          value: shown.value ? "123" : "•••",
          copy: shown.value ? "123" : undefined,
          sensitive: true,
        },
        { label: "Name on card", value: holder.value, copy: holder.value },
      ]
    : [{ label: "Expiry", value: expiry.value }]),
  { label: "Created", value: created.value },
  { label: "Billing address", value: billing.value, copy: billing.value },
]);

async function copy(label: string, value: string) {
  await copyToClipboard(value);
  toast(`${label} copied`);
}
async function copyAll() {
  if (!shown.value) {
    // The whole number goes on the clipboard, so ask for the PIN first
    afterReveal = () => void copyAll();
    pinOpen.value = true;
    return;
  }
  const lines = [
    `Cardholder: ${personById(props.card.holderId)?.name ?? ""}`,
    `Card number: ${pan.value}`,
    `Expiry: ${expiry.value}`,
    "Security code: 123",
    `Name on card: ${holder.value}`,
    `Billing address: ${billing.value}`,
  ];
  await copyToClipboard(lines.join("\n"));
  toast("Card details copied");
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-[16px] font-semibold text-fg">Card details</h3>
      <ForenButton
        v-if="allowed"
        size="xxs"
        :variant="shown ? 'secondary' : 'primary'"
        @click="toggle"
      >
        <template #leadingIcon
          ><RiEyeOffLine v-if="shown" /><RiEyeLine v-else
        /></template>
        {{ shown ? "Hide details" : "Show details" }}
      </ForenButton>
    </div>

    <ul class="mt-2 divide-y divide-line">
      <li
        v-for="r in rows"
        :key="r.label"
        class="flex items-center justify-between gap-4 py-3.5"
      >
        <span class="shrink-0 text-[14px] text-fg-2">{{ r.label }}</span>
        <span class="flex min-w-0 items-center gap-1">
          <span
            class="tnum min-w-0 truncate text-right text-[14px] font-medium text-fg"
            >{{ r.value }}</span
          >
          <button
            v-if="r.copy"
            type="button"
            :aria-label="`Copy ${r.label.toLowerCase()}`"
            class="grid size-8 shrink-0 place-items-center rounded-full text-fg-3 hover:text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
            @click="copy(r.label, r.copy!)"
          >
            <RiFileCopyLine class="size-4" aria-hidden="true" />
          </button>
          <span v-else class="size-8 shrink-0" aria-hidden="true" />
        </span>
      </li>
    </ul>

    <p
      v-if="!allowed"
      class="mt-2 rounded-[14px] bg-canvas px-3.5 py-3 text-[13px] leading-[18px] text-fg-3"
    >
      {{
        card.status === "canceled"
          ? "Number and security code aren’t available for terminated cards."
          : "Only the cardholder and account owner can see the number and security code."
      }}
    </p>
    <div v-if="allowed" class="mt-4 flex justify-center">
      <ForenButton variant="secondary" size="sm" @click="copyAll">
        Copy all details
        <template #trailingIcon><RiFileCopyLine /></template>
      </ForenButton>
    </div>
    <p
      v-if="allowed && shown"
      class="tnum mt-2 text-center text-[12px] text-fg-3"
      data-testid="reveal-countdown"
    >
      Test data · hides in {{ left }}s
    </p>
    <TransactionPinDialog
      v-model:open="pinOpen"
      action="Show details"
      busy-label="Checking…"
      :description="`Enter your 6-digit transaction PIN to show the card number and security code. They hide again after ${REVEAL_SECONDS} seconds.`"
      failure-text="We couldn’t show the details. Try again."
      :on-confirm="reveal"
    />
  </div>
</template>
