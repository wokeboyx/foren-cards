<script setup lang="ts">
import { computed } from "vue";
import {
  RiArrowDownLine,
  RiArrowLeftRightFill,
  RiBankCardLine,
  RiCoinLine,
  RiDashboardLine,
  RiEarthLine,
  RiExpandUpDownLine,
  RiKeyLine,
  RiLineChartLine,
  RiSendPlaneLine,
  RiSettings4Line,
  RiSettings5Line,
  RiSparkling2Line,
  RiStarSLine,
  RiTeamLine,
  RiUserSettingsLine,
} from "@/components/icons";
import { useNow } from "@/composables/useNow";
import { COMPANY } from "@/fixtures/seed";
import { asset } from "@/lib/base-path";
import { can } from "@/lib/permissions";
import { requestState, useAppStore } from "@/stores/app";
import { isOnboarding, useOnboardingStore } from "@/stores/onboarding";
import NavGroup from "./NavGroup.vue";
import type { NavItem } from "./nav";

defineProps<{ pathname: string }>();
const emit = defineEmits<{ navigate: [] }>();

const CARD_ROUTES = /^\/(cards|subscriptions|requests|travel)(\/|$)/;

const store = useAppStore();
const ob = useOnboardingStore();
const now = useNow(5000);
const pendingCount = computed(() => (store.role === "owner" ? store.requests.filter((r) => requestState(r, now.value) === "pending").length : 0));
const onboarding = computed(() => isOnboarding(ob));
// While a sign-up is being activated, the workspace is the business that just signed up.
const workspace = computed(() => (isOnboarding(ob) && ob.business?.name) || COMPANY.name);

const groups = computed<{ title?: string; items: NavItem[] }[]>(() => {
  const role = store.role;
  const cards: NavItem = {
    label: "Cards",
    icon: RiBankCardLine,
    match: (p) => CARD_ROUTES.test(p),
    badge: pendingCount.value,
    children: [
      { label: "Overview", href: "/cards", match: (p) => p.startsWith("/cards") || p.startsWith("/subscriptions") },
      { label: "Requests", href: "/requests", badge: pendingCount.value },
      { label: "Spending abroad", href: "/travel" },
    ],
  };
  return [
    {
      items: [
        // Until compliance approves the account, setup tasks live here (Figma "Verify your business").
        ...(onboarding.value && role === "owner" ? [{ label: "Get started", icon: RiSparkling2Line, href: "/get-started" }] : []),
        { label: "Home", icon: RiStarSLine },
        { label: "Dashboard", icon: RiDashboardLine },
        { label: "Global accounts", icon: RiEarthLine, href: can(role, "autofx") ? "/global-account" : undefined },
      ],
    },
    {
      title: "Move money",
      items: [
        { label: "Send", icon: RiSendPlaneLine },
        { label: "Receive", icon: RiArrowDownLine, children: [] },
        { label: "Swap", icon: RiArrowLeftRightFill },
        cards,
      ],
    },
    { title: "Records", items: [{ label: "Transactions", icon: RiCoinLine }, { label: "Analytics", icon: RiLineChartLine }] },
    {
      title: "Manage",
      items: [
        { label: "Recipients", icon: RiTeamLine },
        { label: "Team & approvals", icon: RiUserSettingsLine },
        { label: "Settings", icon: RiSettings4Line },
      ],
    },
  ];
});

const developers: NavItem[] = [
  { label: "API Payouts", icon: RiEarthLine },
  { label: "Keys & Web-hooks", icon: RiKeyLine },
  { label: "Configuration", icon: RiSettings5Line },
];
</script>

<template>
  <nav aria-label="Main" class="flex h-full flex-col overflow-y-auto px-3 pt-5 pb-8">
    <div class="flex h-10 items-center gap-3 rounded-[12px] bg-canvas pr-2.5 pl-3 shadow-[0_1px_1px_rgba(36,28,21,0.05)]">
      <span class="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-surface ring-1 ring-line">
        <img :src="asset('/foren-logo.svg')" alt="" width="12" height="12" />
      </span>
      <span class="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[0.01em] text-fg-2">{{ workspace }}</span>
      <RiExpandUpDownLine class="size-4 shrink-0 text-fg-3" aria-hidden="true" />
    </div>
    <div class="mt-8 space-y-6">
      <NavGroup v-for="(g, i) in groups" :key="i" :title="g.title" :items="g.items" :pathname="pathname" @navigate="emit('navigate')" />
    </div>
    <div class="mt-auto pt-8">
      <NavGroup title="Developers" :items="developers" :pathname="pathname" @navigate="emit('navigate')" />
    </div>
  </nav>
</template>
