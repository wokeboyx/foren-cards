<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import { uploadRequirements } from "@/domain/onboarding";
import {
  useOnboardingStore,
  useRequirementContext,
  type UploadedDoc,
} from "@/stores/onboarding";
import DocCard from "./DocCard.vue";
import Note from "./Note.vue";
import SetupColumn from "./SetupColumn.vue";
import SetupHeader from "./SetupHeader.vue";

const ctx = useRequirementContext();
const s = useOnboardingStore();
const router = useRouter();
const tried = ref(false);

const reqs = computed(() => (ctx.value ? uploadRequirements(ctx.value) : []));
const required = computed(() => reqs.value.filter((r) => !r.optional));
const missing = computed(() =>
  required.value.filter(
    (r) => !s.documents[r.id] || s.documents[r.id].status === "needs_attention",
  ),
);
const fresh = computed(() =>
  reqs.value.filter((r) => s.documents[r.id]?.status === "uploaded"),
);
const resubmitting = computed(() => s.documentsSubmitted);
const canSubmit = computed(
  () =>
    missing.value.length === 0 &&
    (!resubmitting.value || fresh.value.length > 0),
);

function submit() {
  tried.value = true;
  if (missing.value.length) return;
  const wasSubmitted = resubmitting.value;
  const documents: Record<string, UploadedDoc> = { ...s.documents };
  for (const r of reqs.value)
    if (documents[r.id]?.status === "uploaded")
      documents[r.id] = {
        ...documents[r.id],
        status: "in_review",
        note: undefined,
      };
  s.set({ documents, documentsSubmitted: true });
  toast.success(
    wasSubmitted ? "Updated documents sent" : "Documents submitted",
    {
      description: "We check them for common issues before compliance review.",
    },
  );
  router.push("/get-started");
}
</script>

<template>
  <SetupColumn v-if="!ctx || !s.signedUpAt">
    <SetupHeader
      back="/get-started"
      title="Business document verification"
      description="Finish sign-up first."
    />
  </SetupColumn>
  <SetupColumn v-else>
    <SetupHeader
      back="/get-started"
      title="Business document verification"
      description="Upload the documents below. We’ll check them for common issues before compliance review."
    />
    <p class="sr-only" aria-live="polite">
      {{ required.length - missing.length }} of {{ required.length }} required
      documents uploaded
    </p>
    <ul class="flex flex-col gap-4">
      <li v-for="r in reqs" :key="r.id">
        <DocCard
          :req="r"
          :doc="s.documents[r.id]"
          :show-error="tried && missing.includes(r)"
          :locked="
            resubmitting &&
            s.documents[r.id]?.status !== 'needs_attention' &&
            s.documents[r.id]?.status !== 'uploaded'
          "
        />
      </li>
    </ul>
    <Note v-if="tried && missing.length > 0" intent="error" class="mt-6">
      Upload
      {{
        missing.length === 1
          ? `“${missing[0].title}”`
          : `the ${missing.length} documents marked above`
      }}
      to continue.
    </Note>
    <ForenButton
      size="md"
      class="mt-6 w-full"
      :disabled="resubmitting && !canSubmit"
      @click="submit"
    >
      {{ resubmitting ? "Send updated documents" : "Submit documents" }}
    </ForenButton>
  </SetupColumn>
</template>
