<script setup lang="ts">
/**
 * File upload trigger. `dropzone` is a dashed drag-and-drop area; `compact`
 * is an inline field + browse button. Render selected files with `ForenFileItem`.
 */
import { computed, ref, type HTMLAttributes } from "vue";
import { RiUploadCloud2Line } from "@/components/icons";
import { cn } from "@/lib/utils";
import ForenButton from "./ForenButton.vue";

const props = withDefaults(
  defineProps<{
    /** Layout: full drag-and-drop zone, or a compact inline field. */
    variant?: "dropzone" | "compact";
    /** Dropzone headline. */
    title?: string;
    /** Dropzone helper line — put the size/format limits here. */
    description?: string;
    /** Browse button label. */
    browseLabel?: string;
    /** Compact placeholder shown before a file is chosen. */
    placeholder?: string;
    /** Selected file name — switches compact/dropzone into the "filled" look. */
    fileName?: string;
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    /** Error message. Renders error styling and shows the text below. */
    error?: string;
    /** Force the drag-over visual (used by docs; real drag-over is automatic). */
    forceDragover?: boolean;
    class?: HTMLAttributes["class"];
  }>(),
  {
    variant: "dropzone",
    title: "Drag & drop files here",
    description: "or click to browse. Max 10MB per file.",
    browseLabel: "Browse files",
    placeholder: "Choose file…",
    disabled: false,
    forceDragover: false,
  },
);
/** Emitted with the chosen/dropped files. */
const emit = defineEmits<{ files: [files: FileList] }>();

const input = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const active = computed(() => dragging.value || props.forceDragover);
const borderColor = computed(() =>
  props.error
    ? "border-[var(--color-foren-error)]"
    : active.value
      ? "border-[var(--color-foren-border-strong)]"
      : props.disabled
        ? "border-[var(--color-foren-border-disabled)]"
        : "border-[var(--color-foren-border-muted)]",
);

function openPicker() {
  if (!props.disabled) input.value?.click();
}
function handleFiles(files: FileList | null | undefined) {
  if (files && files.length) emit("files", files);
}
function onDrop(e: DragEvent) {
  e.preventDefault();
  dragging.value = false;
  if (props.disabled) return;
  handleFiles(e.dataTransfer?.files);
}
function onDragOver(e: DragEvent) {
  e.preventDefault();
  if (!props.disabled) dragging.value = true;
}
</script>

<template>
  <div v-if="variant === 'compact'" :class="cn('w-full', props.class)">
    <div
      :class="
        cn(
          'flex items-center gap-3 w-full h-12 pl-4 pr-1.5 rounded-xl border bg-[var(--color-foren-bg-default)] transition-colors',
          borderColor,
          disabled && 'opacity-60',
        )
      "
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="dragging = false"
    >
      <span
        :class="
          cn(
            'flex-1 min-w-0 truncate text-[14px] leading-[21px]',
            fileName
              ? 'text-[var(--color-foren-text-primary)] font-medium'
              : 'text-[var(--color-foren-text-tertiary)]',
          )
        "
      >
        {{ fileName ?? placeholder }}
      </span>
      <ForenButton
        size="xs"
        variant="primary"
        :disabled="disabled"
        @click="openPicker"
      >
        {{ fileName ? "Change" : browseLabel }}
      </ForenButton>
    </div>
    <p
      v-if="error"
      class="mt-1.5 text-[12px] leading-[18px] font-medium text-[var(--color-foren-error)]"
    >
      {{ error }}
    </p>
    <input
      ref="input"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      class="sr-only"
      @change="handleFiles(($event.target as HTMLInputElement).files)"
    />
  </div>
  <div v-else :class="cn('w-full', props.class)">
    <div
      role="button"
      :tabindex="disabled ? -1 : 0"
      :aria-disabled="disabled"
      :class="
        cn(
          'w-full rounded-xl border-2 border-dashed bg-[var(--color-foren-bg-default)] flex flex-col items-center justify-center gap-3 px-6 py-8 text-center transition-colors outline-none',
          'focus-visible:border-[var(--color-foren-border-strong)]',
          borderColor,
          active && 'bg-[var(--color-foren-bg-subtle)]',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )
      "
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="dragging = false"
    >
      <span
        class="size-12 rounded-full bg-[var(--color-foren-bg-subtle)] flex items-center justify-center text-[var(--color-foren-text-secondary)]"
      >
        <RiUploadCloud2Line width="20" height="20" />
      </span>
      <div class="flex flex-col gap-2 items-center">
        <p
          class="text-[14px] leading-[21px] font-semibold tracking-[0.0125em] text-[var(--color-foren-text-primary)]"
        >
          {{ fileName ?? title }}
        </p>
        <p
          class="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-[var(--color-foren-text-tertiary)]"
        >
          {{ description }}
        </p>
      </div>
      <ForenButton
        size="xs"
        variant="primary"
        :disabled="disabled"
        :tabindex="-1"
      >
        {{ browseLabel }}
      </ForenButton>
    </div>
    <p
      v-if="error"
      class="mt-2 text-[12px] leading-[18px] font-medium text-[var(--color-foren-error)]"
    >
      {{ error }}
    </p>
    <input
      ref="input"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      class="sr-only"
      @change="handleFiles(($event.target as HTMLInputElement).files)"
    />
  </div>
</template>
