<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { RiHomeLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app";

const props = defineProps<{ pathname: string }>();
const store = useAppStore();

const GET_STARTED: Record<string, string> = {
  "/get-started/stakeholders": "Stakeholders",
  "/get-started/verification": "Stakeholder verification",
  "/get-started/documents": "Business documents",
  "/get-started/questionnaire": "Questionnaire",
};

const PAGE_TITLES: [RegExp, string][] = [
  [/^\/subscriptions/, "Subscriptions"],
  [/^\/requests/, "Requests"],
  [/^\/qa/, "State coverage"],
  [/^\/cards/, "Cards"],
];

const crumbs = computed(() => {
  const pathname = props.pathname;
  const out: { label: string; href?: string }[] = [];
  const m = pathname.match(/^\/cards\/([^/]+)(\/(transactions))?$/);
  if (m) {
    const card = store.cards.find((c) => c.id === m[1]);
    out.push(
      { label: "Cards", href: "/cards" },
      {
        label: card?.nickname ?? "Card",
        href: m[2] ? `/cards/${m[1]}` : undefined,
      },
    );
    if (m[3]) out.push({ label: "Transactions" });
  } else {
    const page = PAGE_TITLES.find(([re]) => re.test(pathname));
    if (pathname.startsWith("/global-account"))
      out.push({ label: "Global accounts" });
    else if (pathname.startsWith("/get-started"))
      out.push(
        {
          label: "Get started",
          href: pathname === "/get-started" ? undefined : "/get-started",
        },
        ...(GET_STARTED[pathname] ? [{ label: GET_STARTED[pathname] }] : []),
      );
    else if (page && page[1] !== "Cards")
      out.push({ label: "Cards", href: "/cards" }, { label: page[1] });
    else out.push({ label: page?.[1] ?? "Cards" });
  }
  return out;
});
</script>

<template>
  <nav aria-label="Breadcrumb" class="min-w-0">
    <ol class="flex min-w-0 items-center gap-2 text-[14px]">
      <li class="shrink-0">
        <RiHomeLine class="size-[14px] text-fg" aria-hidden="true" />
      </li>
      <li
        v-for="(c, i) in crumbs"
        :key="i"
        :class="
          cn(
            'flex min-w-0 items-center gap-2',
            i !== crumbs.length - 1 && 'hidden sm:flex',
          )
        "
      >
        <span v-if="i > 0" class="text-fg-3" aria-hidden="true">/</span>
        <span
          v-if="i === crumbs.length - 1 || !c.href"
          :aria-current="i === crumbs.length - 1 ? 'page' : undefined"
          class="truncate font-semibold text-fg"
        >
          {{ c.label }}
        </span>
        <RouterLink
          v-else
          :to="c.href"
          class="truncate font-medium text-fg-2 hover:text-fg"
          >{{ c.label }}</RouterLink
        >
      </li>
    </ol>
  </nav>
</template>
