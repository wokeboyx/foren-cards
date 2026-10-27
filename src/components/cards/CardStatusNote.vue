<script setup lang="ts">
/** Status messages use the DS Info note, allowed to wrap onto several lines. Slots: default, icon. */
import ForenInfoNote from "@/components/ui/ForenInfoNote.vue";

const NOTE_INTENT = { info: "info", warning: "warning", error: "error", neutral: "default" } as const;
defineProps<{ tone: keyof typeof NOTE_INTENT }>();
defineSlots<{ default(): unknown; icon?(): unknown }>();
</script>

<template>
  <ForenInfoNote :intent="NOTE_INTENT[tone]" class="h-auto items-start rounded-[14px] py-2.5 [&>span]:whitespace-normal [&>svg]:mt-0.5">
    <template v-if="$slots.icon" #icon><slot name="icon" /></template>
    <slot />
  </ForenInfoNote>
</template>
