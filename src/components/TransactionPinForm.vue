<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { cn } from "@/lib/utils";

/** Prototype rule: any 6 digits work except this one, which shows the wrong-PIN state. */
const WRONG_PIN = "000000";
const LENGTH = 6;

const props = defineProps<{
  action: string;
  busyLabel: string;
  failureText: string;
  onConfirm: () => Promise<boolean>;
}>();
const emit = defineEmits<{ cancel: [] }>();

const digits = ref<string[]>(Array(LENGTH).fill(""));
const error = ref<string | null>(null);
const busy = ref(false);
const inputs = ref<(HTMLInputElement | null)[]>([]);
const pin = computed(() => digits.value.join(""));

onMounted(() => inputs.value[0]?.focus());

function set(i: number, e: Event) {
  const el = e.target as HTMLInputElement;
  const d = el.value.replace(/\D/g, "").slice(-1);
  el.value = d;
  error.value = null;
  digits.value = digits.value.map((x, j) => (j === i ? d : x));
  if (d && i < LENGTH - 1) inputs.value[i + 1]?.focus();
}

function onKeydown(i: number, e: KeyboardEvent) {
  if (e.key === "Backspace" && !digits.value[i] && i > 0)
    inputs.value[i - 1]?.focus();
}

function onPaste(e: ClipboardEvent) {
  const p = (e.clipboardData?.getData("text") ?? "")
    .replace(/\D/g, "")
    .slice(0, LENGTH);
  if (!p) return;
  e.preventDefault();
  digits.value = Array.from({ length: LENGTH }, (_, j) => p[j] ?? "");
  inputs.value[Math.min(p.length, LENGTH - 1)]?.focus();
}

async function submit() {
  if (pin.value.length < LENGTH)
    return void (error.value = `Enter all ${LENGTH} digits.`);
  if (pin.value === WRONG_PIN) {
    digits.value = Array(LENGTH).fill("");
    inputs.value[0]?.focus();
    return void (error.value = "That PIN isn’t right. Try again.");
  }
  busy.value = true;
  const ok = await props.onConfirm();
  busy.value = false;
  if (!ok) error.value = props.failureText;
}
</script>

<template>
  <!-- Figma "Approve this request": the label, six 56px boxes, then the footer with Cancel and the action -->
  <form @submit.prevent="submit">
    <fieldset class="flex flex-col items-center gap-4 px-4 py-6">
      <legend class="sr-only">Transaction PIN</legend>
      <span
        class="text-[16px] leading-[24px] font-medium tracking-[0.08px] text-fg"
        aria-hidden="true"
        >Transaction PIN</span
      >
      <div class="flex gap-2">
        <input
          v-for="(d, i) in digits"
          :key="i"
          :ref="(el) => (inputs[i] = el as HTMLInputElement | null)"
          type="password"
          inputmode="numeric"
          autocomplete="off"
          maxlength="1"
          :value="d"
          :aria-label="`PIN digit ${i + 1}`"
          :aria-invalid="!!error || undefined"
          :class="
            cn(
              'tnum size-14 rounded-[16px] border border-[var(--color-foren-border-muted)] bg-subtle text-center text-[26px] leading-[40px] font-semibold tracking-[-0.39px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus',
              error && 'border-error ring-2 ring-error',
            )
          "
          @input="set(i, $event)"
          @keydown="onKeydown(i, $event)"
          @paste="onPaste"
        />
      </div>
      <p
        :role="error ? 'alert' : undefined"
        :class="
          cn(
            'min-h-[18px] text-center text-[13px]',
            error ? 'text-error' : 'text-fg-3',
          )
        "
      >
        {{ error ?? `Test PIN: any ${LENGTH} digits except ${WRONG_PIN}.` }}
      </p>
    </fieldset>
    <!-- Footer, bleeding to the modal's edges like the Figma "Modal Footer" -->
    <div
      class="-mx-4 -mb-4 flex flex-col-reverse gap-3 border-t border-[var(--color-foren-border-muted)] px-6 pt-4 pb-6 sm:flex-row sm:justify-end"
    >
      <ForenButton
        type="button"
        variant="outline"
        size="sm"
        :disabled="busy"
        @click="emit('cancel')"
        >Cancel</ForenButton
      >
      <ForenButton
        type="submit"
        size="sm"
        :disabled="busy || pin.length < LENGTH"
        >{{ busy ? busyLabel : action }}</ForenButton
      >
    </div>
  </form>
</template>
