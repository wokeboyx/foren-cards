<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import { RiCloseLine, RiMenuLine } from "@/components/icons";
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";
import { useNow } from "@/composables/useNow";
import { COMPANY } from "@/fixtures/seed";
import { asset } from "@/lib/base-path";
import { restoreExpiredLimits } from "@/services";
import { useAppStore } from "@/stores/app";
import OnboardingDemoPanel from "@/components/onboarding/OnboardingDemoPanel.vue";
import Breadcrumb from "./Breadcrumb.vue";
import DemoPanel from "./DemoPanel.vue";
import GlobalSearch from "./GlobalSearch.vue";
import NotificationBell from "./NotificationBell.vue";
import RoleSwitch from "./RoleSwitch.vue";
import Sidebar from "./Sidebar.vue";
import UserBadge from "./UserBadge.vue";
import { ROLE_LABEL } from "./nav";

const route = useRoute();
const store = useAppStore();
const now = useNow(5000);
const navOpen = ref(false);
const pathname = computed(() => route.path.replace(/(.)\/+$/, "$1"));
const layout = computed(() => route.meta.layout ?? "app");

const toastOptions = { class: "!rounded-[16px] !font-sans" };

// Temporary limit changes restore themselves when their period ends (prototype clock).
watch(now, (n) => restoreExpiredLimits(n), { immediate: true });
</script>

<template>
  <!-- Marketing-site mock-ups (foren.co sections) have no app chrome at all. -->
  <slot v-if="layout === 'bare'" />

  <!-- Sign-up has its own layout (rail + inset panel) from the onboarding Figma. -->
  <template v-else-if="layout === 'onboarding'">
    <slot />
    <OnboardingDemoPanel />
  </template>

  <!-- Creation and full edit flows take over the screen (Mercury-style focus mode). -->
  <div v-else-if="layout === 'focus'" class="min-h-dvh bg-surface">
    <main id="main"><slot /></main>
    <DemoPanel placement="edge" />
    <!-- Top-center so toasts never cover the sticky Create card footer -->
  </div>

  <div v-else class="min-h-dvh bg-surface lg:pl-[230px]">
    <!-- Desktop sidebar (Foren Business Banking "NEW IA") -->
    <aside
      class="fixed inset-y-0 left-0 z-30 hidden w-[230px] bg-surface lg:block"
    >
      <Sidebar :pathname="pathname" @navigate="navOpen = false" />
    </aside>

    <!-- Phone/tablet menu: full screen, like the Figma "Menu" pattern. -->
    <DialogRoot v-model:open="navOpen">
      <DialogPortal>
        <DialogContent
          class="fixed inset-0 z-50 flex flex-col bg-surface outline-none lg:hidden"
        >
          <DialogDescription class="sr-only">Main navigation</DialogDescription>
          <div
            class="flex items-center justify-between border-b border-line px-5 py-3"
          >
            <DialogTitle
              class="text-[18px] leading-[28px] font-semibold text-fg"
              >Menu</DialogTitle
            >
            <DialogClose
              aria-label="Close menu"
              class="grid size-10 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
            >
              <RiCloseLine class="size-[22px]" aria-hidden="true" />
            </DialogClose>
          </div>
          <div
            class="flex items-center justify-between gap-3 border-b border-line px-5 py-3"
          >
            <RoleSwitch />
            <NotificationBell />
          </div>
          <div class="min-h-0 flex-1">
            <Sidebar :pathname="pathname" @navigate="navOpen = false" />
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Content sits in an inset panel on the sunken background, like the Figma frames. -->
    <div
      class="min-h-dvh bg-canvas lg:m-2 lg:min-h-[calc(100dvh-16px)] lg:rounded-[20px]"
    >
      <!-- Phone/tablet top bar (Figma responsive screens): workspace pill with an outlined Menu button. -->
      <header class="sticky top-0 z-20 bg-surface px-5 py-3 lg:hidden">
        <div
          class="flex items-center justify-between gap-3 rounded-[12px] bg-canvas py-1.5 pr-2.5 pl-3 shadow-[0_1px_1px_rgba(36,28,21,0.05)]"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="grid size-8 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line"
            >
              <img
                :src="asset('/foren-logo.svg')"
                alt=""
                width="16"
                height="16"
              />
            </span>
            <div class="min-w-0">
              <div
                class="truncate text-[14px] leading-[21px] font-medium text-fg"
              >
                {{ COMPANY.name }}
              </div>
              <div class="truncate text-[12px] leading-[18px] text-fg-2">
                {{ ROLE_LABEL[store.role as keyof typeof ROLE_LABEL] }}
              </div>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border-[1.2px] border-line-2 px-3 text-[12px] font-medium text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
            @click="navOpen = true"
          >
            <RiMenuLine class="size-4" aria-hidden="true" />
            Menu
          </button>
        </div>
      </header>
      <header
        class="sticky top-0 z-20 hidden h-16 items-center gap-4 border-b-[0.6px] border-line bg-canvas/90 px-10 backdrop-blur lg:flex lg:rounded-t-[20px]"
      >
        <Breadcrumb :pathname="pathname" />
        <div class="mx-auto w-[320px]">
          <GlobalSearch />
        </div>
        <div class="flex items-center gap-3">
          <RoleSwitch />
          <NotificationBell />
          <UserBadge />
        </div>
      </header>
      <main
        id="main"
        class="mx-auto w-full max-w-[1195px] px-5 pt-10 pb-28 lg:px-10 lg:pt-12"
      >
        <div class="mb-10 lg:hidden">
          <Breadcrumb :pathname="pathname" />
        </div>
        <slot />
      </main>
    </div>
    <DemoPanel />
  </div>
  <!-- One toaster for every layout, so a toast survives navigating between them (e.g. create card → card list).
       Top-center in sign-up and focus flows so it never covers the sticky footer. -->
  <Toaster
    v-if="layout !== 'bare'"
    :position="
      layout === 'onboarding' || layout === 'focus'
        ? 'top-center'
        : 'bottom-center'
    "
    :toast-options="toastOptions"
  />
</template>
