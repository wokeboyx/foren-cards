<script setup lang="ts">
/**
 * Prototype-only controls: switch role, force failures/slow loads, move the clock and
 * reset data. This is how every state in the §10 checklist is reached during testing.
 */
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import { RiFlaskLine, RiRefreshLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import ForenToggle from "@/components/ui/ForenToggle.vue";
import { useNow } from "@/composables/useNow";
import type { Role } from "@/domain/types";
import { demoMerchantsSwitch } from "@/services";
import { useAppStore } from "@/stores/app";
import DemoGroup from "./DemoGroup.vue";

const props = withDefaults(
  defineProps<{ placement?: "left" | "right" | "edge" }>(),
  { placement: "right" },
);

const s = useAppStore();
const router = useRouter();
const now = useNow(1000);
const panelOpen = ref(false);

const clockLabel = computed(
  () =>
    `Clock · ${now.value.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`,
);
const triggerCls = computed(() =>
  props.placement === "edge"
    ? // Phone screens pin their main button to the bottom, so the control sits on the right edge instead.
      "fixed top-1/2 right-0 z-40 inline-flex h-10 -translate-y-1/2 items-center rounded-l-full bg-[var(--color-foren-bg-button-primary)] pr-2 pl-3 text-[var(--color-foren-text-inverse)] opacity-80 shadow-[var(--shadow-foren-lg)] outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-focus"
    : `fixed bottom-4 z-40 ${props.placement === "left" ? "left-4" : "right-4"} inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-foren-bg-button-primary)] px-4 text-[13px] font-semibold text-[var(--color-foren-text-inverse)] shadow-[var(--shadow-foren-lg)] outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2`,
);

function onRole(e: Event) {
  s.setRole((e.target as HTMLSelectElement).value as Role);
  router.push("/cards");
}

async function merchantsSwitch() {
  try {
    const n = await demoMerchantsSwitch();
    toast(
      `${n} merchant${n === 1 ? "" : "s"} charged ${n === 1 ? "its" : "their"} new card`,
    );
  } catch (e) {
    toast((e as Error).message);
  }
}

function emptyAccount() {
  s.emptyAccount();
  s.setRole("owner");
  router.push("/cards");
  toast("Showing a new account with no cards");
}

function reset() {
  s.resetDemo();
  toast("Demo data reset");
  router.push("/cards");
}
</script>

<template>
  <PopoverRoot v-model:open="panelOpen">
    <PopoverTrigger as-child>
      <button :class="triggerCls" aria-label="Open prototype demo controls">
        <RiFlaskLine class="size-4" aria-hidden="true" />
        <template v-if="placement !== 'edge'">Demo</template>
      </button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side="placement === 'edge' ? 'left' : 'top'"
        :align="
          placement === 'left'
            ? 'start'
            : placement === 'edge'
              ? 'center'
              : 'end'
        "
        :side-offset="10"
        :collision-padding="12"
        class="z-50 max-h-[80dvh] w-[360px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-[24px] bg-surface p-5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
      >
        <div class="mb-1 text-[15px] font-semibold text-fg">
          Prototype controls
        </div>
        <p class="mb-4 text-[12px] leading-[16px] text-fg-3">
          Test data only. These controls exist for design review and usability
          testing.
          <RouterLink
            to="/qa"
            class="font-semibold text-fg underline underline-offset-2"
            >State coverage list</RouterLink
          >
        </p>

        <DemoGroup label="View as">
          <select
            :value="s.role"
            class="h-10 w-full rounded-full bg-subtle px-4 text-[13px] font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label="View as role"
            @change="onRole"
          >
            <option value="owner">Account owner — Amara</option>
            <option value="cardholder">Cardholder — Tunde</option>
            <option value="finance">Finance lead — Chidi</option>
          </select>
        </DemoGroup>

        <DemoGroup label="Network speed">
          <ForenSegmentedControl
            size="sm"
            full-width
            aria-label="Simulated latency"
            :model-value="String(s.demo.latencyMs)"
            :options="[
              { value: '0', label: 'Instant' },
              { value: '500', label: 'Normal' },
              { value: '2500', label: 'Slow' },
            ]"
            @update:model-value="
              (v: string) => s.setDemo({ latencyMs: Number(v) })
            "
          />
        </DemoGroup>

        <DemoGroup label="Failures">
          <div class="space-y-3">
            <ForenToggle
              size="sm"
              label="Fail page loads"
              description="Shows error + Retry states"
              :model-value="s.demo.failLoads"
              @update:model-value="(v: boolean) => s.setDemo({ failLoads: v })"
            />
            <ForenToggle
              size="sm"
              label="Fail saves and actions"
              description="Issue, freeze, save, approve…"
              :model-value="s.demo.failSaves"
              @update:model-value="(v: boolean) => s.setDemo({ failSaves: v })"
            />
          </div>
        </DemoGroup>

        <DemoGroup :label="clockLabel">
          <div class="flex flex-wrap gap-2">
            <ForenButton
              size="xxs"
              variant="secondary"
              @click="s.advanceClock(5)"
              >+5 min</ForenButton
            >
            <ForenButton
              size="xxs"
              variant="secondary"
              @click="s.advanceClock(16)"
              >+16 min</ForenButton
            >
            <ForenButton
              size="xxs"
              variant="secondary"
              @click="s.advanceClock(60 * 24)"
              >+1 day</ForenButton
            >
            <ForenButton
              size="xxs"
              variant="ghost"
              @click="s.setDemo({ clockOffsetMs: 0 })"
              >Real time</ForenButton
            >
          </div>
        </DemoGroup>

        <DemoGroup label="FX rates (test)">
          <div class="flex items-center gap-2 text-[13px] text-fg-2">
            <span class="tnum flex-1"
              >1 USD = {{ s.rates.NGN.toLocaleString() }} NGN</span
            >
            <ForenButton
              size="xxs"
              variant="secondary"
              @click="s.setRate('NGN', Math.round(s.rates.NGN * 0.97))"
              >−3%</ForenButton
            >
            <ForenButton
              size="xxs"
              variant="secondary"
              @click="s.setRate('NGN', Math.round(s.rates.NGN * 1.03))"
              >+3%</ForenButton
            >
          </div>
        </DemoGroup>

        <DemoGroup label="Balances">
          <div class="flex flex-wrap gap-2">
            <ForenButton
              size="xxs"
              variant="secondary"
              @click="
                s.scaleBalances(0.01);
                toast(
                  'Balances set very low — subscriptions may show as at risk',
                );
              "
            >
              Simulate low balances
            </ForenButton>
            <ForenButton
              size="xxs"
              variant="secondary"
              @click="
                s.loadSampleGoals();
                toast('Sample AutoFX goals loaded');
              "
            >
              Load sample AutoFX goals
            </ForenButton>
          </div>
        </DemoGroup>

        <DemoGroup label="Merchant cards">
          <div class="flex flex-wrap gap-2">
            <ForenButton size="xxs" variant="secondary" @click="merchantsSwitch"
              >Merchant switches to its new card</ForenButton
            >
          </div>
        </DemoGroup>

        <ForenButton
          variant="secondary"
          size="sm"
          class="mt-2 w-full"
          @click="emptyAccount"
          >Start as a new account (no cards)</ForenButton
        >
        <ForenButton
          variant="outline"
          size="sm"
          class="mt-2 w-full"
          @click="reset"
        >
          <template #leadingIcon><RiRefreshLine /></template>
          Reset demo data
        </ForenButton>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
