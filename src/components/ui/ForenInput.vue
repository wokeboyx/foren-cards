<script setup lang="ts">
// Text field. v-model binds the value; any other attribute (type, placeholder, maxlength,
// inputmode, autocomplete, class…) goes on the <input> itself.
import { computed, useAttrs, useId } from "vue";
import { cn } from "@/lib/utils";
import { fieldVariants, inputIconColor, inputVariants, type ForenInputProps } from "./foren-input";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ForenInputProps>(), { size: "md", disabled: false });
const model = defineModel<string | number>();
const slots = defineSlots<{ label?(): unknown; description?(): unknown; leadingIcon?(): unknown; trailingIcon?(): unknown }>();
const attrs = useAttrs();

const autoId = useId();
const id = computed(() => props.id ?? autoId);
const status = computed(() => (props.error ? "error" : props.success ? "success" : "default"));
const messageId = computed(() => `${id.value}-msg`);
const message = computed(() => {
  for (const m of [props.error, props.success]) if (m) return typeof m === "string" ? m : undefined;
  return props.description;
});
const hasMessage = computed(() => !!message.value || (!props.error && !props.success && !!slots.description));
const messageColor = computed(() =>
  props.error ? "text-[var(--color-foren-error,#c62828)]" : props.success ? "text-[var(--color-foren-success)]" : "text-[var(--color-foren-text-tertiary)]"
);
const inputAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.class;
  return rest;
});
</script>

<template>
  <div :class="cn('flex flex-col gap-2 w-full', containerClassName)">
    <label
      v-if="label || slots.label"
      :for="id"
      class="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-[var(--color-foren-text-primary)]"
    >
      <slot name="label">{{ label }}</slot>
    </label>
    <div :class="cn(fieldVariants({ size, status, disabled: !!disabled }))">
      <span v-if="slots.leadingIcon" :class="cn(inputIconColor, 'inline-flex')"><slot name="leadingIcon" /></span>
      <input
        :id="id"
        v-model="model"
        :disabled="!!disabled"
        :aria-invalid="!!error"
        :aria-describedby="hasMessage ? messageId : undefined"
        :class="cn(inputVariants({ size }), attrs.class as string | undefined)"
        v-bind="inputAttrs"
      />
      <span v-if="slots.trailingIcon" :class="cn(inputIconColor, 'inline-flex')"><slot name="trailingIcon" /></span>
    </div>
    <p v-if="hasMessage" :id="messageId" :class="cn('text-[12px] leading-[16px] tracking-[0.01em]', messageColor)">
      <template v-if="message">{{ message }}</template>
      <slot v-else name="description" />
    </p>
  </div>
</template>
