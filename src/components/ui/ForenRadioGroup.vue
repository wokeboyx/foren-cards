<script setup lang="ts">
import { computed, provide, ref, useId, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { RADIO_CTX, type ForenRadioGroupProps } from "./foren-radio";

const props = withDefaults(defineProps<ForenRadioGroupProps & { class?: HTMLAttributes["class"] }>(), {
  modelValue: undefined,
  size: "md",
  disabled: false,
});
const emit = defineEmits<{ "update:modelValue": [next: string] }>();

const autoId = useId();
const internal = ref<string | undefined>(props.defaultValue);
const isControlled = computed(() => props.modelValue !== undefined);

provide(RADIO_CTX, {
  name: computed(() => props.name ?? `radio-${autoId}`),
  value: computed(() => (isControlled.value ? props.modelValue : internal.value)),
  setValue: (next) => {
    if (!isControlled.value) internal.value = next;
    emit("update:modelValue", next);
  },
  disabled: computed(() => props.disabled),
  size: computed(() => props.size),
});
</script>

<template>
  <div role="radiogroup" :aria-label="ariaLabel" :class="cn('flex flex-col gap-3', props.class)">
    <slot />
  </div>
</template>
