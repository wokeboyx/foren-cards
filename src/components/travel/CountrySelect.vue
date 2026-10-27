<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from "reka-ui";
import { RiArrowDownSLine, RiCheckLine } from "@/components/icons";
import CurrencyFlag from "@/components/CurrencyFlag.vue";
import { CURRENCY_NAME } from "@/domain/money";
import { COUNTRIES } from "@/fixtures/countries";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{ modelValue: string; label?: string }>(), { label: "Where are you going?" });
const emit = defineEmits<{ "update:modelValue": [code: string] }>();
const open = ref(false);
const id = useId();
const c = computed(() => COUNTRIES.find((x) => x.code === props.modelValue)!);

function pick(code: string) {
  emit("update:modelValue", code);
  open.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span :id="id" class="text-[14px] font-medium text-fg">{{ label }}</span>
    <PopoverRoot v-model:open="open">
      <PopoverTrigger
        role="combobox"
        :aria-labelledby="id"
        :aria-expanded="open"
        class="relative flex h-14 w-full items-center gap-3 rounded-[16px] bg-subtle pr-10 pl-3 text-left text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <CurrencyFlag :currency="c.currency" :size="28" />
        <span class="min-w-0 flex-1 truncate">
          <span class="font-medium text-fg">{{ c.name }}</span> <span class="text-fg-3">· pays in {{ c.currency }}</span>
        </span>
        <RiArrowDownSLine :class="cn('absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-fg-3 transition-transform', open && 'rotate-180')" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          align="start"
          :side-offset="6"
          class="z-[90] w-[var(--reka-popover-trigger-width)] rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
        >
          <div role="listbox" :aria-labelledby="id" class="max-h-[320px] overflow-y-auto">
            <button
              v-for="x in COUNTRIES"
              :key="x.code"
              type="button"
              role="option"
              :aria-selected="x.code === modelValue"
              :class="cn('flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left outline-none hover:bg-subtle focus-visible:bg-subtle', x.code === modelValue && 'bg-subtle')"
              @click="pick(x.code)"
            >
              <CurrencyFlag :currency="x.currency" :size="24" />
              <span class="flex-1">
                <span class="block text-[14px] font-medium text-fg">{{ x.name }}</span>
                <span class="block text-[12px] text-fg-3">{{ CURRENCY_NAME[x.currency] }} ({{ x.currency }})</span>
              </span>
              <RiCheckLine v-if="x.code === modelValue" class="size-[18px] text-success" aria-hidden="true" />
            </button>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>
