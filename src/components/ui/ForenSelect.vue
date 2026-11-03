<script setup lang="ts">
/**
 * Single-select Dropdown from the Foren Design System (Figma "Dropdown" + "Drop down list" + "Dropdown Item").
 * `xs` is the 32px pill used for filters and currency pickers; `md` is the 48px field used in forms.
 * The menu is a white 16px card with a muted border and the md shadow; items are 12px-radius rows, the picked
 * one on the subtle fill. It replaces the browser's own <select>.
 */
import { computed, ref, useId } from "vue";
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import { RiArrowDownSLine } from "@/components/icons";
import { cn } from "@/lib/utils";

export type ForenSelectOption = { value: string; label: string };

const props = withDefaults(
  defineProps<{
    options: ForenSelectOption[];
    /** Accessible name when there's no visible label. */
    ariaLabel?: string;
    /** Visible label above the field (md). */
    label?: string;
    placeholder?: string;
    size?: "xs" | "md";
    disabled?: boolean;
    id?: string;
  }>(),
  { size: "md", placeholder: "Select…", disabled: false },
);
const model = defineModel<string>({ default: "" });

const open = ref(false);
const auto = useId();
const triggerId = computed(() => props.id ?? auto);
const listId = useId();
const labelId = useId();
const picked = computed(() =>
  props.options.find((o) => o.value === model.value),
);

function pick(v: string) {
  model.value = v;
  open.value = false;
}
</script>

<template>
  <div :class="cn('flex flex-col gap-2', size === 'xs' ? 'w-auto' : 'w-full')">
    <span
      v-if="label"
      :id="labelId"
      class="text-[14px] leading-[21px] font-medium text-fg"
      >{{ label }}</span
    >
    <PopoverRoot v-model:open="open">
      <PopoverTrigger
        :id="triggerId"
        role="combobox"
        :aria-label="label ? undefined : ariaLabel"
        :aria-labelledby="label ? labelId : undefined"
        :aria-expanded="open"
        :aria-controls="listId"
        :disabled="disabled"
        :class="
          cn(
            'flex items-center overflow-clip text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50',
            size === 'xs'
              ? 'h-8 gap-1.5 rounded-[28px] bg-canvas px-2.5 text-[12px] leading-[21px] tracking-[0.12px] text-fg-2'
              : 'h-12 w-full gap-2 rounded-[16px] bg-subtle px-3 text-[14px] leading-[21px] tracking-[0.14px] text-fg',
          )
        "
      >
        <span
          :class="
            cn(
              'whitespace-nowrap [font-feature-settings:\'calt\'_0]',
              size === 'md' && 'min-w-0 flex-1 truncate',
              !picked && size === 'md' && 'text-fg-3',
            )
          "
          >{{ picked?.label ?? placeholder }}</span
        >
        <RiArrowDownSLine
          :class="
            cn(
              'shrink-0 text-fg-3 transition-transform',
              size === 'xs' ? 'size-3.5' : 'size-4',
              open && 'rotate-180',
            )
          "
          aria-hidden="true"
        />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          align="start"
          :side-offset="6"
          :class="
            cn(
              'z-[80] rounded-[16px] border border-[var(--color-foren-border-muted)] bg-surface p-1 shadow-[0px_4px_8px_-2px_rgba(36,28,21,0.1)] outline-none',
              size === 'md'
                ? 'w-[var(--reka-popover-trigger-width)]'
                : 'min-w-[180px]',
            )
          "
        >
          <div
            :id="listId"
            role="listbox"
            class="max-h-[320px] overflow-y-auto"
          >
            <button
              v-for="o in options"
              :key="o.value"
              type="button"
              role="option"
              :aria-selected="o.value === model"
              :class="
                cn(
                  'flex w-full items-center gap-3 rounded-[12px] p-3 text-left text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg outline-none hover:bg-subtle focus-visible:bg-subtle',
                  o.value === model && 'bg-subtle',
                )
              "
              @click="pick(o.value)"
            >
              {{ o.label }}
            </button>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>
