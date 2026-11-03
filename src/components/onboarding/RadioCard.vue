<script setup lang="ts">
/** Radio card from the Figma "Registration type" row: code on top, hint below, radio top-right, green border when selected. */
import { useId } from "vue";
import { cn } from "@/lib/utils";

defineProps<{
  name: string;
  value: string;
  checked: boolean;
  label: string;
  hint: string;
}>();
const emit = defineEmits<{ change: [value: string] }>();
const id = useId();
</script>

<template>
  <label
    :for="id"
    :class="
      cn(
        'relative flex min-h-[72px] min-w-0 flex-1 cursor-pointer flex-col justify-center gap-1 rounded-[12px] border bg-surface px-3 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus',
        checked
          ? 'border-[var(--color-foren-brand-green)]'
          : 'border-surface hover:border-line',
      )
    "
  >
    <input
      :id="id"
      type="radio"
      :name="name"
      :value="value"
      :checked="checked"
      class="sr-only"
      @change="emit('change', value)"
    />
    <span class="text-[14px] leading-[21px] font-medium text-fg">{{
      label
    }}</span>
    <span class="text-[12px] leading-[18px] font-medium text-fg-3">{{
      hint
    }}</span>
    <span
      aria-hidden="true"
      :class="
        cn(
          'absolute top-3 right-3 grid size-4 place-items-center rounded-full border',
          checked ? 'border-[var(--color-foren-brand-green)]' : 'border-line-2',
        )
      "
    >
      <span
        v-if="checked"
        class="size-2 rounded-full bg-[var(--color-foren-brand-green)]"
      />
    </span>
  </label>
</template>
