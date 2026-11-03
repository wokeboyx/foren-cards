<script setup lang="ts">
/** Prototype-only: decide what compliance comes back with. */
import { RiFlaskLine } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import { uploadRequirements } from "@/domain/onboarding";
import { contextOf, useOnboardingStore } from "@/stores/onboarding";

const s = useOnboardingStore();

function approve() {
  const documents = Object.fromEntries(
    Object.entries(s.documents).map(([k, d]) => [
      k,
      { ...d, status: "accepted" as const, note: undefined },
    ]),
  );
  s.set({
    review: "approved",
    documents,
    stakeholders: s.stakeholders.map((p) => ({
      ...p,
      status: "verified" as const,
      note: undefined,
    })),
  });
}
function requestChanges() {
  const ctx = contextOf(s);
  const first = ctx
    ? uploadRequirements(ctx).find((r) => s.documents[r.id])
    : undefined;
  const documents = { ...s.documents };
  if (first)
    documents[first.id] = {
      ...documents[first.id],
      status: "needs_attention",
      note: "This copy isn’t clear enough to read. Upload a sharper scan with all 4 edges visible.",
    };
  s.set({ review: "changes_requested", documents });
}
</script>

<template>
  <div
    class="mt-10 rounded-[16px] border border-dashed border-line-2 px-4 py-3"
  >
    <p
      class="flex items-center gap-1.5 text-[12px] leading-[18px] font-semibold text-fg-3"
    >
      <RiFlaskLine class="size-3.5" aria-hidden="true" />
      Prototype: simulate the compliance review
    </p>
    <div class="mt-2 flex flex-wrap gap-2">
      <ForenButton variant="secondary" size="xxs" @click="approve"
        >Approve account</ForenButton
      >
      <ForenButton variant="secondary" size="xxs" @click="requestChanges"
        >Ask for a change</ForenButton
      >
    </div>
  </div>
</template>
