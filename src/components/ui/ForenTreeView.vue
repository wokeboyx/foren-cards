<script setup lang="ts">
import { computed, ref, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import ForenTreeRow from "./ForenTreeRow.vue";
import type { TreeNode } from "./foren-tree-view";

const props = withDefaults(
  defineProps<{
    data: TreeNode[];
    /** Initial expanded ids when uncontrolled. */
    defaultExpandedIds?: string[];
    /** Controlled expanded ids (`v-model:expandedIds`). */
    expandedIds?: string[];
    /** Controlled selection (`v-model:selectedIds`). */
    selectedIds?: string[];
    defaultSelectedIds?: string[];
    selectable?: boolean;
    multiSelect?: boolean;
    /** Render guide lines between siblings. */
    showLines?: boolean;
    /** Render leading icon slot (folder / file fallback or node.icon). */
    showIcons?: boolean;
    /** Indent unit in px per depth. */
    indent?: number;
    /** Disable expand animation. */
    animateExpand?: boolean;
    class?: HTMLAttributes["class"];
  }>(),
  {
    defaultExpandedIds: () => [],
    expandedIds: undefined,
    selectedIds: undefined,
    defaultSelectedIds: () => [],
    selectable: true,
    multiSelect: false,
    showLines: true,
    showIcons: true,
    indent: 20,
    animateExpand: true,
  }
);
const emit = defineEmits<{
  "update:expandedIds": [next: string[]];
  "update:selectedIds": [next: string[]];
  nodeClick: [node: TreeNode];
}>();

const internalExpanded = ref<string[]>(props.defaultExpandedIds);
const internalSelected = ref<string[]>(props.defaultSelectedIds);
const currentExpanded = computed(() => props.expandedIds ?? internalExpanded.value);
const currentSelected = computed(() => props.selectedIds ?? internalSelected.value);

function setExpanded(next: string[]) {
  if (props.expandedIds === undefined) internalExpanded.value = next;
  emit("update:expandedIds", next);
}
function setSelected(next: string[]) {
  if (props.selectedIds === undefined) internalSelected.value = next;
  emit("update:selectedIds", next);
}
function toggleExpanded(id: string) {
  const cur = currentExpanded.value;
  setExpanded(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
}
function handleSelect(node: TreeNode, multiKey: boolean) {
  if (!props.selectable || node.disabled) return;
  const cur = currentSelected.value;
  const next =
    props.multiSelect && multiKey
      ? cur.includes(node.id)
        ? cur.filter((x) => x !== node.id)
        : [...cur, node.id]
      : cur.includes(node.id) && cur.length === 1
        ? []
        : [node.id];
  setSelected(next);
}
const onNodeClick = (node: TreeNode) => emit("nodeClick", node);
</script>

<template>
  <div :class="cn('w-full rounded-xl border border-[var(--color-foren-border-muted)] bg-[var(--color-foren-bg-default)] p-1.5', props.class)" role="tree">
    <ForenTreeRow
      v-for="(node, i) in data"
      :key="node.id"
      :node="node"
      :level="0"
      :is-last="i === data.length - 1"
      :parent-lasts="[]"
      :expanded="currentExpanded"
      :selected="currentSelected"
      :toggle-expanded="toggleExpanded"
      :handle-select="handleSelect"
      :on-node-click="onNodeClick"
      :show-lines="showLines"
      :show-icons="showIcons"
      :indent="indent"
      :animate-expand="animateExpand"
    />
  </div>
</template>
