<script setup lang="ts">
import ForenSelect from "@/components/ui/ForenSelect.vue";
/** Receipt, note and category on a charge, so finance can reconcile it. */
import { computed, ref, useTemplateRef, watch } from "vue";
import { RiReceiptLine, RiUploadLine } from "@/components/icons";
import { toast } from "vue-sonner";
import SectionTitle from "@/components/SectionTitle.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { useAction } from "@/composables/useAction";
import { COPY } from "@/content/copy";
import type { Card, ExpenseCategory, Transaction } from "@/domain/types";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { updateTransaction } from "@/services";
import { useAppStore } from "@/stores/app";
import { EXPENSE } from "./transactions-page";

const props = defineProps<{ t: Transaction; card: Card }>();
const store = useAppStore();
const save = useAction(updateTransaction);
const note = ref(props.t.note ?? "");
watch(
  () => props.t.id,
  () => (note.value = props.t.note ?? ""),
);
const fileRef = useTemplateRef<HTMLInputElement>("file");
// The cardholder, the account owner and the finance lead can add expense details.
const canEdit = computed(
  () => store.role === "finance" || can(store.role, "freeze", props.card),
);

async function persist(
  patch: Parameters<typeof updateTransaction>[1],
  ok: string,
) {
  const r = await save.run(props.t.id, patch);
  toast(r.ok ? ok : COPY.saveFailure);
}
function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  if (f)
    persist(
      { receipt: { name: f.name, size: f.size, at: new Date().toISOString() } },
      "Receipt added",
    );
  input.value = "";
}
function onCategory(value: string) {
  persist(
    { expenseCategory: (value || undefined) as ExpenseCategory | undefined },
    "Category saved",
  );
}
const categoryOptions = Object.entries(EXPENSE).map(([value, label]) => ({
  value,
  label,
}));
function onNoteBlur() {
  if (note.value !== (props.t.note ?? ""))
    persist({ note: note.value.trim() || undefined }, "Note saved");
}
</script>

<template>
  <section>
    <SectionTitle class="mb-2">Expense details</SectionTitle>
    <div class="space-y-3 rounded-[16px] bg-subtle p-4">
      <div class="flex items-center gap-3">
        <span
          :class="
            cn(
              'grid size-10 shrink-0 place-items-center rounded-[10px]',
              t.receipt
                ? 'bg-success-subtle text-success'
                : 'bg-warning-subtle text-warning',
            )
          "
          aria-hidden="true"
        >
          <RiReceiptLine class="size-5" />
        </span>
        <div class="min-w-0 flex-1 text-[13px]">
          <template v-if="t.receipt">
            <div class="truncate font-semibold text-fg">
              {{ t.receipt.name }}
            </div>
            <div class="text-fg-3">
              {{ Math.max(1, Math.round(t.receipt.size / 1024)) }} KB · added
              {{
                new Date(t.receipt.at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              }}
            </div>
          </template>
          <template v-else>
            <div class="font-semibold text-fg">Missing receipt</div>
            <div class="text-fg-3">Add a photo or PDF of the receipt.</div>
          </template>
        </div>
        <template v-if="canEdit">
          <input
            ref="file"
            type="file"
            accept="image/*,application/pdf"
            class="sr-only"
            aria-label="Receipt file"
            @change="onFile"
          />
          <ForenButton
            size="xs"
            :variant="t.receipt ? 'ghost' : 'secondary'"
            class="bg-surface"
            @click="fileRef?.click()"
          >
            <template #leadingIcon><RiUploadLine /></template>
            {{ t.receipt ? "Replace" : "Add receipt" }}
          </ForenButton>
        </template>
      </div>
      <div class="flex flex-col gap-1.5">
        <ForenSelect
          :id="`cat-${t.id}`"
          label="Category"
          placeholder="Choose a category"
          :disabled="!canEdit"
          :model-value="t.expenseCategory ?? ''"
          :options="categoryOptions"
          @update:model-value="onCategory"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label :for="`note-${t.id}`" class="text-[13px] font-medium text-fg"
          >Note</label
        >
        <textarea
          :id="`note-${t.id}`"
          v-model="note"
          rows="2"
          maxlength="280"
          :disabled="!canEdit"
          placeholder="What was this for?"
          class="rounded-[12px] bg-surface px-3 py-2 text-[13px] text-fg ring-1 ring-line outline-none focus:ring-2 focus:ring-focus"
          @blur="onNoteBlur"
        />
      </div>
    </div>
  </section>
</template>
