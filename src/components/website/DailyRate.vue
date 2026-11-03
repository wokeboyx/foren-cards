<script setup lang="ts">
// Opt in to daily rates on WhatsApp. Prototype only: nothing is sent.
import { computed, onMounted, ref } from "vue";
import { RiCheckLine, RiWhatsappLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import { DIAL_CODES, defaultDialIso, dialFor } from "./data";
import { ink, linkBtn, muted, secondaryBtn, validPhone } from "./shared";

const dial = ref("ng");
onMounted(() => (dial.value = defaultDialIso()));
const phone = ref("");
const tried = ref(false);
const done = ref<string | null>(null);

const dialInfo = computed(() => dialFor(dial.value));
const invalid = computed(() => tried.value && !validPhone(phone.value));

function submit() {
  tried.value = true;
  if (!validPhone(phone.value))
    return document.getElementById("daily-phone")?.focus();
  done.value = `${dialInfo.value.code} ${phone.value.trim()}`;
}
function onPhone(e: Event) {
  const el = e.target as HTMLInputElement;
  el.value = el.value.replace(/[^\d ]/g, "");
  phone.value = el.value;
}
</script>

<template>
  <p
    v-if="done"
    :class="cn('flex max-w-[440px] items-center gap-2 text-[14px]', muted)"
    role="status"
  >
    <RiCheckLine class="size-4 shrink-0 text-[#1da851]" aria-hidden="true" />
    <span>
      Daily rates go to {{ done }} every morning.
      <button type="button" :class="linkBtn" @click="done = null">
        Change
      </button>
    </span>
  </p>
  <form v-else novalidate class="max-w-[440px]" @submit.prevent="submit">
    <label
      for="daily-phone"
      :class="cn('flex items-center gap-2 text-[14px] font-medium', ink)"
    >
      <RiWhatsappLine class="size-4 text-[#1da851]" aria-hidden="true" /> Get
      daily rates on WhatsApp
    </label>
    <div
      :class="
        cn(
          'mt-3 flex h-12 items-center rounded-full border bg-white py-1 pr-1 pl-1.5 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#2f2d2b]/15',
          invalid
            ? 'border-[#d92d20]'
            : 'border-[#e6e4e2] has-[input:focus-visible]:border-[#2f2d2b]',
        )
      "
    >
      <span
        class="relative flex h-full shrink-0 items-center gap-1.5 rounded-full px-2 hover:bg-[#f6f5f2] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/30"
      >
        <img
          :src="dialInfo.flag"
          alt=""
          width="18"
          height="18"
          class="size-[18px] rounded-full"
        />
        <span :class="cn('text-[14px] font-medium', ink)">{{
          dialInfo.code
        }}</span>
        <select
          v-model="dial"
          aria-label="Country code"
          class="absolute inset-0 cursor-pointer opacity-0"
        >
          <option v-for="d in DIAL_CODES" :key="d.iso" :value="d.iso">
            {{ d.country }} ({{ d.code }})
          </option>
        </select>
      </span>
      <span class="mx-1 h-5 w-px shrink-0 bg-[#e6e4e2]" aria-hidden="true" />
      <input
        id="daily-phone"
        type="tel"
        inputmode="tel"
        autocomplete="tel-national"
        placeholder="WhatsApp number"
        :value="phone"
        :aria-invalid="invalid"
        :aria-describedby="invalid ? 'daily-phone-error' : undefined"
        :class="
          cn(
            'h-full min-w-0 flex-1 bg-transparent px-2 text-[14px] font-medium outline-none placeholder:text-[#b5b0ab]',
            ink,
          )
        "
        @input="onPhone"
      />
      <button type="submit" :class="cn(secondaryBtn, 'h-10 shrink-0 px-4')">
        Subscribe
      </button>
    </div>
    <p
      v-if="invalid"
      id="daily-phone-error"
      role="alert"
      class="mt-1.5 px-3 text-[12px] font-medium text-[#d92d20]"
    >
      Enter your WhatsApp number
    </p>
  </form>
</template>
