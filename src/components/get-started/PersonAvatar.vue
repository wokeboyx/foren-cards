<script setup lang="ts">
/** Coloured initial avatar like the Figma stakeholder rows. */
import { computed } from "vue";
import type { Stakeholder } from "@/stores/onboarding";
import { cn } from "@/lib/utils";

const AVATAR_TONES = ["bg-[#3a3633]", "bg-[#5d4fc9]", "bg-[#c9a227]", "bg-[#4c9a4e]", "bg-[#b45309]", "bg-[#3d6fb6]"];

const props = withDefaults(defineProps<{ person: Pick<Stakeholder, "id" | "firstName">; size?: number }>(), { size: 36 });
const tone = computed(() => AVATAR_TONES[[...props.person.id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length]);
</script>

<template>
  <span
    aria-hidden="true"
    :class="cn('grid shrink-0 place-items-center rounded-full font-medium text-white', tone)"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.42}px` }"
  >
    {{ person.firstName.charAt(0).toUpperCase() || "?" }}
  </span>
</template>
