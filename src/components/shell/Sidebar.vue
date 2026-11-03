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
import { COMPANY } from "@/fixtures/seed";
import { asset } from "@/lib/base-path";
import { can } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";
import { isOnboarding, useOnboardingStore } from "@/stores/onboarding";
import NavGroup from "./NavGroup.vue";
import type { NavItem } from "./nav";

defineProps<{ pathname: string }>();
const emit = defineEmits<{ navigate: [] }>();

const CARD_ROUTES = /^\/cards(\/|$)/;

const store = useAppStore();
const ob = useOnboardingStore();
const onboarding = computed(() => isOnboarding(ob));
// While a sign-up is being activated, the workspace is the business that just signed up.
const workspace = computed(
  () => (isOnboarding(ob) && ob.business?.name) || COMPANY.name,
);

/** The business logo: its initials until a logo image is uploaded. */
const initials = computed(() =>
  workspace.value
    .split(/\s+/)
    .filter((w) => !/^(ltd|limited|inc|llc|plc)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join(""),
);
/** The business's Foren tag, e.g. "Kola Logistics Ltd" → @kolalogistics. */
const tag = computed(() =>
  workspace.value
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|llc|plc)\b/g, "")
    .replace(/[^a-z0-9]/g, ""),
);

const groups = computed<{ title?: string; items: NavItem[] }[]>(() => {
  const role = store.role;
  const cards: NavItem = {
    label: "Cards",
    icon: RiBankCardLine,
    match: (p) => CARD_ROUTES.test(p),
    children: [
      {
        label: "Overview",
        href: "/cards",
        match: (p) => p.startsWith("/cards"),
      },
    ],
  };
  return [
    {
      items: [
        // Until compliance approves the account, setup tasks live here (Figma "Verify your business").
        ...(onboarding.value && role === "owner"
          ? [
              {
                label: "Get started",
                icon: RiSparkling2Line,
                href: "/get-started",
              },
            ]
          : []),
        { label: "Home", icon: RiStarSLine },
        { label: "Dashboard", icon: RiDashboardLine },
        {
          label: "Global accounts",
          icon: RiEarthLine,
          href: can(role, "autofx") ? "/global-account" : undefined,
        },
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
    {
      title: "Records",
      items: [
        { label: "Transactions", icon: RiCoinLine },
        { label: "Analytics", icon: RiLineChartLine },
      ],
    },
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
  <nav
    aria-label="Main"
    class="flex h-full flex-col overflow-y-auto px-3 pt-5 pb-8"
  >
    <!-- Figma "Sidebar Item" (workspace): the business logo, its name, and its Foren tag, with the switcher caret -->
    <div
      class="flex items-center justify-between rounded-[12px] bg-canvas py-1.5 pr-2.5 pl-3 shadow-[0_1px_1px_rgba(36,28,21,0.05)]"
    >
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <span
          class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-[12px] font-semibold text-fg ring-1 ring-line"
          aria-hidden="true"
          >{{ initials }}</span
        >
        <div class="min-w-0 flex-1">
          <p
            class="truncate text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg"
          >
            {{ workspace }}
          </p>
          <div class="flex items-center gap-1">
            <span
              class="grid size-[11px] shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-line"
              aria-hidden="true"
            >
              <img
                :src="asset('/foren-logo.svg')"
                alt=""
                width="6"
                height="6"
                class="size-[6px]"
              />
            </span>
            <p
              class="truncate text-[12px] leading-[18px] font-medium tracking-[0.12px] text-fg-2"
              data-testid="foren-tag"
            >
              @{{ tag }}
            </p>
          </div>
        </div>
      </div>
      <RiExpandUpDownLine
        class="size-4 shrink-0 text-fg-3"
        aria-hidden="true"
      />
    </div>
    <div class="mt-8 space-y-6">
      <NavGroup
        v-for="(g, i) in groups"
        :key="i"
        :title="g.title"
        :items="g.items"
        :pathname="pathname"
        @navigate="emit('navigate')"
      />
    </div>
    <div class="mt-auto pt-8">
      <NavGroup
        title="Developers"
        :items="developers"
        :pathname="pathname"
        @navigate="emit('navigate')"
      />
    </div>
  </nav>
</template>
