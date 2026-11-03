<script setup lang="ts">
import { ref, useId } from "vue";
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import { RiArrowDownSLine, RiCheckLine } from "@/components/icons";
import CurrencyFlag from "@/components/CurrencyFlag.vue";
import Money from "@/components/Money.vue";
import type { Balance, Currency } from "@/domain/types";
import { cn } from "@/lib/utils";
import { currencyLabel } from "./currency-select";

/** Currency dropdown with flag, full name + code, and the available balance. */
const props = defineProps<{
  label: string;
  options: Currency[];
  balances: Balance[];
}>();
const model = defineModel<Currency | undefined>();

const open = ref(false);
const labelId = useId();
const listId = useId();
const bal = (c: Currency) =>
  props.balances.find((b) => b.currency === c)?.available;

function pick(c: Currency) {
  model.value = c;
  open.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span :id="labelId" class="text-[14px] font-medium text-fg">{{
      label
    }}</span>
    <PopoverRoot v-model:open="open">
      <PopoverTrigger
        role="combobox"
        :aria-labelledby="labelId"
        :aria-expanded="open"
        :aria-controls="listId"
        class="relative flex h-14 w-full items-center gap-3 rounded-[16px] border border-transparent bg-subtle pr-10 pl-3 text-left text-[14px] outline-none focus-visible:border-focus focus-visible:bg-surface"
      >
        <template v-if="model">
          <CurrencyFlag :currency="model" :size="28" />
          <span class="min-w-0 flex-1 truncate font-medium text-fg">{{
            currencyLabel(model)
          }}</span>
          <Money
            v-if="bal(model)"
            :value="bal(model)!"
            class="tnum shrink-0 text-[13px] text-fg-2"
          />
        </template>
        <span v-else class="text-fg-3">Choose a currency</span>
        <RiArrowDownSLine
          :class="
            cn(
              'absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-fg-3 transition-transform',
              open && 'rotate-180',
            )
          "
          aria-hidden="true"
        />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          align="start"
          :side-offset="6"
          class="z-[80] w-[var(--reka-popover-trigger-width)] rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
        >
          <div
            :id="listId"
            role="listbox"
            :aria-labelledby="labelId"
            class="max-h-[320px] overflow-y-auto"
          >
            <button
              v-for="c in options"
              :key="c"
              type="button"
              role="option"
              :aria-selected="c === model"
              :class="
                cn(
                  'flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left outline-none hover:bg-subtle focus-visible:bg-subtle',
                  c === model && 'bg-subtle',
                )
              "
              @click="pick(c)"
            >
              <CurrencyFlag :currency="c" :size="28" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[14px] font-medium text-fg">{{
                  currencyLabel(c)
                }}</span>
                <span v-if="bal(c)" class="block text-[12px] text-fg-3"
                  >Balance <Money :value="bal(c)!" class="tnum"
                /></span>
              </span>
              <RiCheckLine
                v-if="c === model"
                class="size-[18px] shrink-0 text-success"
                aria-hidden="true"
              />
            </button>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>
