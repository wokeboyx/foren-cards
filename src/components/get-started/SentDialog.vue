<script setup lang="ts">
import Modal from "@/components/Modal.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { asset } from "@/lib/base-path";
import type { Stakeholder } from "@/stores/onboarding";
import CopyLink from "./CopyLink.vue";
import GroupLabel from "./GroupLabel.vue";
import PersonAvatar from "./PersonAvatar.vue";
import { fullName, roleLine } from "./shared";

defineProps<{ open: boolean; people: Stakeholder[] }>();
const emit = defineEmits<{ done: [] }>();
</script>

<template>
  <Modal
    :open="open"
    class="sm:max-w-[460px]"
    @update:open="(o) => !o && emit('done')"
  >
    <template #title>
      <span class="flex flex-col items-center gap-3 pl-10 text-center">
        <img
          :src="asset('/onboarding/envelope.png')"
          alt=""
          width="104"
          height="104"
        />
        <span
          class="font-display text-[22px] leading-[30px] [font-synthesis:none]"
          >Verification emails sent</span
        >
      </span>
    </template>
    <p
      class="-mt-3 mb-5 text-center text-[13px] leading-[19px] font-medium text-fg-2"
    >
      We’ve emailed everyone. You can also copy their links to share privately.
    </p>
    <GroupLabel>Stakeholders ({{ people.length }})</GroupLabel>
    <ul class="mb-6 flex flex-col gap-2">
      <li
        v-for="p in people"
        :key="p.id"
        class="flex items-center gap-3 rounded-[14px] border border-line px-3 py-2.5"
      >
        <PersonAvatar :person="p" :size="32" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-[13px] leading-[19px] font-semibold text-fg">
            {{ fullName(p) }}
          </p>
          <p class="text-[12px] leading-[18px] font-medium text-fg-2">
            {{ roleLine(p) }}
          </p>
        </div>
        <CopyLink :person="p" />
      </li>
    </ul>
    <ForenButton size="md" class="w-full" @click="emit('done')"
      >Done</ForenButton
    >
  </Modal>
</template>
