<script setup lang="ts">
/** The card itself, with its details shown in place (Revolut "See details"). */
import { computed, ref } from "vue";
import { RiEyeLine, RiEyeOffLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import CardArt from "@/components/card/CardArt.vue";
import { lockText } from "@/components/card/status-badge";
import { nameOnCard } from "@/components/card/holder";
import type { Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app";
import { copyToClipboard } from "./card-detail";
import CardDetailRow from "./CardDetailRow.vue";
import WalletButtons from "./WalletButtons.vue";

const props = defineProps<{ card: Card }>();
const store = useAppStore();
const shown = ref(false);
const allowed = computed(() => can(store.role, "viewDetails", props.card) && props.card.status !== "canceled");
const locked = computed(() => (props.card.lockedMerchantId ? merchantById(props.card.lockedMerchantId) : undefined));
// Test number only: Visa test range.
const pan = computed(() => `4000 0012 3456 ${props.card.last4}`);
const expiry = computed(() => `${props.card.expiry.slice(5)}/${props.card.expiry.slice(2, 4)}`);
const holder = computed(() => nameOnCard(props.card) ?? "");

async function copy(label: string, value: string) {
  await copyToClipboard(value);
  toast(`${label} copied`);
}
</script>

<template>
  <section class="rounded-[20px] bg-surface p-5" aria-labelledby="card-details-title">
    <div class="flex justify-center">
      <CardArt
        :card="card"
        size="md"
        :holder-name="nameOnCard(card)"
        :merchant-name="locked?.name"
        :lock-text="lockText(card)"
        :class="cn((card.status === 'frozen' || card.status === 'canceled') && 'opacity-60 saturate-50')"
      />
    </div>
    <div class="mt-5 flex items-center justify-between gap-2">
      <h2 id="card-details-title" class="text-[16px] font-semibold text-fg">Card details</h2>
      <ForenButton v-if="allowed" size="xxs" :variant="shown ? 'secondary' : 'primary'" @click="shown = !shown">
        <template #leadingIcon><RiEyeOffLine v-if="shown" /><RiEyeLine v-else /></template>
        {{ shown ? "Hide details" : "Show details" }}
      </ForenButton>
    </div>
    <div v-if="allowed" class="mt-3 divide-y divide-line">
      <CardDetailRow label="Card number" :value="shown ? pan : `•••• •••• •••• ${card.last4}`" :copyable="shown" @copy="copy('Card number', pan)" />
      <CardDetailRow label="Expiry" :value="expiry" copyable @copy="copy('Expiry', expiry)" />
      <CardDetailRow label="Security code (CVC)" :value="shown ? '123' : '•••'" :copyable="shown" @copy="copy('Security code', '123')" />
      <CardDetailRow label="Name on card" :value="holder" copyable @copy="copy('Name', holder)" />
    </div>
    <p v-else class="mt-3 rounded-[14px] bg-canvas px-3.5 py-3 text-[13px] leading-[18px] text-fg-3">
      {{ card.status === "canceled" ? "Not available for canceled cards." : "Only the cardholder and account owner can see these." }}
    </p>
    <p v-if="allowed && shown" class="mt-2 text-[12px] text-fg-3">Test data</p>
    <div class="mt-4 empty:hidden">
      <WalletButtons :card="card" />
    </div>
  </section>
</template>
