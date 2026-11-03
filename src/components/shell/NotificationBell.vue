<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import {
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import { RiNotification3Line } from "@/components/icons";
import { useAppStore } from "@/stores/app";

const store = useAppStore();
const mine = computed(() =>
  // Requests are hidden for now, so notifications about them are too.
  store.notifications.filter(
    (n) =>
      n.forRole === store.role &&
      !n.href?.includes("/requests") &&
      !n.href?.includes("request="),
  ),
);
const unread = computed(() => mine.value.filter((n) => !n.read).length);

function onOpenChange(o: boolean) {
  if (!o && unread.value) store.markAllRead(store.role);
}
</script>

<template>
  <PopoverRoot @update:open="onOpenChange">
    <PopoverTrigger
      class="relative grid size-7 place-items-center rounded-[8px] border border-line bg-surface text-fg shadow-[0_2px_4px_-1px_rgba(36,28,21,0.08)] outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
      :aria-label="unread ? `Notifications, ${unread} unread` : 'Notifications'"
    >
      <RiNotification3Line class="size-4" aria-hidden="true" />
      <span
        v-if="unread > 0"
        class="tnum absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-bold text-white"
        aria-hidden="true"
      >
        {{ unread }}
      </span>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="end"
        :side-offset="8"
        class="z-50 w-[340px] max-w-[calc(100vw-32px)] rounded-[20px] bg-surface p-2 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
      >
        <div class="px-3 pt-2 pb-1 text-[13px] font-semibold text-fg">
          Notifications
        </div>
        <p
          v-if="mine.length === 0"
          class="px-3 py-6 text-center text-[13px] text-fg-3"
        >
          You’re all caught up.
        </p>
        <ul v-else class="max-h-[360px] overflow-y-auto">
          <li v-for="n in mine.slice(0, 12)" :key="n.id">
            <PopoverClose as-child>
              <RouterLink
                :to="n.href ?? '#'"
                class="block rounded-[14px] px-3 py-2.5 hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none"
              >
                <div class="flex items-center gap-2">
                  <span
                    v-if="!n.read"
                    class="size-2 rounded-full bg-[var(--color-foren-primary-dot)]"
                    aria-label="Unread"
                  />
                  <span class="text-[13px] font-semibold text-fg">{{
                    n.title
                  }}</span>
                </div>
                <p class="mt-0.5 text-[13px] leading-[18px] text-fg-2">
                  {{ n.body }}
                </p>
              </RouterLink>
            </PopoverClose>
          </li>
        </ul>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
