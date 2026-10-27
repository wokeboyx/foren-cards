<script setup lang="ts">
import { h, ref } from "vue";
import { RiCloseLine } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenSearch from "@/components/ui/ForenSearch.vue";
import type { ForenSearchResult } from "@/components/ui/foren-search";
import MerchantLogo from "@/components/MerchantLogo.vue";
import { CATEGORY_LABEL } from "@/domain/labels";
import { MERCHANTS, merchantById } from "@/fixtures/merchants";

const props = withDefaults(defineProps<{ selected: string[]; placeholder: string; tone?: "allow" | "block" }>(), { tone: "allow" });
const emit = defineEmits<{ add: [id: string]; remove: [id: string] }>();
const q = ref("");

function search(raw: string): ForenSearchResult[] {
  const s = raw.trim().toLowerCase();
  if (!s) return [];
  return MERCHANTS.filter((m) => !props.selected.includes(m.id) && m.name.toLowerCase().includes(s))
    .slice(0, 6)
    .map((m) => ({ value: m.id, label: m.name, description: CATEGORY_LABEL[m.category], icon: h(MerchantLogo, { merchant: m, size: 28 }) }));
}

function onSelect(r: ForenSearchResult) {
  emit("add", r.value);
  q.value = "";
}
</script>

<template>
  <div>
    <ForenSearch v-model="q" :aria-label="placeholder" :placeholder="placeholder" :on-search="search" @select="onSelect">
      <template #emptyState><span class="text-[13px] text-fg-3">No matching merchants</span></template>
    </ForenSearch>
    <ul v-if="selected.length > 0" class="mt-3 flex flex-wrap gap-2">
      <li
        v-for="id in selected"
        :key="id"
        :class="`inline-flex h-9 items-center gap-2 rounded-full pr-1 pl-1 text-[13px] font-medium ${tone === 'block' ? 'bg-error-subtle text-error' : 'bg-subtle text-fg'}`"
      >
        <MerchantLogo :merchant="merchantById(id)" :size="26" />
        {{ tone === "block" ? "Blocked · " : "" }}{{ merchantById(id)?.name }}
        <ForenButton type="button" variant="ghost" size="xxs" class="h-7 px-1.5" :aria-label="`Remove ${merchantById(id)?.name}`" @click="emit('remove', id)">
          <template #leadingIcon><RiCloseLine /></template>
        </ForenButton>
      </li>
    </ul>
  </div>
</template>
