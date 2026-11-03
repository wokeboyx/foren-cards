<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import {
  arrowPosition,
  arrowVariants,
  sideMotion,
  sidePosition,
  tooltipVariants,
  type ForenTooltipProps,
} from "./foren-tooltip";

const props = withDefaults(defineProps<ForenTooltipProps>(), {
  variant: "dark",
  size: "sm",
  side: "top",
  delay: 200,
});
const emit = defineEmits<{ action: [] }>();

const open = ref(false);
const mounted = ref(false);
let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function show() {
  clearTimeout(closeTimer);
  if (mounted.value) {
    open.value = true;
    return;
  }
  openTimer = setTimeout(() => {
    mounted.value = true;
    // Next frame, flip open to trigger transition
    requestAnimationFrame(() => (open.value = true));
  }, props.delay);
}
function hide() {
  clearTimeout(openTimer);
  open.value = false;
  closeTimer = setTimeout(() => (mounted.value = false), 180);
}

// Esc closes
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") hide();
}
watch(mounted, (m) =>
  m
    ? window.addEventListener("keydown", onKey)
    : window.removeEventListener("keydown", onKey),
);
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
});

const motion = computed(() => sideMotion[props.side]);
</script>

<template>
  <span
    class="relative inline-flex"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
    <div
      v-if="mounted"
      role="tooltip"
      :data-state="open ? 'open' : 'closed'"
      style="corner-shape: squircle"
      :class="
        cn(
          tooltipVariants({ variant, size }),
          sidePosition[side],
          motion.open,
          motion.closed,
        )
      "
    >
      <div v-if="title" class="font-semibold tracking-[0.0125em]">
        {{ title }}
      </div>
      <div class="opacity-90">{{ description }}</div>
      <template v-if="action">
        <a
          v-if="actionHref"
          :href="actionHref"
          class="pointer-events-auto inline-block mt-0.5 font-semibold underline underline-offset-[3px] decoration-current/40 hover:decoration-current focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30 rounded-sm"
        >
          {{ action }}
        </a>
        <button
          v-else
          type="button"
          class="pointer-events-auto inline-block mt-0.5 text-left font-semibold underline underline-offset-[3px] decoration-current/40 hover:decoration-current cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30 rounded-sm"
          @click="emit('action')"
        >
          {{ action }}
        </button>
      </template>
      <span
        aria-hidden="true"
        :class="cn(arrowVariants({ variant }), arrowPosition[side])"
      />
    </div>
  </span>
</template>
