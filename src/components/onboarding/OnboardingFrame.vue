<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { RiArrowLeftSLine, RiCheckLine, RiPlayCircleLine } from "@/components/icons";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenSpinner from "@/components/ui/ForenSpinner.vue";
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import HelpButton from "./HelpButton.vue";
import { useSteps, type FrameFooter, type StepKey } from "./frame";

const props = defineProps<{
  step: StepKey;
  /** Where the round back button goes. */
  back?: string | (() => void);
  title?: string;
  description?: string;
  /** Bottom bar. Omit to hide it (e.g. screens with their own call to action). */
  footer?: FrameFooter;
  /** Content column wider than 558px (the use-case grid). */
  wide?: boolean;
  /** Centered content without the title block (e.g. Identity confirmed). */
  bare?: boolean;
  /** Mark the current step done in the rail (e.g. Identity confirmed). */
  completed?: boolean;
}>();
const slots = defineSlots<{ default(): unknown; title?(): unknown; description?(): unknown }>();

const steps = useSteps();
const current = computed(() => steps.value.findIndex((s) => s.key === props.step));
const router = useRouter();
const cancelOpen = ref(false);

const goBack = () => (typeof props.back === "function" ? props.back() : props.back && router.push(props.back));
const column = computed(() => (props.wide ? "max-w-[476px] lg:max-w-[700px]" : "max-w-[558px]"));

function onCancel() {
  const c = props.footer?.cancel;
  if (typeof c === "function") c();
  else cancelOpen.value = true;
}
function onPrimary() {
  const a = props.footer!.primary;
  if (a.onClick) a.onClick();
  else if (a.href) router.push(a.href);
}
function leave() {
  cancelOpen.value = false;
  router.push("/cards");
}
</script>

