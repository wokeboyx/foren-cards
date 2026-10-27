<script setup lang="ts">
/**
 * Add a card to Apple Pay / Google Pay. Businesses mostly work on desktop, so the modal shows the
 * card's front and back for the phone's Wallet camera to scan. On a phone it adds the card directly.
 * Simulated: real provisioning depends on the card processor.
 */
import { computed } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { RiAppleFill, RiGoogleFill } from "@remixicon/vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import Modal from "@/components/Modal.vue";
import { useAction } from "@/composables/useAction";
import type { Card } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { addToWallet } from "@/services";
import { cn } from "@/lib/utils";
import WalletCardFace from "./WalletCardFace.vue";
import type { Wallet } from "./wallet-modal";

const WALLET = {
  apple: {
    name: "Apple Pay",
    app: "Wallet",
    icon: RiAppleFill,
    steps: ["On your iPhone, open Wallet and tap +.", "Choose Debit or Credit Card and scan the front.", "Scan the back when asked, then confirm."],
  },
  google: {
    name: "Google Pay",
    app: "Google Wallet",
    icon: RiGoogleFill,
    steps: ["On your phone, open Google Wallet and tap Add to Wallet.", "Choose Payment card and scan the front.", "Scan the back when asked, then confirm."],
  },
} as const;

const props = defineProps<{ card: Card; wallet: Wallet }>();
const open = defineModel<boolean>("open", { required: true });

const phone = useMediaQuery("(max-width: 767px)");
const w = computed(() => WALLET[props.wallet]);
const add = useAction(addToWallet);
const { pending } = add;

async function done() {
  const r = await add.run(props.card.id, props.wallet);
  if (r.ok) {
    toast(`Added to ${w.value.name}`);
    open.value = false;
  } else toast("We couldn’t add the card. Try again.");
}
</script>

<template>
  <Modal
    v-model:open="open"
    :title="`Add to ${w.name}`"
    :description="phone ? `Add this card to ${w.app} on this phone.` : `Scan this card with ${w.app} on your phone.`"
    :class="phone ? undefined : 'sm:max-w-[680px]'"
  >
    <div class="flex items-center justify-between gap-3 rounded-[16px] bg-subtle px-4 py-3">
      <div class="min-w-0">
        <div class="truncate text-[14px] font-medium text-fg">{{ COMPANY.name }}</div>
        <div class="truncate text-[13px] text-fg-3">{{ card.nickname }} •• {{ card.last4 }}</div>
      </div>
      <span class="text-[12px] font-medium text-fg-3">Virtual card</span>
    </div>

    <div v-if="phone" class="mt-5 space-y-4">
      <WalletCardFace :card="card" side="front" masked />
      <p class="text-[14px] leading-[21px] text-fg-2">{{ w.app }} opens with this card ready. Confirm there to finish.</p>
    </div>
    <template v-else>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <figure>
          <WalletCardFace :card="card" side="front" />
          <figcaption class="mt-2 text-center text-[12px] font-medium text-fg-3">Front</figcaption>
        </figure>
        <figure>
          <WalletCardFace :card="card" side="back" />
          <figcaption class="mt-2 text-center text-[12px] font-medium text-fg-3">Back</figcaption>
        </figure>
      </div>
      <ol class="mt-5 space-y-2">
        <li v-for="(s, i) in w.steps" :key="s" class="flex items-start gap-3 text-[14px] leading-[21px] text-fg-2">
          <span class="tnum grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-[12px] font-semibold text-fg">{{ i + 1 }}</span>
          {{ s }}
        </li>
      </ol>
      <p class="mt-3 text-[12px] text-fg-3">Test card. Only show these details to the cardholder.</p>
    </template>

    <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <ForenButton variant="secondary" size="sm" :disabled="pending" @click="open = false">Cancel</ForenButton>
      <button
        v-if="phone"
        type="button"
        :disabled="pending"
        :class="
          cn(
            'inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60 [&_svg]:size-4',
            wallet === 'apple' ? 'bg-[#0b0b0b] text-white' : 'bg-surface text-fg ring-1 ring-line'
          )
        "
        @click="done"
      >
        <component :is="w.icon" />
        {{ pending ? "Adding…" : `Add to ${w.name}` }}
      </button>
      <ForenButton v-else size="sm" :disabled="pending" @click="done">{{ pending ? "Saving…" : "I’ve added it" }}</ForenButton>
    </div>
  </Modal>
</template>
