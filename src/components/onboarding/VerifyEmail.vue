<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { RiRefreshLine } from "@/components/icons";
import { toast } from "vue-sonner";
import { useSignupGuard } from "@/composables/useSignupGuard";
import { useOnboardingStore } from "@/stores/onboarding";
import { cn } from "@/lib/utils";
import CheckingOverlay from "./CheckingOverlay.vue";
import OnboardingFrame from "./OnboardingFrame.vue";
import { maskEmail } from "./verify-email";

const LENGTH = 6;
const RESEND_AFTER = 30;

const router = useRouter();
const ok = useSignupGuard("/onboarding/verify-email");
const store = useOnboardingStore();
const digits = ref<string[]>(Array(LENGTH).fill(""));
const error = ref<string | null>(null);
const checking = ref(false);
const wait = ref(RESEND_AFTER);
const refs: (HTMLInputElement | null)[] = [];
const focusAt = (i: number) => refs[i]?.focus();

let tick: ReturnType<typeof setTimeout> | undefined;
watch(
  wait,
  (w) => {
    clearTimeout(tick);
    if (w > 0) tick = setTimeout(() => wait.value--, 1000);
  },
  { immediate: true },
);
// autofocus only applies on page load; focus the first digit when the screen mounts.
onMounted(() => focusAt(0));
let verifyTimer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => {
  clearTimeout(tick);
  clearTimeout(verifyTimer);
});

function verify(code: string) {
  checking.value = true;
  error.value = null;
  verifyTimer = setTimeout(() => {
    if (code === "000000") {
      checking.value = false;
      error.value =
        "That code isn’t right. Check the latest email we sent, or resend the code.";
      digits.value = Array(LENGTH).fill("");
      // Inputs are disabled while checking; focus once they're enabled again.
      setTimeout(() => focusAt(0));
      return;
    }
    store.set({ emailVerified: true });
    toast.success("Email has been confirmed", {
      description: "Your email has been verified successfully.",
    });
    router.push("/onboarding/identity");
  }, 1200);
}

function update(next: string[], focus?: number) {
  digits.value = next;
  error.value = null;
  if (focus !== undefined) focusAt(Math.min(focus, LENGTH - 1));
  if (next.every((d) => d)) verify(next.join(""));
}

function onInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement;
  const only = el.value.replace(/\D/g, "");
  if (!only) {
    el.value = "";
    return update(digits.value.map((d, j) => (j === i ? "" : d)));
  }
  // Typing or autofill can deliver several digits at once: spread them forward.
  const next = [...digits.value];
  let k = i;
  for (const ch of only) {
    if (k >= LENGTH) break;
    next[k++] = ch;
  }
  el.value = next[i];
  update(next, k);
}

function onKeyDown(i: number, e: KeyboardEvent) {
  if (e.key === "Backspace" && !digits.value[i] && i > 0) {
    e.preventDefault();
    update(
      digits.value.map((d, j) => (j === i - 1 ? "" : d)),
      i - 1,
    );
  } else if (e.key === "ArrowLeft" && i > 0) focusAt(i - 1);
  else if (e.key === "ArrowRight" && i < LENGTH - 1) focusAt(i + 1);
}

function onPaste(e: ClipboardEvent) {
  const text = (e.clipboardData?.getData("text") ?? "")
    .replace(/\D/g, "")
    .slice(0, LENGTH);
  if (!text) return;
  e.preventDefault();
  const next = Array(LENGTH)
    .fill("")
    .map((_, j) => text[j] ?? "");
  update(next, text.length);
}

function resend() {
  wait.value = RESEND_AFTER;
  toast(`We sent a new code to ${maskEmail(store.email)}`);
}
</script>

<template>
  <OnboardingFrame
    v-if="ok"
    step="account"
    back="/onboarding/account"
    title="Enter the verification code we sent to your email"
  >
    <template #description>
      We sent a code to
      <span class="font-semibold text-fg">{{ maskEmail(store.email) }}</span
      >. This keeps your account secure by checking it’s really you.
    </template>
    <div
      class="flex flex-col items-center gap-6 rounded-[24px] bg-surface px-4 py-6"
    >
      <fieldset class="flex flex-col items-center gap-3">
        <legend
          class="mb-3 text-center text-[14px] leading-[21px] font-medium text-fg"
        >
          Verification code
        </legend>
        <div class="flex gap-2" @paste="onPaste">
          <input
            v-for="(d, i) in digits"
            :key="i"
            :ref="(el) => (refs[i] = el as HTMLInputElement | null)"
            :value="d"
            inputmode="numeric"
            :autocomplete="i === 0 ? 'one-time-code' : 'off'"
            :maxlength="LENGTH"
            :disabled="checking"
            :aria-label="`Digit ${i + 1} of ${LENGTH}`"
            :aria-invalid="!!error || undefined"
            :class="
              cn(
                'size-11 rounded-[12px] border bg-subtle text-center text-[20px] font-semibold text-fg tabular-nums outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20 sm:size-12',
                error ? 'border-error' : 'border-line',
              )
            "
            @input="onInput(i, $event)"
            @keydown="onKeyDown(i, $event)"
            @focus="($event.target as HTMLInputElement).select()"
          />
        </div>
      </fieldset>
      <p
        :role="error ? 'alert' : undefined"
        :class="
          cn(
            'text-center text-[12px] leading-[18px] font-medium',
            error ? 'text-error' : 'text-fg-2',
          )
        "
      >
        {{ error ?? "Didn’t get it? Check spam, or resend below." }}
      </p>
      <button
        type="button"
        :disabled="wait > 0 || checking"
        class="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--color-foren-bg-button-secondary)] px-3 text-[12px] leading-[18px] font-medium text-fg-2 outline-none hover:bg-[var(--color-foren-bg-button-secondary-hover)] focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:text-fg-3"
        @click="resend"
      >
        <RiRefreshLine class="size-3.5" aria-hidden="true" />
        {{ wait > 0 ? `Resend code (${wait}s)` : "Resend code" }}
      </button>
      <p class="text-[11px] leading-4 text-fg-3">
        Prototype: any 6 digits work. 000000 shows the error.
      </p>
    </div>
    <CheckingOverlay v-if="checking" label="Checking your code" />
  </OnboardingFrame>
</template>
