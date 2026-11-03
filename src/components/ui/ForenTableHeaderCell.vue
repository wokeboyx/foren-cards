<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { RiExpandUpDownLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import ForenCheckbox from "./ForenCheckbox.vue";
import type { Checked } from "./foren-checkbox";
import { cssSize, type ForenTableAlign } from "./foren-table";

const props = withDefaults(
  defineProps<{
    label?: string;
    align?: ForenTableAlign;
    /** Show the expand-up-down sort affordance and make the label a button. */
    sortable?: boolean;
    /** Current sort state. Drives aria-sort and the icon tint. */
    sortDirection?: "asc" | "desc" | null;
    /** Leading select-all checkbox. */
    checkbox?: boolean;
    /** Select-all state (`v-model`). */
    modelValue?: Checked;
    width?: number | string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    align: "left",
    sortable: false,
    sortDirection: null,
    checkbox: false,
    modelValue: undefined,
  },
);
const emit = defineEmits<{ sort: []; "update:modelValue": [next: Checked] }>();
/** Default slot is used as the label when `label` isn't set. */
defineSlots<{ default?(): unknown }>();
</script>

<template>
  <th
    scope="col"
    :aria-sort="
      sortable
        ? sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : 'none'
        : undefined
    "
    :style="width != null ? { width: cssSize(width) } : undefined"
    :class="cn('h-11 px-4 align-middle font-normal', props.class)"
  >
    <div
      :class="
        cn(
          'flex items-center gap-1',
          align === 'right' ? 'justify-end' : 'justify-start',
        )
      "
    >
      <ForenCheckbox
        v-if="checkbox"
        size="sm"
        :model-value="modelValue"
        aria-label="Select all rows"
        class="mr-1"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <button
        v-if="sortable"
        type="button"
        class="group/sort inline-flex cursor-pointer items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)]"
        @click="emit('sort')"
      >
        <span
          class="text-[12px] font-semibold leading-[18px] tracking-[0.01em] whitespace-nowrap text-[var(--color-foren-text-tertiary)] uppercase"
        >
          <template v-if="label">{{ label }}</template
          ><slot v-else />
        </span>
        <RiExpandUpDownLine
          aria-hidden="true"
          :class="
            cn(
              'size-3 shrink-0 transition-colors',
              sortDirection
                ? 'text-[var(--color-foren-text-primary)]'
                : 'text-[var(--color-foren-text-tertiary)] group-hover/sort:text-[var(--color-foren-text-secondary)]',
            )
          "
        />
      </button>
      <span
        v-else
        class="text-[12px] font-semibold leading-[18px] tracking-[0.01em] whitespace-nowrap text-[var(--color-foren-text-tertiary)] uppercase"
      >
        <template v-if="label">{{ label }}</template
        ><slot v-else />
      </span>
    </div>
  </th>
</template>
