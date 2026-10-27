<script setup lang="ts">
// Pick an image from this device. It never leaves the browser in the prototype.
import { ref } from "vue";
import { RiImageAddLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import FieldError from "./FieldError.vue";
import { ink, muted } from "./shared";

const MAX_IMAGE_MB = 5;

defineProps<{ id: string; label: string; hint: string; shape: "logo" | "cover" }>();
const value = defineModel<string | null>({ required: true });
const error = ref<string>();

function pick(file?: File) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return (error.value = "Choose an image file");
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return (error.value = `Use an image under ${MAX_IMAGE_MB} MB`);
  error.value = undefined;
  value.value = URL.createObjectURL(file);
}
</script>

<template>
  <div>
    <p :class="cn('mb-2 text-[14px] font-medium', ink)">{{ label }}</p>
    <label
      :for="id"
      class="flex h-16 cursor-pointer items-center gap-3 rounded-[16px] border border-dashed border-[#d8d6d5] bg-white px-3 transition-colors hover:border-[#2f2d2b] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2f2d2b]/30"
    >
      <span :class="cn('grid shrink-0 place-items-center overflow-hidden bg-[#f6f5f2]', shape === 'logo' ? 'size-10 rounded-full' : 'h-10 w-14 rounded-[8px]')">
        <img v-if="value" :src="value" alt="" class="size-full object-cover" />
        <RiImageAddLine v-else class="size-5 text-[#95908b]" aria-hidden="true" />
      </span>
      <span class="min-w-0">
        <span :class="cn('block truncate text-[13px] font-semibold', ink)">{{ value ? "Change" : "Upload" }}</span>
        <span :class="cn('block truncate text-[12px]', muted)">{{ hint }}</span>
      </span>
      <input
        :id="id"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        class="sr-only"
        @change="pick(($event.target as HTMLInputElement).files?.[0])"
      />
    </label>
    <button
      v-if="value"
      type="button"
      class="mt-1 px-1 text-[12px] font-medium text-[#6b6661] underline underline-offset-2 hover:text-[#2f2d2b]"
      @click="value = null"
    >
      Remove
    </button>
    <FieldError v-if="error">{{ error }}</FieldError>
  </div>
</template>
