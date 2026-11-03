<script setup lang="ts">
import { useRouter } from "vue-router";
import { RiShieldCheckFill, RiUser3Fill } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import { asset } from "@/lib/base-path";
import Note from "./Note.vue";
import SetupColumn from "./SetupColumn.vue";
import SetupHeader from "./SetupHeader.vue";

defineProps<{ threshold: number }>();
const emit = defineEmits<{ start: [] }>();
const router = useRouter();
</script>

<template>
  <SetupColumn class="pt-4">
    <SetupHeader
      title="Corporate structure"
      :description="`Add details for all company directors, ultimate beneficial owners (UBOs) holding ${threshold}% or more, and authorised signatories.`"
    />
    <div class="mb-8 flex justify-center">
      <img
        :src="asset('/onboarding/folder.png')"
        alt=""
        width="140"
        height="140"
        fetchpriority="high"
      />
    </div>
    <Note intent="info" title="Why we ask this">
      Financial regulations require us to identify anyone with significant
      control over the business. This helps keep global transfers secure.
    </Note>
    <ul class="mt-6 flex flex-col gap-5">
      <li class="flex gap-3">
        <RiUser3Fill
          class="mt-0.5 size-4 shrink-0 text-[#3d6fb6]"
          aria-hidden="true"
        />
        <div>
          <p class="text-[14px] leading-[21px] font-medium text-fg">
            Add directors, owners and signatories
          </p>
          <p class="text-[12px] leading-[18px] font-medium text-fg-2">
            Include anyone who is a director, owns {{ threshold }}% or more, or
            can sign for the company.
          </p>
        </div>
      </li>
      <li class="flex gap-3">
        <RiShieldCheckFill
          class="mt-0.5 size-4 shrink-0 text-[#c026d3]"
          aria-hidden="true"
        />
        <div>
          <p class="text-[14px] leading-[21px] font-medium text-fg">
            They verify their identity
          </p>
          <p class="text-[12px] leading-[18px] font-medium text-fg-2">
            Each person gets an email link to upload their ID and proof of
            address, and take a quick selfie.
          </p>
        </div>
      </li>
    </ul>
    <div class="mt-10 flex flex-col-reverse gap-3 sm:flex-row">
      <ForenButton
        variant="outline"
        size="md"
        class="flex-1"
        @click="router.push('/get-started')"
        >Skip for now</ForenButton
      >
      <ForenButton size="md" class="flex-1" @click="emit('start')"
        >Get started</ForenButton
      >
    </div>
  </SetupColumn>
</template>
