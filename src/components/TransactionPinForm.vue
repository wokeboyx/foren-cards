<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { cn } from "@/lib/utils";

/** Prototype rule: any 4 digits work except this one, which shows the wrong-PIN state. */
const WRONG_PIN = "0000";
const LENGTH = 4;

const props = defineProps<{ action: string; onConfirm: () => Promise<boolean> }>();
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
  if (e.key === "Backspace" && !digits.value[i] && i > 0) inputs.value[i - 1]?.focus();
}

function onPaste(e: ClipboardEvent) {
  const p = (e.clipboardData?.getData("text") ?? "").replace(/\D/g, "").slice(0, LENGTH);
  if (!p) return;
  e.preventDefault();
  digits.value = Array.from({ length: LENGTH }, (_, j) => p[j] ?? "");
  inputs.value[Math.min(p.length, LENGTH - 1)]?.focus();
}

async function submit() {
  if (pin.value.length < LENGTH) return void (error.value = "Enter all 4 digits.");
  if (pin.value === WRONG_PIN) {
    digits.value = Array(LENGTH).fill("");
    inputs.value[0]?.focus();
    return void (error.value = "That PIN isn’t right. Try again.");
  }
  busy.value = true;
  const ok = await props.onConfirm();
  busy.value = false;
  if (!ok) error.value = "We couldn’t approve this. Try again.";
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="submit">
    <fieldset>
      <legend class="sr-only">Transaction PIN</legend>
      <div class="flex gap-3">
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
              'tnum h-14 w-14 rounded-[16px] bg-subtle text-center text-[22px] font-semibold text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus',
              error && 'ring-2 ring-error'
            )
          "
          @input="set(i, $event)"
          @keydown="onKeydown(i, $event)"
          @paste="onPaste"
        />
      </div>
      <p :role="error ? 'alert' : undefined" :class="cn('mt-2 min-h-[18px] text-[13px]', error ? 'text-error' : 'text-fg-3')">
        {{ error ?? "Test PIN: any 4 digits except 0000." }}
      </p>
    </fieldset>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <ForenButton type="button" variant="secondary" size="sm" :disabled="busy" @click="emit('cancel')">Cancel</ForenButton>
      <ForenButton type="submit" size="sm" :disabled="busy || pin.length < LENGTH">{{ busy ? "Approving…" : action }}</ForenButton>
    </div>
  </form>
</template>
