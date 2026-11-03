<script setup lang="ts">
import Field from "@/components/onboarding/Field.vue";
import { fieldCls } from "@/components/onboarding/frame";
import { cn } from "@/lib/utils";
import { NATIONALITIES } from "./stakeholders";

defineProps<{ id: string; label: string; error?: string }>();
const model = defineModel<string>({ required: true });
</script>

<template>
  <Field :label="label" :html-for="id" :error="error">
    <select
      :id="id"
      v-model="model"
      :aria-invalid="!!error || undefined"
      :class="cn(fieldCls, !model && 'text-fg-3')"
    >
      <option value="">Choose…</option>
      <option v-for="n in NATIONALITIES" :key="n.code" :value="n.code">
        {{ n.name }}
      </option>
    </select>
  </Field>
</template>
