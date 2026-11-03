<script setup lang="ts">
// One table cell. `type` picks one of the 13 Figma cell types (text is the composable base), or
// "custom" to render the default slot. Content props that took React nodes are named slots here
// with a plain-text prop of the same name as the fallback (label, description, value, currency,
// date, time, count); icons are slots only (leadingIcon, trailingIcon, icon).
import { computed, useSlots, type HTMLAttributes } from "vue";
import {
  RiArrowRightDownLine,
  RiArrowRightUpLine,
  RiCalendarLine,
  RiSubtractLine,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import ForenAvatar from "./ForenAvatar.vue";
import ForenAvatarGroup from "./ForenAvatarGroup.vue";
import ForenBadge from "./ForenBadge.vue";
import ForenButton from "./ForenButton.vue";
import ForenCheckbox from "./ForenCheckbox.vue";
import ForenProgress from "./ForenProgress.vue";
import ForenTag from "./ForenTag.vue";
import ForenToggle from "./ForenToggle.vue";
import type { BadgeColor } from "./foren-badge";
import type { Checked } from "./foren-checkbox";
import { tagVariants } from "./foren-tag";
import {
  CELL_SUB,
  CELL_TITLE,
  cssSize,
  FIXED_WIDTH,
  inferDirection,
  type ForenTableAlign,
  type ForenTableCellBadge,
  type ForenTableCellType,
  type ForenTablePerson,
} from "./foren-table";

const props = withDefaults(
  defineProps<{
    type?: ForenTableCellType;
    align?: ForenTableAlign;
    width?: number | string;
    colSpan?: number;
    class?: HTMLAttributes["class"];
    /** text, badge, tag, link, button: the main text. toggle, checkbox, icon: the accessible label. */
    label?: string | number;
    /** text: second line, 12px tertiary. */
    description?: string;
    /** text: inline badge after the label. */
    badge?: ForenTableCellBadge;
    /** text: row-selection checkbox ahead of the content. */
    checkbox?: boolean;
    /** text, checkbox, toggle: checked state (`v-model`). */
    modelValue?: Checked;
    /** toggle: uncontrolled initial state. */
    defaultChecked?: boolean;
    /** text: leading avatar. Pass initials or an image src. */
    avatar?: ForenTablePerson;
    /** badge */
    color?: BadgeColor;
    dot?: boolean;
    /** tag, avatar: overflow count after the chip/stack, e.g. "+2". */
    count?: string | number;
    /** tag */
    selected?: boolean;
    /** tag, link, button, icon: makes the cell content actionable. */
    onClick?: (e: MouseEvent) => void;
    /** progress (number), trend, amount (text). */
    value?: number | string;
    /** progress */
    max?: number;
    /** progress: show the numeric value above the bar. Off in the Figma spec. */
    showValue?: boolean;
    /** progress */
    barWidth?: number | string;
    /** trend: inferred from a leading +/- on a string value when omitted. */
    direction?: "up" | "down" | "flat";
    /** amount: second line — currency code or unit. */
    currency?: string;
    /** date */
    date?: string;
    /** date: second line. */
    time?: string;
    /** date: calendar glyph ahead of the date. Default true. */
    showIcon?: boolean;
    /** link */
    href?: string;
    /** button, toggle, checkbox */
    disabled?: boolean;
    /** avatar */
    people?: ForenTablePerson[];
  }>(),
  {
    align: "left",
    modelValue: undefined,
    defaultChecked: undefined,
    dot: undefined,
    max: undefined,
    showValue: false,
    barWidth: 140,
    showIcon: true,
  },
);
const emit = defineEmits<{ "update:modelValue": [next: Checked] }>();
defineSlots<{
  default?(): unknown;
  label?(): unknown;
  description?(): unknown;
  value?(): unknown;
  currency?(): unknown;
  date?(): unknown;
  time?(): unknown;
  count?(): unknown;
  leadingIcon?(): unknown;
  trailingIcon?(): unknown;
  icon?(): unknown;
}>();
const slots = useSlots();

const type = computed<ForenTableCellType>(() => props.type ?? "text");
const centered = computed(
  () =>
    type.value === "checkbox" ||
    type.value === "icon" ||
    type.value === "toggle",
);
const resolvedWidth = computed(() => props.width ?? FIXED_WIDTH[type.value]);
const gap = computed(() => {
  switch (type.value) {
    case "badge":
    case "progress":
    case "link":
    case "button":
    case "toggle":
    case "checkbox":
    case "icon":
      return "gap-0";
    case "trend":
      return "gap-1";
    default:
      return "gap-2";
  }
});

const tagPadding = computed(() =>
  slots.leadingIcon ? "leading" : "symmetric",
);
const trendDir = computed(() => props.direction ?? inferDirection(props.value));
const TrendIcon = computed(() =>
  trendDir.value === "up"
    ? RiArrowRightUpLine
    : trendDir.value === "down"
      ? RiArrowRightDownLine
      : RiSubtractLine,
);
const trendTint = computed(() =>
  trendDir.value === "up"
    ? "text-[var(--color-foren-success)]"
    : trendDir.value === "down"
      ? "text-[var(--color-foren-error)]"
      : "text-[var(--color-foren-text-tertiary)]",
);
const hasCount = computed(() => props.count != null || !!slots.count);
const internalLink = computed(() => !!props.href && props.href.startsWith("/"));
const onModel = (next: Checked) => emit("update:modelValue", next);
const ICON_SLOT =
  "grid size-4 shrink-0 place-items-center text-[var(--color-foren-text-tertiary)] [&_svg]:size-4";
const LINK_CLASS =
  "text-[14px] font-semibold leading-[21px] tracking-[0.0125em] text-[var(--color-foren-text-primary)] underline-offset-[3px] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)]";
</script>

<template>
  <td
    :colspan="colSpan"
    :style="
      resolvedWidth != null ? { width: cssSize(resolvedWidth) } : undefined
    "
    :class="cn('h-16 align-middle', centered ? 'px-0' : 'px-4', props.class)"
  >
    <div
      :class="
        cn(
          'flex items-center',
          gap,
          centered
            ? 'justify-center'
            : align === 'right'
              ? 'justify-end'
              : 'justify-start',
        )
      "
    >
      <template v-if="type === 'badge'">
        <ForenBadge :color="color ?? 'success'" size="sm" :dot="dot ?? true">
          <template v-if="$slots.leadingIcon" #leadingIcon
            ><slot name="leadingIcon"
          /></template>
          <slot name="label">{{ label }}</slot>
        </ForenBadge>
      </template>

      <template v-else-if="type === 'tag'">
        <ForenTag
          v-if="onClick"
          size="xs"
          :selected="selected"
          @click="onClick"
        >
          <template v-if="$slots.leadingIcon" #leadingIcon
            ><slot name="leadingIcon"
          /></template>
          <slot name="label">{{ label }}</slot>
        </ForenTag>
        <!-- Read-only chip. ForenTag renders a <button>, and a button that does nothing is worse than
             a span — so borrow its variants and keep the label in the accessibility tree. -->
        <span
          v-else
          :class="
            cn(
              tagVariants({
                size: 'xs',
                padding: tagPadding,
                state: selected ? 'selected' : 'unselected',
              }),
              'cursor-default active:scale-100',
            )
          "
        >
          <slot name="leadingIcon" />
          <slot name="label">{{ label }}</slot>
        </span>
        <span v-if="hasCount" :class="cn(CELL_SUB, 'shrink-0')"
          ><slot name="count">{{ count }}</slot></span
        >
      </template>

      <template v-else-if="type === 'progress'">
        <ForenProgress
          size="sm"
          :value="Number(value ?? 0)"
          :max="max ?? 100"
          :hide-value="!showValue"
          class="shrink-0"
          :style="{ width: cssSize(barWidth) }"
        />
      </template>

      <template v-else-if="type === 'trend'">
        <component
          :is="TrendIcon"
          aria-hidden="true"
          :class="cn('size-3.5 shrink-0', trendTint)"
        />
        <span
          :class="
            cn(
              'text-[14px] font-medium leading-[21px] tracking-[0.01em] tabular-nums',
              trendTint,
            )
          "
          ><slot name="value">{{ value }}</slot></span
        >
      </template>

      <template v-else-if="type === 'amount'">
        <span v-if="$slots.leadingIcon" :class="ICON_SLOT"
          ><slot name="leadingIcon"
        /></span>
        <span class="flex min-w-0 flex-col gap-0.5">
          <span :class="cn(CELL_TITLE, 'tabular-nums')"
            ><slot name="value">{{ value }}</slot></span
          >
          <span v-if="currency != null || $slots.currency" :class="CELL_SUB"
            ><slot name="currency">{{ currency }}</slot></span
          >
        </span>
        <span v-if="$slots.trailingIcon" :class="ICON_SLOT"
          ><slot name="trailingIcon"
        /></span>
      </template>

      <template v-else-if="type === 'date'">
        <span v-if="showIcon" :class="ICON_SLOT"
          ><RiCalendarLine aria-hidden="true"
        /></span>
        <span class="flex min-w-0 flex-col gap-0.5">
          <span :class="cn(CELL_TITLE, 'whitespace-nowrap')"
            ><slot name="date">{{ date }}</slot></span
          >
          <span
            v-if="time != null || $slots.time"
            :class="cn(CELL_SUB, 'tabular-nums')"
            ><slot name="time">{{ time }}</slot></span
          >
        </span>
        <span v-if="$slots.trailingIcon" :class="ICON_SLOT"
          ><slot name="trailingIcon"
        /></span>
      </template>

      <template v-else-if="type === 'link'">
        <!-- An href has to produce a real anchor — middle-click and "open in new tab" are the whole
             point of a link cell. Without one, fall back to the button's link variant. -->
        <RouterLink
          v-if="internalLink"
          :to="href!"
          :class="LINK_CLASS"
          @click="onClick?.($event)"
          ><slot name="label">{{ label }}</slot></RouterLink
        >
        <a
          v-else-if="href"
          :href="href"
          :class="LINK_CLASS"
          @click="onClick?.($event)"
          ><slot name="label">{{ label }}</slot></a
        >
        <ForenButton v-else variant="link" size="sm" @click="onClick?.($event)"
          ><slot name="label">{{ label }}</slot></ForenButton
        >
      </template>

      <template v-else-if="type === 'button'">
        <ForenButton
          variant="outline"
          size="xs"
          :disabled="disabled"
          @click="onClick?.($event)"
        >
          <template v-if="$slots.leadingIcon" #leadingIcon
            ><slot name="leadingIcon"
          /></template>
          <slot name="label">{{ label }}</slot>
        </ForenButton>
      </template>

      <template v-else-if="type === 'avatar'">
        <!-- overlap is a fraction of avatar size, not pixels — 1/3 of 24px reproduces the design's 8px tuck. -->
        <ForenAvatarGroup
          size="xs"
          :max="max ?? 3"
          :overlap="1 / 3"
          class="shrink-0"
        >
          <ForenAvatar
            v-for="(p, i) in people ?? []"
            :key="i"
            size="xs"
            :initials="p.initials"
            :src="p.src"
            :name="p.name"
          />
        </ForenAvatarGroup>
        <span v-if="hasCount" :class="cn(CELL_SUB, 'shrink-0')"
          ><slot name="count">{{ count }}</slot></span
        >
      </template>

      <template v-else-if="type === 'toggle'">
        <ForenToggle
          size="sm"
          :model-value="
            modelValue === undefined ? undefined : modelValue === true
          "
          :default-checked="defaultChecked"
          :disabled="disabled"
          :aria-label="label != null ? String(label) : undefined"
          @update:model-value="onModel"
        />
      </template>

      <template v-else-if="type === 'checkbox'">
        <ForenCheckbox
          size="sm"
          :model-value="modelValue"
          :disabled="disabled"
          :aria-label="label != null ? String(label) : undefined"
          @update:model-value="onModel"
        />
      </template>

      <template v-else-if="type === 'icon'">
        <button
          v-if="onClick"
          type="button"
          :aria-label="label != null ? String(label) : 'Row actions'"
          class="grid size-8 cursor-pointer place-items-center rounded-md text-[var(--color-foren-text-tertiary)] outline-none transition-colors hover:bg-[var(--color-foren-bg-subtle)] hover:text-[var(--color-foren-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foren-bg-default)] [&_svg]:size-4"
          @click="onClick"
        >
          <slot name="icon" />
        </button>
        <span
          v-else
          aria-hidden="true"
          class="grid size-4 place-items-center text-[var(--color-foren-text-tertiary)] [&_svg]:size-4"
          ><slot name="icon"
        /></span>
      </template>

      <template v-else-if="type === 'custom'">
        <slot />
      </template>

      <!-- text — the composable base -->
      <template v-else>
        <ForenCheckbox
          v-if="checkbox"
          size="sm"
          :model-value="modelValue"
          aria-label="Select row"
          class="shrink-0"
          @update:model-value="onModel"
        />
        <ForenAvatar
          v-if="avatar"
          size="xs"
          :initials="avatar.initials"
          :src="avatar.src"
          :name="avatar.name"
          class="shrink-0"
        />
        <span v-if="$slots.leadingIcon" :class="ICON_SLOT"
          ><slot name="leadingIcon"
        /></span>
        <span class="flex min-w-0 flex-col gap-0.5">
          <span class="flex items-center gap-2">
            <span :class="cn(CELL_TITLE, 'truncate')"
              ><slot name="label">{{ label }}</slot></span
            >
            <ForenBadge
              v-if="badge"
              :color="badge.color ?? 'success'"
              size="sm"
              :dot="badge.dot ?? true"
              >{{ badge.label }}</ForenBadge
            >
          </span>
          <span
            v-if="description != null || $slots.description"
            :class="cn(CELL_SUB, 'truncate')"
            ><slot name="description">{{ description }}</slot></span
          >
        </span>
        <span v-if="$slots.trailingIcon" :class="ICON_SLOT"
          ><slot name="trailingIcon"
        /></span>
      </template>
    </div>
  </td>
</template>
