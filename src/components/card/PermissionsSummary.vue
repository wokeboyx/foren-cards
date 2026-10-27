<script setup lang="ts">
import { computed } from "vue";
import { CATEGORY_LABEL, MODE } from "@/domain/labels";
import type { Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { cn } from "@/lib/utils";
import { permissionSentence } from "./funding-path";

const props = defineProps<{ card: Pick<Card, "permissions" | "lockedMerchantId"> }>();

const rowCls = "grid grid-cols-[120px_1fr] gap-3 py-2 text-[13px] leading-[18px] sm:grid-cols-[150px_1fr]";
const merchantNames = (ids: string[]) => ids.map((id) => merchantById(id)?.name ?? id);

const rows = computed(() => {
  const p = props.card.permissions;
  const locked = !!props.card.lockedMerchantId;
  const out: { label: string; items: string[]; tone: "allow" | "block" }[] = [];
  if (p.mode === "merchants" && !locked) out.push({ label: "Allowed merchants", items: merchantNames(p.allowedMerchantIds), tone: "allow" });
  if (p.mode === "categories" && !locked) out.push({ label: "Allowed categories", items: p.allowedCategories.map((c) => CATEGORY_LABEL[c]), tone: "allow" });
  out.push({ label: "Blocked categories", items: p.blockedCategories.map((c) => CATEGORY_LABEL[c]), tone: "block" });
  out.push({ label: "Blocked merchants", items: merchantNames(p.blockedMerchantIds), tone: "block" });
  return out;
});
</script>

<template>
  <div>
    <p class="mb-1 text-[14px] text-fg">{{ permissionSentence(card) }}</p>
    <dl class="divide-y divide-line">
      <div :class="rowCls">
        <dt class="text-fg-3">Mode</dt>
        <dd class="text-fg">{{ card.lockedMerchantId ? "Locked to one merchant" : MODE[card.permissions.mode] }}</dd>
      </div>
      <div v-for="r in rows" :key="r.label" :class="rowCls">
        <dt class="text-fg-3">{{ r.label }}</dt>
        <dd class="text-fg">
          <div v-if="r.items.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="x in r.items"
              :key="x"
              :class="cn('inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium', r.tone === 'allow' ? 'bg-success-subtle text-success' : 'bg-error-subtle text-error')"
            >
              {{ r.tone === "block" ? "Blocked · " : "" }}{{ x }}
            </span>
          </div>
          <span v-else class="text-fg-3">None</span>
        </dd>
      </div>
    </dl>
  </div>
</template>
