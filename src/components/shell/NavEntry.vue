<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { RiArrowRightSLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import { navItemCls, soon, type NavItem } from "./nav";

const props = defineProps<{ item: NavItem; pathname: string }>();
const emit = defineEmits<{ navigate: [] }>();

const active = computed(() =>
  props.item.match
    ? props.item.match(props.pathname)
    : !!props.item.href && props.pathname.startsWith(props.item.href),
);
const expandable = computed(() => !!props.item.children);
const hasChildren = computed(() => (props.item.children?.length ?? 0) > 0);
// Open while you're in this section, unless you've closed it yourself.
const toggled = ref<boolean | null>(null);
const open = computed(() => toggled.value ?? active.value);
const showBadge = computed(
  () => !!props.item.badge && !(expandable.value && open.value),
);

function onExpand() {
  if (hasChildren.value) toggled.value = !open.value;
  else soon(props.item.label);
}
</script>

<template>
  <li v-if="expandable">
    <button
      type="button"
      :aria-expanded="hasChildren ? open : undefined"
      :class="
        cn(
          navItemCls,
          active && !open
            ? 'bg-subtle text-fg'
            : active
              ? 'text-fg'
              : 'text-fg-3 hover:bg-subtle/70 hover:text-fg-2',
        )
      "
      @click="onExpand"
    >
      <component :is="item.icon" v-if="item.icon" />
      <span class="flex-1">{{ item.label }}</span>
      <span
        v-if="showBadge"
        class="tnum grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-foren-bg-button-primary)] px-1.5 text-[11px] font-semibold text-[var(--color-foren-text-inverse)]"
      >
        {{ item.badge }}
        <span class="sr-only"> pending</span>
      </span>
      <RiArrowRightSLine
        :class="
          cn(
            '!size-4 text-fg-3 transition-transform',
            open && hasChildren && 'rotate-90',
          )
        "
        aria-hidden="true"
      />
    </button>
    <ul v-if="open && hasChildren" class="mt-1 space-y-1">
      <NavEntry
        v-for="c in item.children"
        :key="c.label"
        :item="c"
        :pathname="pathname"
        @navigate="emit('navigate')"
      />
    </ul>
  </li>
  <li v-else>
    <RouterLink
      v-if="item.href"
      :to="item.href"
      :aria-current="active ? 'page' : undefined"
      :class="
        cn(
          navItemCls,
          active
            ? 'bg-subtle text-fg'
            : 'text-fg-3 hover:bg-subtle/70 hover:text-fg-2',
        )
      "
      @click="emit('navigate')"
    >
      <!-- Sub-items keep the icon slot empty so their labels line up with the parent's. -->
      <component :is="item.icon" v-if="item.icon" />
      <span v-else class="size-[14px] shrink-0" aria-hidden="true" />
      <span class="flex-1">{{ item.label }}</span>
      <span
        v-if="showBadge"
        class="tnum grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-foren-bg-button-primary)] px-1.5 text-[11px] font-semibold text-[var(--color-foren-text-inverse)]"
      >
        {{ item.badge }}
        <span class="sr-only"> pending</span>
      </span>
    </RouterLink>
    <button
      v-else
      type="button"
      :class="cn(navItemCls, 'text-fg-3 hover:bg-subtle/70 hover:text-fg-2')"
      @click="soon(item.label)"
    >
      <component :is="item.icon" v-if="item.icon" />
      <span v-else class="size-[14px] shrink-0" aria-hidden="true" />
      <span class="flex-1">{{ item.label }}</span>
      <span
        v-if="showBadge"
        class="tnum grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-foren-bg-button-primary)] px-1.5 text-[11px] font-semibold text-[var(--color-foren-text-inverse)]"
      >
        {{ item.badge }}
        <span class="sr-only"> pending</span>
      </span>
    </button>
  </li>
</template>
