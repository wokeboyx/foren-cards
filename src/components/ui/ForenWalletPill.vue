<script setup lang="ts">
// The white pill button on the wallet's pocket. Private to ForenAccountWallet.
import { CARET_PATH } from "./foren-account-wallet";
</script>

<template>
  <button
    type="button"
    class="flex h-[33px] cursor-pointer items-center gap-2 rounded-[24px] bg-white pr-3 pl-4 font-[family-name:var(--font-inter)] text-[12px] leading-[21px] font-semibold tracking-[0.12px] text-black transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.98]"
    :style="{ boxShadow: '0 2px 10px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,0,0,0.2)' }"
  >
    <slot />
    <span class="relative block size-[14px] shrink-0" aria-hidden="true">
      <svg class="absolute" :style="{ left: '8.33%', top: '23.48%', width: '83.34%', height: '53.04%' }" viewBox="0 0 11.6669 7.42465" fill="none">
        <path :d="CARET_PATH" fill="currentColor" />
      </svg>
    </span>
  </button>
</template>
