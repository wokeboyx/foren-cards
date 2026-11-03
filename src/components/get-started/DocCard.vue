<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from "vue";
import { RiQuestionLine } from "@/components/icons";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenFileItem from "@/components/ui/ForenFileItem.vue";
import ForenFileUpload from "@/components/ui/ForenFileUpload.vue";
import type { Requirement } from "@/domain/onboarding";
import { cn } from "@/lib/utils";
import { useOnboardingStore, type UploadedDoc } from "@/stores/onboarding";
import { fmtSize, MAX_KB, ACCEPT } from "./documents";
import Note from "./Note.vue";

const props = defineProps<{
  req: Requirement;
  doc?: UploadedDoc;
  showError: boolean;
  locked: boolean;
}>();
const s = useOnboardingStore();
const alts = ref(false);
const uploading = ref<{ name: string; kb: number; progress: number } | null>(
  null,
);
const error = ref<string | null>(null);
const altId = useId();
const titleId = useId();
let timer: number | undefined;
onBeforeUnmount(() => window.clearInterval(timer));

function onFiles(files: FileList) {
  const f = files[0];
  error.value = null;
  const kb = f.size / 1024;
  if (!/\.(pdf|jpe?g|png)$/i.test(f.name))
    return (error.value = "Use a PDF, JPG or PNG file.");
  if (kb > MAX_KB)
    return (error.value = `That file is ${fmtSize(kb)}. The limit is 10 MB.`);
  // Prototype: fake a short upload so the progress state is visible.
  uploading.value = { name: f.name, kb, progress: 10 };
  let p = 10;
  timer = window.setInterval(() => {
    p += 30;
    if (p >= 100) {
      window.clearInterval(timer);
      uploading.value = null;
      s.setDocument(props.req.id, {
        fileName: f.name,
        sizeKb: Math.round(kb),
        status: "uploaded",
      });
    } else if (uploading.value)
      uploading.value = { ...uploading.value, progress: p };
  }, 220);
}

const attention = computed(() => props.doc?.status === "needs_attention");
const remove = () => s.setDocument(props.req.id, null);
</script>

<template>
  <section
    :aria-labelledby="titleId"
    :class="
      cn(
        'overflow-hidden rounded-[16px] bg-surface',
        (showError || attention) && 'ring-1 ring-error/30',
      )
    "
  >
    <div class="flex flex-col gap-4 px-4 py-4">
      <div class="flex flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2">
          <h2
            :id="titleId"
            class="text-[14px] leading-[21px] font-medium text-fg"
          >
            {{ req.title }}
          </h2>
          <ForenBadge v-if="req.optional" size="sm">Optional</ForenBadge>
          <ForenBadge
            v-if="doc?.status === 'in_review'"
            size="sm"
            color="orange"
            >In review</ForenBadge
          >
          <ForenBadge
            v-if="doc?.status === 'accepted'"
            size="sm"
            color="success"
            >Accepted</ForenBadge
          >
        </div>
        <p class="text-[12px] leading-[18px] font-medium text-fg-3">
          {{ req.description }}
        </p>
        <span
          v-if="req.because"
          class="mt-1 w-fit rounded-full bg-info-subtle px-2 py-0.5 text-[11px] leading-[16px] font-semibold text-info"
          >{{ req.because }}</span
        >
      </div>

      <Note v-if="attention && doc?.note" intent="error">{{ doc.note }}</Note>

      <ForenFileItem
        v-if="uploading"
        state="uploading"
        :file-name="uploading.name"
        :file-size="`${fmtSize(uploading.kb)} · Uploading`"
        :progress="uploading.progress"
      />
      <ForenFileItem
        v-else-if="doc && !attention"
        :state="doc.status === 'accepted' ? 'success' : 'ready'"
        :file-name="doc.fileName"
        :file-size="fmtSize(doc.sizeKb)"
        :on-remove="locked ? undefined : remove"
      />
      <div v-else class="flex flex-col gap-1.5">
        <ForenFileUpload
          variant="compact"
          :accept="ACCEPT"
          :placeholder="attention ? 'Choose a new file…' : 'Choose file…'"
          :error="error ?? (showError ? 'Upload this document' : undefined)"
          :aria-label="`Upload ${req.title}`"
          class="[&>div:first-child]:border-line [&>div:first-child]:bg-subtle"
          @files="onFiles"
        />
        <p
          v-if="!error && !showError"
          class="text-[12px] leading-[18px] font-medium text-fg-3"
        >
          Max 10 MB per file. PDF, JPG or PNG.
        </p>
      </div>
    </div>

    <div v-if="req.accepted" class="bg-sunken px-4 py-3">
      <p
        class="flex items-center gap-1.5 text-[12px] leading-[18px] font-medium text-fg-2"
      >
        <RiQuestionLine class="size-3.5" aria-hidden="true" />
        Don’t have this document?
        <button
          type="button"
          :aria-expanded="alts"
          :aria-controls="altId"
          class="font-semibold text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
          @click="alts = !alts"
        >
          {{ alts ? "Hide alternatives" : "View alternatives" }}
        </button>
      </p>
      <div v-if="alts" :id="altId" class="mt-2">
        <p class="mb-1 text-[12px] leading-[18px] font-medium text-fg-3">
          We accept any one of these:
        </p>
        <ul
          class="list-disc space-y-1 pl-5 text-[12px] leading-[18px] font-medium text-fg-2"
        >
          <li v-for="a in req.accepted" :key="a">{{ a }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>
