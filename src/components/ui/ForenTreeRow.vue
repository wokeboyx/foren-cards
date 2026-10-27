<script setup lang="ts">
// One row of ForenTreeView (recursive). Private to the tree.
import { computed } from "vue";
import { cn } from "@/lib/utils";
import type { TreeNode } from "./foren-tree-view";

const props = defineProps<{
  node: TreeNode;
  level: number;
  /** True when this node is the last child of its parent. */
  isLast: boolean;
  /** For each ancestor depth, whether that ancestor was last-at-its-level. */
  parentLasts: boolean[];
  expanded: string[];
  selected: string[];
  toggleExpanded: (id: string) => void;
  handleSelect: (node: TreeNode, multiKey: boolean) => void;
  onNodeClick?: (node: TreeNode) => void;
  showLines: boolean;
  showIcons: boolean;
  indent: number;
  animateExpand: boolean;
}>();

const hasChildren = computed(() => !!props.node.children && props.node.children.length > 0);
const isOpen = computed(() => props.expanded.includes(props.node.id));
const isSelected = computed(() => props.selected.includes(props.node.id));

function activate(multiKey: boolean) {
  if (hasChildren.value) props.toggleExpanded(props.node.id);
  props.handleSelect(props.node, multiKey);
  props.onNodeClick?.(props.node);
}
function onRowClick(e: MouseEvent) {
  if (props.node.disabled) return;
  activate(e.metaKey || e.ctrlKey);
}
function onKey(e: KeyboardEvent) {
  if (props.node.disabled) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    activate(e.metaKey || e.ctrlKey);
  } else if (e.key === "ArrowRight" && hasChildren.value && !isOpen.value) {
    e.preventDefault();
    props.toggleExpanded(props.node.id);
  } else if (e.key === "ArrowLeft" && hasChildren.value && isOpen.value) {
    e.preventDefault();
    props.toggleExpanded(props.node.id);
  }
}
</script>

<template>
  <div role="treeitem" :aria-expanded="hasChildren ? isOpen : undefined" :aria-selected="isSelected" :aria-disabled="node.disabled || undefined" class="select-none">
    <div
      :tabindex="node.disabled ? -1 : 0"
      :class="
        cn(
          'relative flex items-center gap-1.5 py-1.5 pr-2 rounded-md cursor-pointer outline-none transition-colors duration-150',
          'text-[13px] leading-[18px] tracking-[0.01em] font-medium text-[var(--color-foren-text-primary)]',
          'hover:bg-[var(--color-foren-bg-sunken)] focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)]',
          isSelected && 'bg-[var(--color-foren-bg-subtle)]',
          node.disabled && 'opacity-50 cursor-not-allowed'
        )
      "
      :style="{ paddingLeft: `${8 + level * indent}px` }"
      @click="onRowClick"
      @keydown="onKey"
    >
      <template v-if="showLines && level > 0">
        <!-- Ancestor vertical rails — drop the rail past any ancestor that was the last child at its own level. -->
        <template v-for="(wasLast, d) in parentLasts" :key="d">
          <span
            v-if="!wasLast"
            aria-hidden="true"
            class="absolute top-0 bottom-0 border-l border-[var(--color-foren-border-muted)] pointer-events-none"
            :style="{ left: `${d * indent + 14}px` }"
          />
        </template>
        <!-- Immediate parent rail — full height if more siblings follow, top→midpoint (L-bend) if this row is the last child. -->
        <span
          aria-hidden="true"
          class="absolute left-0 border-l border-[var(--color-foren-border-muted)] pointer-events-none"
          :style="{ left: `${(level - 1) * indent + 14}px`, top: 0, height: isLast ? '50%' : '100%' }"
        />
        <!-- Horizontal connector from parent rail to row content. -->
        <span
          aria-hidden="true"
          class="absolute border-t border-[var(--color-foren-border-muted)] pointer-events-none"
          :style="{ left: `${(level - 1) * indent + 14}px`, width: `${indent - 6}px`, top: '50%' }"
        />
      </template>
      <span
        :class="
          cn(
            'inline-flex items-center justify-center size-4 shrink-0 text-[var(--color-foren-text-tertiary)] transition-transform duration-150 ease-out',
            hasChildren ? (isOpen ? 'rotate-90' : 'rotate-0') : 'opacity-0'
          )
        "
        aria-hidden="true"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </span>
      <span v-if="showIcons" class="inline-flex items-center justify-center size-4 shrink-0 text-[var(--color-foren-text-secondary)]" aria-hidden="true">
        <component :is="node.icon" v-if="node.icon" />
        <span v-else-if="hasChildren" class="t-icon-swap" :data-state="isOpen ? 'a' : 'b'">
          <span class="t-icon" data-icon="a">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3Z" />
              <path d="m3 9 1.7 8.4A2 2 0 0 0 6.66 19h10.68a2 2 0 0 0 1.96-1.6L21 9" />
            </svg>
          </span>
          <span class="t-icon" data-icon="b">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
            </svg>
          </span>
        </span>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
          <path d="M14 3v6h6" />
        </svg>
      </span>
      <span class="truncate flex-1">{{ node.label }}</span>
    </div>
    <div
      v-if="hasChildren"
      :class="cn('grid transition-[grid-template-rows] ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]', animateExpand ? 'duration-200' : 'duration-0')"
      :aria-hidden="!isOpen"
    >
      <div class="overflow-hidden">
        <ForenTreeRow
          v-for="(child, i) in node.children"
          :key="child.id"
          :node="child"
          :level="level + 1"
          :is-last="i === node.children!.length - 1"
          :parent-lasts="[...parentLasts, isLast]"
          :expanded="expanded"
          :selected="selected"
          :toggle-expanded="toggleExpanded"
          :handle-select="handleSelect"
          :on-node-click="onNodeClick"
          :show-lines="showLines"
          :show-icons="showIcons"
          :indent="indent"
          :animate-expand="animateExpand"
        />
      </div>
    </div>
  </div>
</template>
