<script setup lang="ts">
/** What to do about a card that's about to expire: get a new card, then move anything that bills the old one. */
import { computed } from "vue";
import { useRouter } from "vue-router";
import ForenButton from "@/components/ui/ForenButton.vue";
import Modal from "@/components/Modal.vue";
import { POLICY } from "@/config/policy";
import { format } from "@/domain/money";
import type { Card } from "@/domain/types";
import { can } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";
import { expiryLabel } from "@/components/create/card-form";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const router = useRouter();
const store = useAppStore();
const canIssue = computed(() => can(store.role, "issue"));

function go() {
  emit("close");
  router.push(
    canIssue.value
      ? {
          path: "/cards/new",
          query: {
            nickname: props.card.nickname,
            type: props.card.companyCard ? "company" : "standard",
          },
        }
      : "/cards/request",
  );
}
</script>

<template>
  <Modal
    :open="true"
    title="This card is expiring soon"
    :description="`${card.nickname} •• ${card.last4} expires in ${expiryLabel(card.expiry)}. After that, payments on it are declined.`"
    @update:open="(o) => !o && emit('close')"
  >
    <div class="space-y-5">
      <section aria-labelledby="exp-new">
        <h3 id="exp-new" class="text-[14px] font-semibold text-fg">
          1. Get a new card
        </h3>
        <p class="mt-1 text-[13px] leading-[19px] text-fg-2">
          {{
            canIssue
              ? `Create a replacement with the same settings. It gets a new number and expiry date, and creating a card costs ${format(POLICY.cardCreationFee)}.`
              : "Ask the account owner for a replacement. Your request goes to them with this card’s details."
          }}
        </p>
        <ForenButton size="sm" class="mt-3" @click="go">{{
          canIssue ? "Create a new card" : "Request a new card"
        }}</ForenButton>
      </section>

      <section aria-labelledby="exp-sites">
        <h3 id="exp-sites" class="text-[14px] font-semibold text-fg">
          2. Replace it where it’s used
        </h3>
        <p class="mt-1 text-[13px] leading-[19px] text-fg-2">
          If this card is saved on a site or app, update it on each site or app,
          or the next payment will fail once the card expires.
        </p>
        <ol
          class="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] leading-[19px] text-fg-2"
        >
          <li>
            Open the new card and copy its number, expiry date and security
            code.
          </li>
          <li>
            Sign in to the site or app and open its billing or payment settings.
          </li>
          <li>
            Add the new card, make it the default, then remove the old one.
          </li>
          <li>
            Keep this card active until the next payment goes through on the new
            one, then terminate it.
          </li>
        </ol>
      </section>

      <div class="flex justify-end">
        <ForenButton variant="secondary" size="sm" @click="emit('close')"
          >Close</ForenButton
        >
      </div>
    </div>
  </Modal>
</template>
