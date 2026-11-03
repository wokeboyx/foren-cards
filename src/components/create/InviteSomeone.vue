<script setup lang="ts">
import { computed, ref } from "vue";
import { RiMailSendLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import type { Person } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { useAction } from "@/composables/useAction";
import { invitePerson } from "@/services";
import { allPeople } from "@/stores/app";

const emit = defineEmits<{ added: [p: Person]; close: [] }>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const name = ref("");
const email = ref("");
const err = ref<{ name?: string; email?: string }>({});
const invite = useAction(invitePerson);
const { pending, error } = invite;
const incomplete = computed(
  () =>
    name.value.trim().split(/\s+/).length < 2 ||
    !EMAIL_RE.test(email.value.trim()),
);

async function add() {
  const e: { name?: string; email?: string } = {};
  if (name.value.trim().split(/\s+/).length < 2)
    e.name = "Enter their first and last name.";
  if (!EMAIL_RE.test(email.value.trim()))
    e.email = "Enter a valid email address.";
  if (
    allPeople().some(
      (p) => p.email.toLowerCase() === email.value.trim().toLowerCase(),
    )
  )
    e.email = "This person is already on the list.";
  err.value = e;
  if (e.name || e.email) return;
  const r = await invite.run(name.value.trim(), email.value.trim());
  if (r.ok) {
    toast(
      `${name.value.trim()} added. We’ve emailed ${email.value.trim()} an invite.`,
    );
    emit("added", r.value);
  }
}
</script>

<template>
  <div class="mt-3 space-y-3 rounded-[16px] bg-subtle p-4">
    <div class="flex items-start gap-2.5 text-[13px] leading-[18px] text-fg-2">
      <RiMailSendLine
        class="mt-0.5 size-4 shrink-0 text-fg"
        aria-hidden="true"
      />
      We’ll email them an invite to join {{ COMPANY.name }} on Foren. Their card
      is created now and they can use it once they’ve joined.
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <ForenInput
        v-model="name"
        label="Full name"
        :error="err.name"
        placeholder="e.g. Bisi Adewale"
        autocomplete="off"
      />
      <ForenInput
        v-model="email"
        label="Work email"
        type="email"
        :error="err.email"
        placeholder="bisi@company.com"
        autocomplete="off"
      />
    </div>
    <p v-if="error" role="alert" class="text-[13px] text-error">
      We couldn’t send the invite. Try again.
    </p>
    <div class="flex justify-end gap-2">
      <ForenButton
        type="button"
        size="xs"
        variant="ghost"
        @click="emit('close')"
        >Cancel</ForenButton
      >
      <ForenButton
        type="button"
        size="xs"
        :disabled="pending || incomplete"
        @click="add"
      >
        {{ pending ? "Adding…" : "Add and select" }}
      </ForenButton>
    </div>
  </div>
</template>
