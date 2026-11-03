<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { noteVariants, type ForenInfoNoteProps } from "./foren-info-note";

const props = withDefaults(
  defineProps<ForenInfoNoteProps & { class?: HTMLAttributes["class"] }>(),
  {
    intent: "default",
    size: "sm",
    hideIcon: false,
  },
);
/** default: body text · icon: overrides the per-intent icon · action: trailing dismiss button or link */
defineSlots<{ default(): unknown; icon?(): unknown; action?(): unknown }>();

const ariaLive = computed(() =>
  props.intent === "error" || props.intent === "warning"
    ? "assertive"
    : "polite",
);
const role = computed(() => (props.intent === "error" ? "alert" : "status"));
</script>

<template>
  <div
    :role="role"
    :aria-live="ariaLive"
    :class="cn(noteVariants({ intent, size }), props.class)"
  >
    <template v-if="!hideIcon">
      <slot name="icon">
        <svg
          v-if="intent === 'success'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <svg
          v-else-if="intent === 'warning'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
        <svg
          v-else-if="intent === 'error'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </slot>
    </template>
    <span class="flex-1 min-w-0 truncate"><slot /></span>
    <slot name="action" />
  </div>
</template>
