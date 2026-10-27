<script setup lang="ts">
import { computed, ref } from "vue";
import { RiArrowRightLine, RiInformationFill } from "@/components/icons";
import { toast } from "vue-sonner";
import Modal from "@/components/Modal.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";

const open = ref(false);
const name = ref("");
const email = ref("");
const tried = ref(false);
const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value));

function submit() {
  tried.value = true;
  if (!name.value.trim() || !emailOk.value) return;
  toast.success(`Invite sent to ${name.value.trim()}`);
  open.value = false;
  name.value = "";
  email.value = "";
  tried.value = false;
}
</script>

<template>
  <div class="mt-10 flex flex-col gap-3 rounded-[16px] bg-surface px-4 py-3.5 sm:-mx-6 sm:flex-row sm:items-center">
    <RiInformationFill class="size-4 shrink-0 text-[#e0a526] max-sm:hidden" aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <p class="text-[13px] leading-[19px] font-medium text-fg">Rather have someone else handle setup?</p>
      <p class="text-[12px] leading-[18px] font-medium text-fg-2">They complete these same steps on your behalf.</p>
    </div>
    <ForenButton variant="outline" size="xxs" class="self-start sm:self-auto" @click="open = true">
      Delegate setup
      <template #trailingIcon><RiArrowRightLine /></template>
    </ForenButton>
  </div>
  <Modal v-model:open="open" title="Delegate setup" description="We’ll email them a link to finish these steps. You stay the account owner.">
    <form novalidate class="flex flex-col gap-4" @submit.prevent="submit">
      <ForenInput
        v-model="name"
        label="Their name"
        :aria-invalid="tried && !name.trim()"
        :error="tried && !name.trim() ? 'Enter their name' : undefined"
      />
      <ForenInput
        v-model="email"
        label="Work email"
        type="email"
        :aria-invalid="tried && !emailOk"
        :error="tried && !emailOk ? 'Enter a valid email address' : undefined"
      />
      <div class="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton type="button" variant="outline" size="sm" @click="open = false">Cancel</ForenButton>
        <ForenButton type="submit" size="sm">Send invite</ForenButton>
      </div>
    </form>
  </Modal>
</template>
