<script setup lang="ts">
/**
 * One merchant or many. Payments happen at the merchant's checkout, so a one-merchant card can't know
 * the merchant in advance: whoever charges it first becomes the only merchant that can use it.
 */
import { useId } from "vue";
import {
  RiCheckLine,
  RiInformationLine,
  RiLockLine,
  RiStore2Line,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const model = defineModel<"one" | "many">({ required: true });
const name = useId();

const SCOPES = [
  {
    key: "one",
    title: "One merchant",
    line: "Locks to the first merchant that charges it.",
    best: "Best for a subscription or a supplier.",
    pros: [
      "If the details leak, no one else can use them.",
      "Stop one merchant without affecting anything else.",
    ],
    con: "Each other subscription needs its own card.",
  },
  {
    key: "many",
    title: "Many merchants",
    line: "Works wherever you allow: anywhere, selected merchants or categories.",
    best: "Best for travel and day-to-day team spending.",
    pros: ["One card covers many places.", "You choose where it works, below."],
    con: "Freezing it stops every merchant on it at once.",
  },
] as const;
</script>

<template>
  <fieldset>
    <legend class="mb-2 text-[14px] font-medium text-fg">
      How many merchants will use this card?
    </legend>
    <div class="grid gap-2">
      <label
        v-for="o in SCOPES"
        :key="o.key"
        :class="
          cn(
            'relative flex cursor-pointer flex-col rounded-[16px] border bg-surface p-4 transition-[border-color,box-shadow] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus',
            model === o.key
              ? 'border-[var(--color-foren-brand-green)] shadow-[var(--shadow-foren-xs)]'
              : 'border-line hover:bg-sunken',
          )
        "
      >
        <input
          type="radio"
          :name="name"
          :value="o.key"
          :checked="model === o.key"
          class="sr-only"
          @change="model = o.key"
        />
        <span class="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            :class="
              cn(
                'grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]',
                model === o.key
                  ? 'border-[var(--color-foren-brand-green)] bg-[var(--color-foren-brand-green)]'
                  : 'border-line-2 bg-surface',
              )
            "
          >
            <span v-if="model === o.key" class="size-2 rounded-full bg-white" />
          </span>
          <span
            class="flex items-center gap-1.5 text-[14px] font-semibold text-fg"
          >
            <RiLockLine
              v-if="o.key === 'one'"
              class="size-4 text-fg-2"
              aria-hidden="true"
            />
            <RiStore2Line v-else class="size-4 text-fg-2" aria-hidden="true" />
            {{ o.title }}
          </span>
        </span>
        <span class="mt-1.5 text-[13px] leading-[18px] text-fg">{{
          o.line
        }}</span>
        <span class="text-[13px] leading-[18px] text-fg-3">{{ o.best }}</span>
        <ul
          class="mt-2.5 space-y-1 border-t border-line pt-2.5 text-[12px] leading-[17px]"
        >
          <li v-for="p in o.pros" :key="p" class="flex gap-1.5 text-fg-2">
            <RiCheckLine
              class="mt-px size-3.5 shrink-0 text-success"
              aria-hidden="true"
            />
            {{ p }}
          </li>
          <li class="flex gap-1.5 text-fg-2">
            <RiInformationLine
              class="mt-px size-3.5 shrink-0 text-fg-3"
              aria-hidden="true"
            />
            {{ o.con }}
          </li>
        </ul>
      </label>
    </div>
  </fieldset>
</template>
