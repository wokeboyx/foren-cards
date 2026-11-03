<script setup lang="ts">
/** The card terms and conditions, with the limits and fees up front. Opened from the empty state and the create page. */
import ForenButton from "@/components/ui/ForenButton.vue";
import Modal from "@/components/Modal.vue";
import { POLICY } from "@/config/policy";
import { feeScheduleText } from "@/domain/fees";
import { format } from "@/domain/money";
import CardPolicyInfo from "./CardPolicyInfo.vue";

const open = defineModel<boolean>("open", { required: true });

const sections = [
  {
    title: "Who can use a card",
    body: "A card is issued to the business or to one team member. It is for that person’s business spending only, and its details must not be shared with anyone else.",
  },
  {
    title: "Limits",
    body: `Each card has a daily limit and a limit for each payment. A payment above either limit is declined. You can have ${POLICY.maxActiveCards} active cards at a time, and terminated cards don’t count.`,
  },
  {
    title: "Fees",
    body: `Creating a card costs ${format(POLICY.cardCreationFee)}. Putting money on a card costs ${feeScheduleText(POLICY.cardFundingFee, format)}. Taking money off a card costs ${feeScheduleText(POLICY.cardWithdrawalFee, format)}. Paying from a balance in another currency adds a conversion fee. Fees are shown before you confirm and aren’t refunded.`,
  },
  {
    title: "Funding and spending",
    body: "A card only spends what is on it. A payment is declined when the balance runs out.",
  },
  {
    title: "Freezing and terminating",
    body: "You can freeze a card to pause spending and unfreeze it later. Terminating a card is permanent: it can’t be used or reactivated, and its history is kept.",
  },
  {
    title: "Security",
    body: "Showing a card’s number or security code, funding, freezing and terminating all need your transaction PIN. Card details hide again after 45 seconds.",
  },
];
</script>

<template>
  <Modal
    v-model:open="open"
    title="Card terms and conditions"
    description="Read these before you create a card."
  >
    <div class="space-y-4">
      <CardPolicyInfo />
      <div
        v-for="(s, i) in sections"
        :key="s.title"
        class="text-[14px] leading-[21px]"
      >
        <h3 class="font-semibold text-fg">{{ i + 1 }}. {{ s.title }}</h3>
        <p class="mt-1 font-medium text-fg-2">{{ s.body }}</p>
      </div>
    </div>
    <template #footer>
      <ForenButton size="sm" @click="open = false">Close</ForenButton>
    </template>
  </Modal>
</template>
