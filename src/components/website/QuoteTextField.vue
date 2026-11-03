<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import FieldError from "./FieldError.vue";
import FieldLabel from "./FieldLabel.vue";
import { inputCls } from "./shared";

const props = defineProps<{
  id: string;
  label: string;
  error?: boolean;
  autocomplete?: string;
  class?: HTMLAttributes["class"];
}>();
const value = defineModel<string>({ required: true });
</script>

<template>
  <div :class="props.class">
    <FieldLabel :html-for="id">{{ label }}</FieldLabel>
    <input
      :id="id"
      v-model="value"
      :autocomplete="autocomplete"
      :aria-invalid="error"
      :class="inputCls"
    />
    <FieldError v-if="error">Enter your {{ label.toLowerCase() }}</FieldError>
  </div>
</template>
