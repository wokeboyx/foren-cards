<script setup lang="ts">
/** A transaction error as in the Figma money flows ("Insufficient balance"): a red info icon, then the message in red. */
import { RiInformationFill } from "@/components/icons";
</script>

<template>
  <p
    role="alert"
    class="flex items-start gap-2 text-[14px] leading-[21px] font-medium tracking-[0.14px] text-error"
  >
    <RiInformationFill class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    <span><slot /></span>
  </p>
</template>
