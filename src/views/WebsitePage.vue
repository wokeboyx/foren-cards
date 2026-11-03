<script setup lang="ts">
// One foren.co section, mocked up for testing: WhatsApp quote, payment link and exchange rate tabs.
import RatesSection from "@/components/website/RatesSection.vue";
import SiteHeader from "@/components/website/SiteHeader.vue";
</script>

<template>
  <div class="min-h-dvh bg-white font-sans">
    <SiteHeader />
    <main id="main">
      <RatesSection />
    </main>
  </div>
</template>
