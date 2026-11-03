<script setup lang="ts">
/** A requested card waiting for the owner, shown in the card list so requests and cards live together. */
import { computed } from "vue";
import CardArt from "@/components/card/CardArt.vue";
import ForenAvatar from "@/components/ui/ForenAvatar.vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenTableRow from "@/components/ui/ForenTableRow.vue";
import { useNow } from "@/composables/useNow";
import { limitSummary } from "@/domain/limits";
import { format } from "@/domain/money";
import type { CardRequest } from "@/domain/types";
import { personById } from "@/stores/app";
import { timeAgo } from "./card-detail";
import PendingRequestBadge from "./PendingRequestBadge.vue";

const props = defineProps<{
  r: CardRequest;
  compact: boolean;
  selected: boolean;
  me: string;
}>();
const emit = defineEmits<{ select: [] }>();
const now = useNow(30_000);
const requester = computed(() => personById(props.r.requesterId));
const want = computed(() => props.r.newCard!);
const initials = computed(() =>
  requester.value?.name
    .split(" ")
    .map((x) => x[0])
    .join(""),
);
</script>

<template>
  <ForenTableRow
    :selected="selected"
    :aria-selected="selected"
    @click="emit('select')"
  >
    <td class="px-4 py-2.5">
      <div class="flex items-center gap-2.5">
        <ForenAvatar
          size="xs"
          :name="requester?.name"
          :initials="initials"
          fallback="initials"
        />
        <span class="truncate text-[13px] text-fg">{{ requester?.name }}</span>
        <ForenBadge v-if="r.requesterId === me" size="sm" color="primary"
          >You</ForenBadge
        >
      </div>
    </td>
    <td class="px-4 py-2.5">
      <div class="flex items-center gap-2.5">
        <CardArt
          :card="{
            design: want.design,
            nickname: want.nickname,
            last4: '',
            kind: 'standard',
            status: 'active',
          }"
          size="xs"
          class="opacity-50"
        />
        <button
          class="min-w-0 truncate text-left text-[13px] text-fg outline-none focus-visible:underline"
          :aria-label="`${want.nickname}, pending card request from ${requester?.name}`"
          @click.stop="emit('select')"
        >
          <span class="font-medium">{{ want.nickname }}</span>
          <span v-if="!compact" class="text-fg-3">
            · asked {{ timeAgo(r.createdAt, now) }}</span
          >
        </button>
        <PendingRequestBadge />
      </div>
    </td>
    <td
      class="tnum px-4 py-2.5 text-right text-[13px] whitespace-nowrap text-fg-2"
    >
      {{
        compact
          ? `${format(want.limit.daily, { compact: true })} a day asked`
          : limitSummary(want.limit, { compact: true })
      }}
    </td>
    <td v-if="!compact" class="px-4 py-2.5 text-[13px] text-fg-3">
      Set on approval
    </td>
  </ForenTableRow>
</template>
