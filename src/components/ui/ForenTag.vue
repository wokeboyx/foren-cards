<script setup lang="ts">
import {
  computed,
  useSlots,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from "vue";
import { cn } from "@/lib/utils";
import { tagVariants, type TagVariants } from "./foren-tag";

const props = withDefaults(
  defineProps<{
    state?: TagVariants["state"];
    size?: TagVariants["size"];
    /** Convenience for filter UIs — true === state:"selected". */
    selected?: boolean;
    type?: ButtonHTMLAttributes["type"];
    class?: HTMLAttributes["class"];
  }>(),
  { type: "button" },
);
defineSlots<{
  default?(): unknown;
  leadingIcon?(): unknown;
  trailingIcon?(): unknown;
}>();
const slots = useSlots();
const resolvedState = computed(
  () => props.state ?? (props.selected ? "selected" : "unselected"),
);
const padding = computed(() => {
  const lead = !!slots.leadingIcon;
  const trail = !!slots.trailingIcon;
  if (!slots.default && (lead || trail)) return "iconOnly";
  if (lead && trail) return "both";
  if (lead) return "leading";
  if (trail) return "trailing";
  return "symmetric";
});
</script>

<template>
  <button
    :type="props.type"
    :aria-pressed="
      resolvedState === 'selected' || resolvedState === 'destructive'
    "
    :class="
      cn(
        tagVariants({ state: resolvedState, size: props.size, padding }),
        props.class,
      )
    "
  >
    <slot name="leadingIcon" />
    <span v-if="$slots.default"><slot /></span>
    <slot name="trailingIcon" />
  </button>
</template>
