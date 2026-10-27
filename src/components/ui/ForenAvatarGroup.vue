<script setup lang="ts">
// Stacked, overlapping avatars with optional "+N" trailing chip. Children should be <ForenAvatar /> elements.
import { cloneVNode, computed, Comment, Fragment, useSlots, type HTMLAttributes, type VNode } from "vue";
import { cn } from "@/lib/utils";
import ForenAvatar from "./ForenAvatar.vue";
import { avatarMeta, type AvatarSize } from "./foren-avatar";

const props = withDefaults(
  defineProps<{
    size?: AvatarSize;
    /** Maximum avatars to render before showing "+N". */
    max?: number;
    /** Overlap amount as fraction of avatar size. Default 0.3 = avatars overlap by 30%. */
    overlap?: number;
    class?: HTMLAttributes["class"];
  }>(),
  { size: "md", overlap: 0.3 }
);
const slots = useSlots();

function flatten(nodes: VNode[]): VNode[] {
  return nodes.flatMap((n) => (n.type === Fragment ? flatten(n.children as VNode[]) : n.type === Comment ? [] : [n]));
}
const items = computed(() => flatten(slots.default?.() ?? []));
const visible = computed(() => (props.max != null ? items.value.slice(0, props.max) : items.value).map((v) => cloneVNode(v, { size: props.size })));
const hidden = computed(() => (props.max != null ? Math.max(items.value.length - props.max, 0) : 0));
const offset = computed(() => -Math.round(avatarMeta[props.size].px * props.overlap));
</script>

<template>
  <div :class="cn('inline-flex items-center', props.class)">
    <span
      v-for="(child, i) in visible"
      :key="i"
      class="rounded-full"
      :style="{ marginLeft: `${i === 0 ? 0 : offset}px`, boxShadow: '0 0 0 2px var(--color-foren-bg-default)' }"
    >
      <component :is="child" />
    </span>
    <span v-if="hidden > 0" class="rounded-full" :style="{ marginLeft: `${offset}px`, boxShadow: '0 0 0 2px var(--color-foren-bg-default)' }">
      <ForenAvatar :size="size" tone="muted" :initials="`+${hidden}`" fallback="initials" />
    </span>
  </div>
</template>
