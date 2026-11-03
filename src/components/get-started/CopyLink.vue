<script setup lang="ts">
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import type { Stakeholder } from "@/stores/onboarding";
import { verificationLink } from "./shared";

const props = defineProps<{ person: Stakeholder }>();

async function copy() {
  try {
    await navigator.clipboard.writeText(verificationLink(props.person));
  } catch {
    // Clipboard can be blocked (e.g. insecure context); the toast still confirms the action in the prototype.
  }
  toast.success(`Link for ${props.person.firstName} copied`);
}
</script>

<template>
  <ForenButton variant="outline" size="xxs" class="shrink-0" @click="copy"
    >Copy link</ForenButton
  >
</template>
