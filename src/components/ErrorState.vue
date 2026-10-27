<script setup lang="ts">
/** Load failure with an optional Retry (shown when a `retry` listener is attached). */
import { getCurrentInstance, type HTMLAttributes } from "vue";
import { RiErrorWarningLine } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import { COPY } from "@/content/copy";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{ message?: string; class?: HTMLAttributes["class"] }>(), { message: COPY.genericError });
const emit = defineEmits<{ retry: [] }>();
const canRetry = !!getCurrentInstance()?.vnode.props?.onRetry;
</script>

<template>
  <div role="alert" :class="cn('flex flex-col items-center px-6 py-12 text-center', props.class)">
    <div class="mb-3 grid size-12 place-items-center rounded-full bg-error-subtle text-error">
      <RiErrorWarningLine class="size-6" aria-hidden="true" />
    </div>
    <p class="text-[14px] leading-[22px] font-medium text-fg">{{ message }}</p>
    <ForenButton v-if="canRetry" variant="outline" size="sm" class="mt-4" @click="emit('retry')">Retry</ForenButton>
  </div>
</template>
