<script setup lang="ts">
import { computed } from "vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import MerchantLogo from "@/components/MerchantLogo.vue";
import { COPY } from "@/content/copy";
import { VERDICT_LABEL, type CompatResult } from "@/domain/compatibility";
import { CATEGORY_LABEL } from "@/domain/labels";
import type { Card, Merchant } from "@/domain/types";
import { cn } from "@/lib/utils";
import { VERDICT_STYLE } from "./merchant-checker";

const props = defineProps<{
  merchant: Merchant;
  result: CompatResult;
  alternatives: Card[];
  /** When set (`@fix`), shows the button that applies the suggested rule change. */
  onFix?: () => void;
}>();
const v = computed(() => VERDICT_STYLE[props.result.verdict]);
const rules = computed(() => props.result.card);
</script>

<template>
  <div class="overflow-hidden rounded-[20px] ring-1 ring-line" aria-live="polite">
    <div :class="cn('flex items-center gap-3 px-4 py-3.5', v.cls)">
      <span class="[&_svg]:size-6" aria-hidden="true"><component :is="v.icon" /></span>
      <div class="min-w-0 flex-1">
        <div class="text-[16px] leading-[22px] font-semibold">{{ VERDICT_LABEL[result.verdict] }}</div>
        <div class="truncate text-[13px] opacity-90">at {{ merchant.name }}</div>
      </div>
      <MerchantLogo :merchant="merchant" :size="32" />
    </div>
    <dl class="divide-y divide-line bg-surface">
      <div class="px-4 py-3">
        <dt class="flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-fg-3 uppercase">
          Merchant and network
          <span :class="cn('rounded-full px-2 py-px text-[11px] font-semibold tracking-normal normal-case', VERDICT_STYLE[result.network.verdict].cls)">
            {{ VERDICT_LABEL[result.network.verdict] }}
          </span>
        </dt>
        <dd class="mt-1 text-[14px] leading-[21px] text-fg">{{ result.network.detail }}</dd>
        <ol v-if="result.network.steps" class="mt-2 list-decimal space-y-1 pl-5 text-[14px] leading-[21px] text-fg">
          <li v-for="s in result.network.steps" :key="s">{{ s }}</li>
        </ol>
      </div>
      <div class="px-4 py-3">
        <dt class="flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-fg-3 uppercase">
          This card’s rules
          <span :class="cn('rounded-full px-2 py-px text-[11px] font-semibold tracking-normal normal-case', rules.ok ? 'bg-success-subtle text-success' : 'bg-error-subtle text-error')">
            {{ rules.ok ? "Allowed" : "Blocked" }}
          </span>
        </dt>
        <dd class="mt-1 text-[14px] leading-[21px] text-fg">
          <template v-if="rules.ok">{{ rules.detail }}</template>
          <template v-else><span class="font-semibold">{{ rules.rule }}.</span> {{ rules.detail }}</template>
        </dd>
        <ForenButton v-if="!rules.ok && onFix" size="xs" variant="secondary" class="mt-2" @click="onFix">
          {{
            rules.fix === "allow_merchant" ? `Allow ${merchant.name} on this card` : rules.fix === "allow_category" ? `Allow ${CATEGORY_LABEL[merchant.category]}` : "Unfreeze card"
          }}
        </ForenButton>
        <p v-if="!rules.ok && !onFix && rules.fix" class="mt-1 text-[13px] text-fg-3">Ask the account owner to change this rule.</p>
      </div>
      <div v-if="result.verdict === 'wont_work'" class="px-4 py-3">
        <dt class="text-[12px] font-semibold tracking-[0.04em] text-fg-3 uppercase">What you can do instead</dt>
        <dd class="mt-1 text-[14px] leading-[21px] text-fg">
          <template v-if="alternatives.length">
            Try
            <span v-for="(c, i) in alternatives.slice(0, 2)" :key="c.id"
              >{{ i > 0 ? " or " : "" }}<span class="font-semibold">{{ c.nickname }} •• {{ c.last4 }}</span></span
            >, which {{ alternatives.length > 1 ? "aren’t" : "isn’t" }} blocked here. Or use another payment method.
          </template>
          <template v-else>Use another payment method for this merchant.</template>
        </dd>
      </div>
      <p v-if="result.verdict === 'works' || result.verdict === 'likely'" class="px-4 py-2.5 text-[12px] leading-[16px] text-fg-3">
        Based on past payments. This isn’t a guarantee — the merchant or network can still decline.
      </p>
      <p v-if="result.verdict === 'no_history'" class="px-4 py-2.5 text-[12px] leading-[16px] text-fg-3">{{ COPY.merchantUnknown }}. We can’t promise this payment will succeed.</p>
    </dl>
  </div>
</template>
