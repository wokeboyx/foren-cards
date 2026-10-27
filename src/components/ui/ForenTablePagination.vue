<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/vue";
import { cn } from "@/lib/utils";
import { buildPages, PAGINATION_SIZES, type ForenPaginationLayout, type ForenPaginationSize } from "./foren-table";

const props = withDefaults(
  defineProps<{
    /** compact is the table footer; desktop numbers every page; mobile is prev/label/next. */
    layout?: ForenPaginationLayout;
    size?: ForenPaginationSize;
    /** 1-based (`v-model:page`). */
    page: number;
    pageCount: number;
    /** compact — drives the "SHOWING: n OF total" copy on the left. */
    shown?: number;
    total?: number;
    /** compact — replace the left-hand copy entirely. */
    label?: string;
    /** compact — centre text. Defaults to `page/pageCount`. */
    position?: string;
    /** compact — fill the container instead of the design's fixed 600px. Defaults to true. */
    fluid?: boolean;
    /** mobile — centre text. Defaults to `Page n of total`. */
    pageInfo?: string;
    /** desktop — explicit button list; null renders an ellipsis. Computed when omitted. */
    pages?: (number | null)[];
    class?: HTMLAttributes["class"];
  }>(),
  { layout: "compact", size: "md", fluid: true }
);
const emit = defineEmits<{ "update:page": [next: number] }>();
defineSlots<{ label?(): unknown; position?(): unknown; pageInfo?(): unknown }>();

const s = computed(() => PAGINATION_SIZES[props.size]);
const canPrev = computed(() => props.page > 1);
const canNext = computed(() => props.page < props.pageCount);
const list = computed(() => props.pages ?? buildPages(props.page, props.pageCount));
const prev = () => canPrev.value && emit("update:page", props.page - 1);
const next = () => canNext.value && emit("update:page", props.page + 1);

const FOCUS = "focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)]";
// The design drops the border on the disabled state rather than dimming it, and fades the chevron instead.
const navClass = (disabled: boolean) =>
  cn(
    "grid shrink-0 place-items-center rounded-lg bg-[var(--color-foren-bg-default)] outline-none transition-colors duration-150",
    FOCUS,
    disabled
      ? "cursor-default opacity-30"
      : "cursor-pointer border border-[var(--color-foren-border-muted)] text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-sunken)]"
  );
const pageClass = (active: boolean) =>
  cn(
    "grid shrink-0 place-items-center rounded-lg font-medium tabular-nums outline-none transition-colors duration-150",
    FOCUS,
    s.value.text,
    active
      ? "cursor-default bg-[var(--color-foren-bg-button-primary,#1e1711)] text-[var(--color-foren-text-inverse)]"
      : "cursor-pointer border border-[var(--color-foren-border-muted)] bg-[var(--color-foren-bg-default)] text-[var(--color-foren-text-primary)] hover:bg-[var(--color-foren-bg-sunken)]"
  );
const controlStyle = computed(() => ({ width: `${s.value.control}px`, height: `${s.value.control}px` }));
const iconStyle = computed(() => ({ width: `${s.value.icon}px`, height: `${s.value.icon}px` }));
</script>

<template>
  <div
    v-if="layout === 'compact'"
    aria-label="Pagination"
    role="navigation"
    :class="cn('flex items-center justify-between', fluid ? 'w-full px-6' : 'px-4', props.class)"
    :style="{ height: `${s.height}px`, width: fluid ? undefined : '600px' }"
  >
    <span :class="cn('font-semibold uppercase tabular-nums text-[var(--color-foren-text-tertiary)]', s.text)">
      <slot name="label">{{ label ?? (shown != null && total != null ? `Showing: ${shown} of ${total} items` : null) }}</slot>
    </span>
    <div class="flex shrink-0 items-center" :style="{ gap: `${s.navGap}px` }">
      <button type="button" :disabled="!canPrev" aria-label="Previous page" :style="controlStyle" :class="navClass(!canPrev)" @click="prev">
        <RiArrowLeftSLine aria-hidden="true" :style="iconStyle" />
      </button>
      <span :class="cn('font-medium tabular-nums text-[var(--color-foren-text-primary)]', s.text)">
        <slot name="position">{{ position ?? `${page}/${pageCount}` }}</slot>
      </span>
      <button type="button" :disabled="!canNext" aria-label="Next page" :style="controlStyle" :class="navClass(!canNext)" @click="next">
        <RiArrowRightSLine aria-hidden="true" :style="iconStyle" />
      </button>
    </div>
  </div>
  <div v-else aria-label="Pagination" role="navigation" :class="cn('flex items-center px-4', props.class)" :style="{ gap: `${s.gap}px` }">
    <button type="button" :disabled="!canPrev" aria-label="Previous page" :style="controlStyle" :class="navClass(!canPrev)" @click="prev">
      <RiArrowLeftSLine aria-hidden="true" :style="iconStyle" />
    </button>
    <span v-if="layout === 'mobile'" :class="cn('font-medium whitespace-nowrap tabular-nums text-[var(--color-foren-text-primary)]', s.text)">
      <slot name="pageInfo">{{ pageInfo ?? `Page ${page} of ${pageCount}` }}</slot>
    </span>
    <template v-else>
      <template v-for="(p, i) in list" :key="p === null ? `gap-${i}` : p">
        <span v-if="p === null" aria-hidden="true" :class="cn('font-medium text-[var(--color-foren-text-tertiary)]', s.text)">&hellip;</span>
        <button
          v-else
          type="button"
          :aria-current="p === page ? 'page' : undefined"
          :aria-label="`Page ${p}`"
          :style="controlStyle"
          :class="pageClass(p === page)"
          @click="p !== page && emit('update:page', p)"
        >
          {{ p }}
        </button>
      </template>
    </template>
    <button type="button" :disabled="!canNext" aria-label="Next page" :style="controlStyle" :class="navClass(!canNext)" @click="next">
      <RiArrowRightSLine aria-hidden="true" :style="iconStyle" />
    </button>
  </div>
</template>
