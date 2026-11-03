<script setup lang="ts" generic="V extends string = string">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
  type HTMLAttributes,
} from "vue";
import { cn } from "@/lib/utils";
import {
  segmentVariants,
  trackVariants,
  type ForenSegmentedControlProps,
} from "./foren-segmented-control";

const props = withDefaults(
  defineProps<
    ForenSegmentedControlProps<V> & { class?: HTMLAttributes["class"] }
  >(),
  {
    modelValue: undefined,
    size: "md",
    fullWidth: false,
    ariaLabel: "Segmented control",
  },
);
const emit = defineEmits<{ "update:modelValue": [next: V] }>();

const internal = ref((props.defaultValue ?? props.options[0]?.value) as V);
const isControlled = computed(() => props.modelValue !== undefined);
const value = computed(() =>
  isControlled.value ? (props.modelValue as V) : internal.value,
);

const track = useTemplateRef<HTMLDivElement>("track");
const pill = ref<{ x: number; w: number; h: number } | null>(null);

// Position the active pill via JS for smooth slide between segments.
function update() {
  const el = track.value;
  if (!el) return;
  const active = el.querySelector<HTMLButtonElement>(
    `[data-value="${value.value}"]`,
  );
  if (!active) {
    pill.value = null;
    return;
  }
  const trackRect = el.getBoundingClientRect();
  const r = active.getBoundingClientRect();
  pill.value = { x: r.left - trackRect.left, w: r.width, h: r.height };
}

let ro: ResizeObserver | undefined;
onMounted(() => {
  update();
  ro = new ResizeObserver(update);
  if (track.value) ro.observe(track.value);
});
onBeforeUnmount(() => ro?.disconnect());
watch(
  [value, () => props.options.length, () => props.size],
  () => nextTick(update),
  { flush: "post" },
);

function select(v: V) {
  if (!isControlled.value) internal.value = v;
  emit("update:modelValue", v);
}
</script>

<template>
  <div
    ref="track"
    role="tablist"
    :aria-label="ariaLabel"
    :class="
      cn(trackVariants({ size }), fullWidth ? 'w-full' : 'w-auto', props.class)
    "
  >
    <span
      v-if="pill"
      aria-hidden="true"
      class="absolute rounded-full bg-[var(--color-foren-bg-elevated)] shadow-[0_1px_1px_rgba(36,28,21,0.05)] transition-[left,width] duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
      :style="{
        left: `${pill.x}px`,
        width: `${pill.w}px`,
        height: `${pill.h}px`,
        top: '50%',
        transform: 'translateY(-50%)',
      }"
    />
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="tab"
      :aria-selected="opt.value === value"
      :data-value="opt.value"
      :disabled="opt.disabled"
      :class="
        segmentVariants({
          size,
          active: opt.value === value,
          stretch: fullWidth,
        })
      "
      @click="!opt.disabled && select(opt.value)"
    >
      <component :is="opt.icon" v-if="opt.icon" />
      <span class="truncate">{{ opt.label }}</span>
    </button>
  </div>
</template>
