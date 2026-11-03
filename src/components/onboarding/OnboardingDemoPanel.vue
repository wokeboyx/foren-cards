<script setup lang="ts">
/** Prototype-only controls for sign-up: jump to a screen, load a ready-made state, pick outcomes. */
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import { RiFlaskLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import {
  useOnboardingStore,
  type OnboardingDemo,
  type OnboardingPreset,
} from "@/stores/onboarding";
import { PRESETS, SIGNUP_ROUTES } from "./demo-panel";

const s = useOnboardingStore();
const router = useRouter();
const open = ref(false);

function preset(p: OnboardingPreset) {
  s.loadPreset(p);
  open.value = false;
  router.push("/get-started");
}
function restart() {
  s.reset();
  open.value = false;
  router.push("/onboarding");
  toast("Sign-up reset");
}
const lookupOptions: { value: OnboardingDemo["lookup"]; label: string }[] = [
  { value: "found", label: "Finds the business" },
  { value: "not_found", label: "Finds nothing" },
];
const identityOptions: { value: OnboardingDemo["identity"]; label: string }[] =
  [
    { value: "approved", label: "Approved" },
    { value: "retry", label: "Needs a retry" },
  ];
const sectionLabel =
  "mb-2 text-[12px] font-semibold tracking-[0.01em] text-fg-3 uppercase";
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        class="fixed top-1/2 right-0 z-40 inline-flex h-10 -translate-y-1/2 items-center rounded-l-full bg-[var(--color-foren-bg-button-primary)] pr-2 pl-3 text-[var(--color-foren-text-inverse)] opacity-80 shadow-[var(--shadow-foren-lg)] outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-focus"
        aria-label="Open prototype demo controls"
      >
        <RiFlaskLine class="size-4" aria-hidden="true" />
      </button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        side="left"
        :side-offset="10"
        :collision-padding="12"
        class="z-50 max-h-[85dvh] w-[360px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-[24px] bg-surface p-5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
      >
        <div class="mb-1 text-[15px] font-semibold text-fg">
          Onboarding controls
        </div>
        <p class="mb-4 text-[12px] leading-[16px] text-fg-3">
          Test data only. Answers are saved on this device.
        </p>

        <div class="mb-4">
          <div :class="sectionLabel">Registry lookup</div>
          <ForenSegmentedControl
            size="sm"
            :model-value="s.demo.lookup"
            full-width
            aria-label="Registry lookup"
            :options="lookupOptions"
            @update:model-value="(v) => s.setDemo({ lookup: v })"
          />
        </div>
        <div class="mb-4">
          <div :class="sectionLabel">Identity check</div>
          <ForenSegmentedControl
            size="sm"
            :model-value="s.demo.identity"
            full-width
            aria-label="Identity check"
            :options="identityOptions"
            @update:model-value="(v) => s.setDemo({ identity: v })"
          />
        </div>

        <div class="mb-4">
          <div :class="sectionLabel">Go to a sign-up screen</div>
          <ul class="grid gap-1">
            <li v-for="[href, label] in SIGNUP_ROUTES" :key="href">
              <RouterLink
                :to="href"
                class="block rounded-[10px] px-2 py-1.5 text-[13px] font-medium text-fg-2 hover:bg-subtle hover:text-fg"
                @click="open = false"
                >{{ label }}</RouterLink
              >
            </li>
          </ul>
        </div>

        <div class="mb-4">
          <div :class="sectionLabel">
            Jump to after sign-up (Nigerian company)
          </div>
          <div class="grid gap-2">
            <ForenButton
              v-for="[p, label] in PRESETS"
              :key="p"
              variant="secondary"
              size="xs"
              class="justify-start"
              @click="preset(p)"
            >
              {{ label }}
            </ForenButton>
          </div>
        </div>

        <ForenButton
          variant="outline"
          size="xs"
          class="mt-2 w-full"
          @click="restart"
          >Start sign-up again</ForenButton
        >
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
