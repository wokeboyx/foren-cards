<script setup lang="ts">
import { computed, ref } from "vue";
import { RiAddLine, RiCloseLine, RiShieldLine } from "@/components/icons";
import ForenTag from "@/components/ui/ForenTag.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { CATEGORY_LABEL, DEFAULT_BLOCKED_CATEGORIES } from "@/domain/labels";
import type { Category, PermissionConfig, PermissionMode } from "@/domain/types";
import ChoiceCard from "./ChoiceCard.vue";
import MerchantPicker from "./MerchantPicker.vue";
import MerchantScope from "./MerchantScope.vue";

const model = defineModel<PermissionConfig>({ required: true });
defineProps<{ error?: string }>();

const ALLOWABLE: Category[] = ["software", "travel", "advertising", "office", "food", "transport", "utilities", "entertainment"];

const RISK: Partial<Record<Category, string>> = {
  gambling: "Gambling payments are a common sign of misuse and are hard to dispute.",
  cash_atm: "Cash withdrawals can’t be traced to a merchant or receipt.",
  crypto: "Crypto purchases are usually irreversible and can’t be disputed.",
};

const WHERE: { mode: PermissionMode; title: string; body: string }[] = [
  { mode: "anywhere", title: "Anywhere", body: "Any merchant, except the categories and merchants you block below." },
  { mode: "merchants", title: "Only merchants I choose", body: "Pick the merchants it can pay. Everyone else is declined." },
  { mode: "categories", title: "Only certain categories", body: "For example software or travel. Other categories are declined." },
];

const set = (patch: Partial<PermissionConfig>) => (model.value = { ...model.value, ...patch });
const removing = ref<Category | null>(null);

const toggleCategory = (c: Category) =>
  set({ allowedCategories: model.value.allowedCategories.includes(c) ? model.value.allowedCategories.filter((x) => x !== c) : [...model.value.allowedCategories, c] });

const locked = computed(() => model.value.mode === "first_merchant");
const before = ref<PermissionMode>(locked.value ? "anywhere" : model.value.mode);

const scope = computed({
  get: () => (locked.value ? "one" : "many") as "one" | "many",
  set: (v) => {
    if (v === "one" && !locked.value) before.value = model.value.mode;
    set({ mode: v === "one" ? "first_merchant" : before.value });
  },
});

const removingOpen = computed({
  get: () => !!removing.value,
  set: (o) => {
    if (!o) removing.value = null;
  },
});

function confirmRemove() {
  const r = removing.value;
  if (r) set({ blockedCategories: model.value.blockedCategories.filter((x) => x !== r) });
  removing.value = null;
}
</script>

<template>
  <div class="space-y-5">
    <MerchantScope v-model="scope" />
    <div v-if="!locked">
      <fieldset>
        <legend id="mode-label" class="mb-2 text-[14px] font-medium text-fg">Which merchants can it pay?</legend>
        <div class="grid gap-2">
          <ChoiceCard
            v-for="o in WHERE"
            :key="o.mode"
            name="where"
            :value="o.mode"
            :checked="model.mode === o.mode"
            :title="o.title"
            :description="o.body"
            @change="set({ mode: o.mode })"
          />
        </div>
      </fieldset>
    </div>

    <div v-if="model.mode === 'merchants'">
      <div class="mb-2 text-[14px] font-medium text-fg">Approved merchants</div>
      <MerchantPicker
        :selected="model.allowedMerchantIds"
        placeholder="Search merchants to allow"
        @add="(id) => set({ allowedMerchantIds: [...model.allowedMerchantIds, id] })"
        @remove="(id) => set({ allowedMerchantIds: model.allowedMerchantIds.filter((x) => x !== id) })"
      />
    </div>

    <fieldset v-if="model.mode === 'categories'">
      <legend class="mb-2 text-[14px] font-medium text-fg">Allowed categories</legend>
      <div class="flex flex-wrap gap-2">
        <ForenTag
          v-for="c in ALLOWABLE"
          :key="c"
          size="xs"
          :selected="model.allowedCategories.includes(c)"
          :aria-pressed="model.allowedCategories.includes(c)"
          type="button"
          @click="toggleCategory(c)"
        >
          {{ CATEGORY_LABEL[c] }}
        </ForenTag>
      </div>
    </fieldset>

    <p v-if="error" role="alert" class="text-[13px] text-error">{{ error }}</p>

    <div class="rounded-[16px] border border-line p-4">
      <div class="flex items-center gap-2 text-[14px] font-medium text-fg">
        <RiShieldLine class="size-[18px] text-fg-2" aria-hidden="true" />
        Blocked categories
      </div>
      <p class="mt-1 mb-3 text-[13px] text-fg-2">Foren suggests blocking these on every card. They apply in every mode.</p>
      <ul class="flex flex-wrap gap-2">
        <li v-for="c in DEFAULT_BLOCKED_CATEGORIES" :key="c">
          <span v-if="model.blockedCategories.includes(c)" class="inline-flex h-8 items-center gap-1 rounded-full bg-error-subtle pr-1 pl-3 text-[12px] font-semibold text-error">
            Blocked · {{ CATEGORY_LABEL[c] }}
            <button
              type="button"
              class="grid size-6 place-items-center rounded-full outline-none hover:bg-[var(--color-foren-bg-error-subtle-hover)] focus-visible:ring-2 focus-visible:ring-focus"
              :aria-label="`Remove protection: ${CATEGORY_LABEL[c]}`"
              @click="removing = c"
            >
              <RiCloseLine class="size-3.5" aria-hidden="true" />
            </button>
          </span>
          <button
            v-else
            type="button"
            class="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-line px-3 text-[12px] font-semibold text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
            @click="set({ blockedCategories: [...model.blockedCategories, c] })"
          >
            <RiAddLine class="size-3.5" aria-hidden="true" />
            Block {{ CATEGORY_LABEL[c] }} again
          </button>
        </li>
      </ul>
      <div class="mt-4">
        <div class="mb-2 text-[13px] font-medium text-fg">Blocked merchants</div>
        <MerchantPicker
          tone="block"
          :selected="model.blockedMerchantIds"
          placeholder="Search a merchant to block"
          @add="(id) => set({ blockedMerchantIds: [...model.blockedMerchantIds, id] })"
          @remove="(id) => set({ blockedMerchantIds: model.blockedMerchantIds.filter((x) => x !== id) })"
        />
      </div>
    </div>

    <ConfirmDialog
      v-model:open="removingOpen"
      :title="removing ? `Allow ${CATEGORY_LABEL[removing]} payments?` : ''"
      confirm-label="Remove protection"
      destructive
      @confirm="confirmRemove"
    >
      <template #consequence>
        <template v-if="removing">
          {{ RISK[removing] }} Removing this protection lets this card pay {{ CATEGORY_LABEL[removing].toLowerCase() }} merchants. You can block it again at any time.
        </template>
      </template>
    </ConfirmDialog>
  </div>
</template>
