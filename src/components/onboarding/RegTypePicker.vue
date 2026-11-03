<script setup lang="ts">
import RadioCard from "./RadioCard.vue";
import type { RegType } from "./find-business";

defineProps<{ types: RegType[]; modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <fieldset v-if="types.length > 1" class="flex flex-col gap-2">
    <legend class="mb-2 text-[14px] leading-[21px] font-medium text-fg">
      Registration type
    </legend>
    <div class="flex gap-2">
      <RadioCard
        v-for="t in types"
        :key="t.code"
        name="reg-type"
        :value="t.code"
        :checked="modelValue === t.code"
        :label="t.label"
        :hint="t.hint"
        @change="emit('update:modelValue', $event)"
      />
    </div>
  </fieldset>
</template>
