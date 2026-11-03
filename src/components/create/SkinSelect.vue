<script setup lang="ts">
/** Card colour as a dropdown: the six Foren Mobile skins, each with a round swatch. Sits on the same row as the card's nickname. */
import { ref, useId } from "vue";
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import { RiArrowDownSLine, RiCheckLine } from "@/components/icons";
import { DESIGNS, skinBackground } from "@/components/card/designs";
import { DESIGN_LABEL } from "@/domain/labels";
import type { CardDesign } from "@/domain/types";
import { cn } from "@/lib/utils";

defineProps<{ label?: string; accessibleName: string }>();
const model = defineModel<CardDesign>({ required: true });
const designs = Object.keys(DESIGNS) as CardDesign[];
const open = ref(false);
const listId = useId();

function pick(d: CardDesign) {
  model.value = d;
  open.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span
      v-if="label"
      aria-hidden="true"
      class="text-[14px] leading-[21px] font-medium text-fg"
      >{{ label }}</span
    >
    <PopoverRoot v-model:open="open">
      <PopoverTrigger
        role="combobox"
        :aria-label="accessibleName"
        :aria-expanded="open"
        :aria-controls="listId"
        class="relative flex h-12 w-full min-w-[150px] items-center gap-2.5 rounded-[16px] border border-transparent bg-subtle pr-9 pl-3 text-left text-[14px] outline-none focus-visible:border-focus focus-visible:bg-surface"
      >
        <span
          class="size-6 shrink-0 rounded-full ring-1 ring-line"
          :style="{ background: skinBackground(model) }"
          aria-hidden="true"
        />
        <span class="min-w-0 flex-1 truncate font-medium text-fg">{{
          DESIGN_LABEL[model]
        }}</span>
        <RiArrowDownSLine
          :class="
            cn(
              'absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-3 transition-transform',
              open && 'rotate-180',
            )
          "
          aria-hidden="true"
        />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          align="end"
          :side-offset="6"
          class="z-[80] w-[200px] rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
        >
          <div :id="listId" role="listbox" :aria-label="accessibleName">
            <button
              v-for="d in designs"
              :key="d"
              type="button"
              role="option"
              :aria-selected="d === model"
              :class="
                cn(
                  'flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left outline-none hover:bg-subtle focus-visible:bg-subtle',
                  d === model && 'bg-subtle',
                )
              "
              @click="pick(d)"
            >
              <span
                class="size-7 shrink-0 rounded-full ring-1 ring-line"
                :style="{ background: skinBackground(d) }"
                aria-hidden="true"
              />
              <span class="flex-1 text-[14px] font-medium text-fg">{{
                DESIGN_LABEL[d]
              }}</span>
              <RiCheckLine
                v-if="d === model"
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
