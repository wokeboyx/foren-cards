<script setup lang="ts">
/** Renders questions from domain/questionnaires.ts. Each field's id is `q-<question id>`, for focusing the first error. */
import ForenCheckbox from "@/components/ui/ForenCheckbox.vue";
import ForenRadio from "@/components/ui/ForenRadio.vue";
import ForenRadioGroup from "@/components/ui/ForenRadioGroup.vue";
import type { Answers, Question } from "@/domain/questionnaires";
import { cn } from "@/lib/utils";
import Field from "./Field.vue";
import { fieldCls } from "./frame";

const props = defineProps<{
  questions: Question[];
  answers: Answers;
  errorFor: (q: Question) => string | undefined;
}>();
const emit = defineEmits<{ change: [patch: Answers] }>();

const textareaCls =
  "min-h-[96px] w-full resize-y rounded-[16px] border border-line bg-subtle p-3 text-[14px] leading-[21px] font-medium text-fg outline-none placeholder:text-fg-3 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20";

const valueOf = (q: Question) => props.answers[q.id] ?? "";
const labelOf = (q: Question) => (q.optional ? `${q.label} (optional)` : q.label);
const listOf = (q: Question) => (valueOf(q) ? valueOf(q).split(",") : []);
function toggle(q: Question, o: string) {
  const list = listOf(q);
  emit("change", { [q.id]: (list.includes(o) ? list.filter((x) => x !== o) : [...list, o]).join(",") });
}
const onInput = (q: Question, e: Event) => emit("change", { [q.id]: (e.target as HTMLInputElement | HTMLTextAreaElement).value });
</script>

<template>
  <template v-for="q in questions" :key="q.id">
    <fieldset v-if="q.type === 'choice' || q.type === 'multi'" class="flex flex-col gap-2" :aria-invalid="!!errorFor(q)">
      <legend class="text-[14px] leading-[21px] font-medium text-fg">{{ labelOf(q) }}</legend>
      <p v-if="q.description" class="-mt-1 text-[12px] leading-[18px] font-medium text-fg-2">{{ q.description }}</p>
      <ForenRadioGroup
        v-if="q.type === 'choice'"
        :model-value="valueOf(q)"
        :class="cn('mt-1', (q.options?.length ?? 0) <= 2 && 'flex-row gap-6')"
        :aria-label="q.label"
        @update:model-value="(v: string) => emit('change', { [q.id]: v })"
      >
        <ForenRadio v-for="(o, i) in q.options" :key="o" :id="i === 0 ? `q-${q.id}` : undefined" :value="o" :label="o" />
      </ForenRadioGroup>
      <div v-else class="mt-1 flex flex-wrap gap-x-5 gap-y-3">
        <ForenCheckbox
          v-for="(o, i) in q.options"
          :key="o"
          :id="i === 0 ? `q-${q.id}` : undefined"
          :model-value="listOf(q).includes(o)"
          :label="o"
          @update:model-value="toggle(q, o)"
        />
      </div>
      <p v-if="errorFor(q)" role="alert" class="text-[12px] leading-[18px] font-medium text-error">{{ errorFor(q) }}</p>
    </fieldset>

    <Field v-else :label="labelOf(q)" :description="q.description" :html-for="`q-${q.id}`" :error="errorFor(q)">
      <textarea
        v-if="q.type === 'long'"
        :id="`q-${q.id}`"
        :class="textareaCls"
        :value="valueOf(q)"
        :aria-invalid="!!errorFor(q)"
        @input="onInput(q, $event)"
      />
      <input v-else :id="`q-${q.id}`" :class="fieldCls" :value="valueOf(q)" :aria-invalid="!!errorFor(q)" @input="onInput(q, $event)" />
    </Field>
  </template>
</template>
