<script setup lang="ts">
import { computed } from "vue";
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiTimeFill,
} from "@/components/icons";
import { toast } from "vue-sonner";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import type { BadgeColor } from "@/components/ui/foren-badge";
import ForenButton from "@/components/ui/ForenButton.vue";
import { useOnboardingStore, type Stakeholder } from "@/stores/onboarding";
import CopyLink from "./CopyLink.vue";
import PersonAvatar from "./PersonAvatar.vue";
import { fullName, roleLine } from "./shared";

const STATUS: Record<
  Stakeholder["status"],
  {
    color: BadgeColor;
    badge: string;
    line: (p: Stakeholder) => string;
    icon: typeof RiTimeFill;
    iconClass: string;
  }
> = {
  action_required: {
    color: "error",
    badge: "Action required",
    line: (p) =>
      p.note ??
      "They need to send more information to finish their verification.",
    icon: RiErrorWarningFill,
    iconClass: "size-3.5 shrink-0 text-error",
  },
  pending: {
    color: "orange",
    badge: "Pending",
    line: () => "Waiting for them to complete verification.",
    icon: RiTimeFill,
    iconClass: "size-3.5 shrink-0 text-[#e0a526]",
  },
  not_sent: {
    color: "gray",
    badge: "Not sent",
    line: () => "Their link hasn’t been sent yet.",
    icon: RiTimeFill,
    iconClass: "size-3.5 shrink-0 text-fg-3",
  },
  verified: {
    color: "success",
    badge: "Verified",
    line: () => "Verification complete.",
    icon: RiCheckboxCircleFill,
    iconClass: "size-3.5 shrink-0 text-success",
  },
};

const props = defineProps<{ person: Stakeholder }>();
const s = useOnboardingStore();
const st = computed(() => STATUS[props.person.status]);

function resend() {
  const p = props.person;
  s.patchStakeholder(p.id, {
    status: p.status === "not_sent" ? "pending" : p.status,
  });
  toast.success(`New link sent to ${p.email}`, {
    description: "The old link no longer works.",
  });
}
</script>

<template>
  <div>
    <div
      class="flex flex-wrap items-center gap-3 rounded-[16px] bg-surface px-4 py-3.5"
    >
      <PersonAvatar :person="person" />
      <div class="min-w-0 flex-1">
        <p
          class="flex flex-wrap items-center gap-2 text-[14px] leading-[21px] font-semibold text-fg"
        >
          {{ fullName(person) }}
          <ForenBadge size="sm" :color="st.color">{{ st.badge }}</ForenBadge>
        </p>
        <p class="truncate text-[12px] leading-[18px] font-medium text-fg-2">
          {{ roleLine(person) }}
        </p>
      </div>
      <div
        v-if="person.status !== 'verified'"
        class="flex gap-2 max-sm:w-full max-sm:pl-12"
      >
        <CopyLink :person="person" />
        <ForenButton variant="outline" size="xxs" @click="resend"
          >Resend link</ForenButton
        >
      </div>
    </div>
    <p
      class="mt-2 flex items-start gap-2 px-4 text-[12px] leading-[18px] font-medium text-fg-2"
    >
      <span class="mt-0.5"
        ><component :is="st.icon" :class="st.iconClass" aria-hidden="true"
      /></span>
      {{ st.line(person) }}
    </p>
  </div>
</template>
