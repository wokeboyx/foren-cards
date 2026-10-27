<script setup lang="ts">
/** A stand-in for the verification partner's hosted flow (the real one opens in their SDK). */
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { RiCameraLine, RiShieldCheckLine, RiUserSmileLine } from "@/components/icons";
import Modal from "@/components/Modal.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenCheckbox from "@/components/ui/ForenCheckbox.vue";
import ForenSpinner from "@/components/ui/ForenSpinner.vue";
import { countryInfo, idTypes, type CountryCode } from "@/domain/onboarding";
import { useOnboardingStore } from "@/stores/onboarding";
import { cn } from "@/lib/utils";

const props = defineProps<{ open: boolean; country: CountryCode | null }>();
const emit = defineEmits<{ "update:open": [open: boolean]; failed: [] }>();

type PartnerStep = "consent" | "document" | "photo" | "selfie" | "checking";

const router = useRouter();
const store = useOnboardingStore();
const step = ref<PartnerStep>("consent");
const residence = ref<"home" | "other">("home");
const consent = ref(false);
const idType = ref<string | null>(null);
const captured = ref(false);
const name = computed(() => countryInfo(props.country)?.name ?? "your country");

watch(step, (s, _old, onCleanup) => {
  if (s !== "checking") return;
  const t = setTimeout(() => {
    if (store.demo.identity === "retry") return emit("failed");
    store.set({ identityVerified: true });
    emit("update:open", false);
    router.push("/onboarding/identity/confirmed");
  }, 1800);
  onCleanup(() => clearTimeout(t));
});

const titles: Record<PartnerStep, string> = {
  consent: "Confirm your country of residence",
  document: "Choose your ID",
  photo: "Take a photo of your ID",
  selfie: "Take a selfie",
  checking: "Checking your details",
};
const optionCls = (on: boolean) =>
  cn(
    "flex h-12 cursor-pointer items-center justify-between rounded-[12px] border px-3 text-[14px] font-medium text-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
    on ? "border-fg" : "border-line bg-subtle"
  );
</script>

<template>
  <Modal :open="open" :title="titles[step]" class="sm:max-w-[400px]" @update:open="emit('update:open', $event)">
    <div class="flex min-h-[340px] flex-col gap-5">
      <template v-if="step === 'consent'">
        <p class="text-[14px] leading-[21px] text-fg-2">This decides how your personal data is processed.</p>
        <div role="radiogroup" aria-label="Country of residence" class="flex flex-col gap-2">
          <label v-for="v in ['home', 'other'] as const" :key="v" :class="optionCls(residence === v)">
            {{ v === "home" ? name : "Somewhere else" }}
            <input
              type="radio"
              name="residence"
              :checked="residence === v"
              class="size-4 accent-[var(--color-foren-bg-button-primary)]"
              @change="residence = v"
            />
          </label>
        </div>
        <div class="mt-auto border-t border-line pt-4">
          <ForenCheckbox
            :model-value="consent"
            label="I agree to my personal data, including a face scan, being processed to verify my identity."
            @update:model-value="(v) => (consent = v === true)"
          />
        </div>
        <ForenButton size="sm" :disabled="!consent" @click="step = 'document'">Continue</ForenButton>
      </template>

      <template v-if="step === 'document'">
        <p class="text-[14px] leading-[21px] text-fg-2">Use an original, in-date document. No photocopies or screenshots.</p>
        <div role="radiogroup" aria-label="ID type" class="flex flex-col gap-2">
          <label v-for="t in idTypes(country)" :key="t" :class="optionCls(idType === t)">
            {{ t }}
            <input type="radio" name="idtype" :checked="idType === t" class="size-4 accent-[var(--color-foren-bg-button-primary)]" @change="idType = t" />
          </label>
        </div>
        <ForenButton size="sm" class="mt-auto" :disabled="!idType" @click="step = 'photo'">Continue</ForenButton>
      </template>

      <template v-if="step === 'photo'">
        <p class="text-[14px] leading-[21px] text-fg-2">Place your {{ idType?.toLowerCase() }} in the frame with all 4 edges showing.</p>
        <div
          :class="
            cn(
              'grid aspect-[1.6] place-items-center rounded-[16px] border-2 border-dashed text-fg-3',
              captured ? 'border-success bg-success-subtle text-success' : 'border-line-2 bg-subtle'
            )
          "
        >
          <RiShieldCheckLine v-if="captured" class="size-10" aria-label="Photo taken" />
          <RiCameraLine v-else class="size-10" aria-hidden="true" />
        </div>
        <div v-if="captured" class="mt-auto flex gap-2">
          <ForenButton variant="outline" size="sm" class="flex-1" @click="captured = false">Retake</ForenButton>
          <ForenButton size="sm" class="flex-1" @click="step = 'selfie'">Use this photo</ForenButton>
        </div>
        <ForenButton v-else size="sm" class="mt-auto" @click="captured = true">Take photo</ForenButton>
      </template>

      <template v-if="step === 'selfie'">
        <p class="text-[14px] leading-[21px] text-fg-2">Look straight at the camera and slowly turn your head when asked. Good light helps.</p>
        <div class="mx-auto grid size-40 place-items-center rounded-full border-2 border-dashed border-line-2 bg-subtle text-fg-3">
          <RiUserSmileLine class="size-12" aria-hidden="true" />
        </div>
        <ForenButton size="sm" class="mt-auto" @click="step = 'checking'">Start face check</ForenButton>
      </template>

      <div v-if="step === 'checking'" role="status" aria-live="polite" class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <ForenSpinner size="lg" />
        <p class="text-[14px] leading-[21px] text-fg-2">This usually takes a few seconds.</p>
      </div>

      <p class="text-center text-[11px] leading-4 font-medium text-fg-3">Powered by our verification partner</p>
    </div>
  </Modal>
</template>
