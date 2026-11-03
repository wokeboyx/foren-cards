<script setup lang="ts">
import FieldError from "./FieldError.vue";
import FieldLabel from "./FieldLabel.vue";
import { inputCls } from "./shared";

defineProps<{
  id: string;
  label: string;
  placeholder: string;
  error?: string;
}>();
const value = defineModel<string>({ required: true });
</script>

<template>
  <div>
    <FieldLabel :html-for="id">{{ label }}</FieldLabel>
    <input
      :id="id"
      v-model="value"
      :placeholder="placeholder"
      :aria-invalid="!!error"
      :class="inputCls"
    />
    <FieldError v-if="error">{{ error }}</FieldError>
  </div>
</template>
