<script setup lang="ts">
/**
 * A single uploaded/uploading file row. Four states — ready, uploading
 * (with a real Progress bar), success, error. Pair with `ForenFileUpload`.
 */
import { computed, type HTMLAttributes } from "vue";
import {
  RiCheckboxCircleLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiFileLine,
  RiRefreshLine,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import ForenProgress from "./ForenProgress.vue";
import {
  extensionOf,
  FILE_TYPE_ICON,
  fileItemVariants,
  type FileItemState,
} from "./foren-file-item";

const props = withDefaults(
  defineProps<{
    state?: FileItemState;
    /** File name shown as the primary label. */
    fileName: string;
    /** Secondary meta line — size, status text, or error message. */
    fileSize?: string;
    /** 0–100. Shown as a progress bar when `state="uploading"`. */
    progress?: number;
    /** Renders a remove (X) button when a `@remove` listener is set. */
    onRemove?: () => void;
    /** Renders a retry button in the error state when a `@retry` listener is set. */
    onRetry?: () => void;
    class?: HTMLAttributes["class"];
  }>(),
  { state: "ready", progress: 0 },
);
/** `icon` slot: custom leading icon (defaults to a file glyph). */
defineSlots<{ icon?(): unknown }>();

const entry = computed(() => FILE_TYPE_ICON[extensionOf(props.fileName)]);
const metaColor = computed(() =>
  props.state === "success"
    ? "text-[var(--color-foren-success)]"
    : props.state === "error"
      ? "text-[var(--color-foren-error)]"
      : "text-[var(--color-foren-text-tertiary)]",
);
</script>

<template>
  <div :class="cn(fileItemVariants({ state }), props.class)">
    <!-- File-type logo -->
    <span
      class="shrink-0 size-9 rounded-xl bg-[var(--color-foren-bg-default)] flex items-center justify-center"
      aria-hidden="true"
    >
      <slot name="icon">
        <component :is="entry.Icon" v-if="entry" size="20" :class="entry.fg" />
        <RiFileLine
          v-else
          width="20"
          height="20"
          class="text-[var(--color-foren-text-secondary)]"
        />
      </slot>
    </span>
    <!-- Info -->
    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <p
        class="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)] truncate"
      >
        {{ fileName }}
      </p>
      <template v-if="state === 'uploading'">
        <p
          v-if="fileSize"
          class="text-[12px] leading-[18px] font-medium text-[var(--color-foren-text-tertiary)] truncate"
        >
          {{ fileSize }}
        </p>
        <ForenProgress size="sm" :value="progress" hide-value class="mt-0.5" />
      </template>
      <p
        v-else-if="fileSize"
        :class="
          cn('text-[12px] leading-[18px] font-medium truncate', metaColor)
        "
      >
        {{ fileSize }}
      </p>
    </div>
    <!-- Trailing status + actions -->
    <div class="shrink-0 flex items-center gap-1.5">
      <span
        v-if="state === 'success'"
        class="text-[var(--color-foren-success)]"
        aria-hidden="true"
      >
        <RiCheckboxCircleLine width="18" height="18" />
      </span>
      <span
        v-if="state === 'error'"
        class="text-[var(--color-foren-error)]"
        aria-hidden="true"
      >
        <RiErrorWarningLine width="18" height="18" />
      </span>
      <button
        v-if="state === 'error' && onRetry"
        type="button"
        :aria-label="`Retry upload of ${fileName}`"
        class="size-5 flex items-center justify-center rounded-[10px] text-[var(--color-foren-text-secondary)] hover:bg-[var(--color-foren-bg-button-secondary-active)] transition-colors"
        @click="onRetry()"
      >
        <RiRefreshLine width="14" height="14" />
      </button>
      <button
        v-if="onRemove"
        type="button"
        :aria-label="`Remove ${fileName}`"
        class="size-5 flex items-center justify-center rounded-[10px] text-[var(--color-foren-text-tertiary)] hover:bg-[var(--color-foren-bg-button-secondary-active)] hover:text-[var(--color-foren-text-primary)] transition-colors"
        @click="onRemove()"
      >
        <RiCloseLine width="14" height="14" />
      </button>
    </div>
  </div>
</template>
