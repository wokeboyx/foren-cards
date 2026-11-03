<script setup lang="ts">
// A run of stitching pressed into the leather: a dark stroke for the groove's upper wall and a
// faint light one for the lit lower lip. Private to ForenAccountWallet.
import { STITCH_DASH } from "./foren-account-wallet";

defineProps<{ d: string }>();
</script>

<template>
  <g
    :stroke-dasharray="STITCH_DASH"
    stroke-width="1.3"
    stroke-linecap="round"
    fill="none"
  >
    <path :d="d" stroke="rgba(0,0,0,0.9)" transform="translate(0 -0.6)" />
    <path :d="d" stroke="rgba(255,255,255,0.14)" transform="translate(0 0.6)" />
  </g>
</template>