<template>
  <div class="min-h-dvh bg-surface lg:flex">
    <!-- Rail -->
    <aside class="hidden w-[325px] shrink-0 lg:block">
      <div class="sticky top-0 flex h-dvh flex-col gap-16 px-[22px] py-8">
        <div class="px-3">
          <RouterLink to="/onboarding" aria-label="Foren home">
            <img :src="asset('/onboarding/foren-wordmark.svg')" alt="Foren" width="100" height="24" />
          </RouterLink>
        </div>
        <div class="flex min-h-0 flex-1 flex-col justify-between gap-8">
          <ol class="flex w-[281px] flex-col gap-8" aria-label="Sign-up steps">
            <li
              v-for="(s, i) in steps"
              :key="s.key"
              class="flex items-start gap-3"
              :aria-current="i === current && !completed ? 'step' : undefined"
            >
              <span
                :class="
                  cn(
                    'grid size-7 shrink-0 place-items-center rounded-full text-[12px] leading-4 font-bold',
                    i < current || (i === current && completed)
                      ? 'bg-success text-white'
                      : i === current
                        ? 'bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]'
                        : 'border-[1.75px] border-line text-[10.5px] text-fg-disabled'
                  )
                "
              >
                <RiCheckLine v-if="i < current || (i === current && completed)" class="size-[14px]" aria-label="Done" />
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span class="flex min-w-0 flex-col gap-1">
                <span
                  :class="
                    cn(
                      'text-[14px] leading-[21px] font-medium tracking-[0.01em]',
                      i < current || (i === current && completed) ? 'text-success' : i === current ? 'text-fg' : 'text-fg-disabled'
                    )
                  "
                  >{{ s.title }}</span
                >
                <span
                  :class="
                    cn(
                      'text-[12px] leading-[18px] font-medium tracking-[0.01em] whitespace-pre-wrap',
                      i <= current ? 'text-fg-3' : 'text-fg-disabled'
                    )
                  "
                  >{{ s.description }}</span
                >
              </span>
            </li>
          </ol>
          <div class="flex flex-col gap-10">
            <div class="relative overflow-hidden rounded-[24px] border border-line bg-white px-3 pt-12 pb-4">
              <div class="absolute inset-x-0 top-0 h-16 overflow-hidden bg-[#cfecc6]">
                <img :src="asset('/onboarding/clouds.jpg')" alt="" class="absolute inset-0 size-full object-cover object-top opacity-70" />
              </div>
              <div class="relative flex flex-col gap-6">
                <span class="grid size-8 place-items-center rounded-full border border-line bg-white text-[#3d6fb6]">
                  <RiPlayCircleLine class="size-5" aria-hidden="true" />
                </span>
                <div class="flex flex-col gap-1">
                  <p class="text-[14px] leading-[21px] font-medium text-fg">See Foren in action</p>
                  <p class="text-[12px] leading-[18px] font-medium text-fg-3">
                    Explore a live demo with sample data. No signup required, nothing touches your real account.
                  </p>
                </div>
                <RouterLink
                  to="/cards"
                  class="inline-flex h-[38px] w-fit items-center rounded-full bg-[var(--color-foren-bg-button-secondary)] px-3 text-[12px] leading-[18px] font-medium text-fg-2 outline-none hover:bg-[var(--color-foren-bg-button-secondary-hover)] focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Explore demo
                </RouterLink>
              </div>
            </div>
            <HelpButton />
          </div>
        </div>
      </div>
    </aside>

    <!-- Phone/tablet top: wordmark + progress -->
    <header class="sticky top-0 z-20 border-b border-line bg-surface px-5 pt-4 pb-3 lg:hidden">
      <div class="flex items-center justify-between gap-3">
        <img :src="asset('/onboarding/foren-wordmark.svg')" alt="Foren" width="80" height="19" />
        <RouterLink to="/cards" class="text-[13px] font-semibold text-fg-2 underline-offset-2 hover:underline">Log in</RouterLink>
      </div>
      <div class="mt-3 flex items-center gap-3">
        <div class="flex flex-1 gap-1" aria-hidden="true">
          <span
            v-for="(s, i) in steps"
            :key="s.key"
            :class="
              cn(
                'h-1 flex-1 rounded-full',
                i < current || (i === current && completed) ? 'bg-[var(--color-foren-brand-green)]' : i === current ? 'bg-fg' : 'bg-line'
              )
            "
          />
        </div>
        <span class="shrink-0 text-[12px] font-medium text-fg-3">Step {{ current + 1 }} of {{ steps.length }} · {{ steps[current]?.title }}</span>
      </div>
    </header>

    <div class="flex min-w-0 flex-1 flex-col lg:py-2 lg:pr-2">
      <div class="relative flex-1 bg-canvas lg:rounded-[20px] lg:shadow-[var(--shadow-foren-xs)]">
        <div class="absolute top-3 right-3 hidden items-center gap-6 lg:flex">
          <span class="text-[16px] leading-6 font-medium text-fg">Already have an account?</span>
          <ForenButton variant="secondary" size="sm" class="w-[118px]" @click="router.push('/cards')">Login</ForenButton>
        </div>
        <main id="main" :class="cn('mx-auto w-full px-5 pt-8 pb-32 lg:px-0 lg:pt-[112px]', column)">
          <slot v-if="bare" />
          <template v-else>
            <div class="mb-12 flex flex-col gap-3">
              <button
                v-if="back"
                type="button"
                aria-label="Back"
                class="grid size-6 place-items-center rounded-full border-[0.6px] border-[rgba(0,0,0,0.07)] bg-white/10 text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
                @click="goBack"
              >
                <RiArrowLeftSLine class="size-[14px]" aria-hidden="true" />
              </button>
              <div v-if="title || slots.title" class="flex flex-col gap-2">
                <h1
                  class="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none] lg:text-[28px] lg:leading-[36px]"
                >
                  <slot name="title">{{ title }}</slot>
                </h1>
                <p v-if="description || slots.description" class="text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg-2">
                  <slot name="description">{{ description }}</slot>
                </p>
              </div>
            </div>
            <slot />
          </template>
        </main>
      </div>
      <div v-if="footer" class="sticky bottom-0 z-10 border-t border-line bg-surface">
        <div :class="cn('mx-auto flex h-[72px] w-full items-center justify-end gap-3 px-5 lg:px-0', column)">
          <ForenButton v-if="footer.cancel !== false" variant="outline" size="xxs" class="min-w-[89px] max-lg:h-10 max-lg:flex-1" @click="onCancel">
            Cancel
          </ForenButton>
          <ForenButton
            size="xs"
            class="min-w-[104px] max-lg:h-10 max-lg:flex-1"
            :disabled="footer.primary.disabled || footer.primary.loading"
            :aria-busy="footer.primary.loading || undefined"
            @click="onPrimary"
          >
            <template v-if="footer.primary.loading" #leadingIcon><ForenSpinner size="sm" class="text-current" /></template>
            {{ footer.primary.label }}
          </ForenButton>
        </div>
      </div>
    </div>
    <ConfirmDialog
      v-model:open="cancelOpen"
      title="Leave sign-up?"
      consequence="Your answers are saved on this device, so you can pick up where you left off."
      confirm-label="Leave"
      @confirm="leave"
    />
  </div>
</template>
