<script setup lang="ts">
import { ref } from "vue";
import ForenInput from "./ForenInput.vue";
import type { ForenInputProps } from "./foren-input";

defineProps<ForenInputProps>();
const model = defineModel<string | number>();
const visible = ref(false);
</script>

<template>
  <ForenInput
    v-bind="$props"
    v-model="model"
    :type="visible ? 'text' : 'password'"
  >
    <template #trailingIcon>
      <button
        type="button"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        :aria-pressed="visible"
        class="pointer-events-auto inline-flex items-center justify-center cursor-pointer text-[var(--color-foren-text-tertiary)] hover:text-[var(--color-foren-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foren-border-focus)] rounded-sm"
        @click="visible = !visible"
      >
        <svg
          v-if="visible"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path
            d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
          />
          <path
            d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
          />
          <path d="M2 2l20 20" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </template>
  </ForenInput>
</template>
