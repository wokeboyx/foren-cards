<script setup lang="ts">
/** Revolut-style approvals timeline: who asked, then who decided (or that it's still waiting). */
import { computed } from "vue";
import type { CardRequest } from "@/domain/types";
import { cn } from "@/lib/utils";

const props = defineProps<{
  r: CardRequest;
  state: CardRequest["state"];
  requester: string;
}>();
const t = (at?: string) =>
  at
    ? new Date(at).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
const decided = computed(
  () =>
    props.state === "approved" ||
    props.state === "denied" ||
    props.state === "used" ||
    (props.state === "expired" && !!props.r.decidedAt),
);
const dot = (tone: "done" | "wait" | "bad") =>
  cn(
    "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full",
    tone === "done"
      ? "bg-success"
      : tone === "bad"
        ? "bg-error"
        : "bg-warning ring-4 ring-warning-subtle",
  );
const decision = computed(() =>
  props.state === "pending"
    ? "pending"
    : props.r.state === "denied" || props.state === "denied"
      ? "denied"
      : decided.value
        ? "approved"
        : "expired",
);
</script>

<template>
  <ol
    class="relative mt-3 space-y-2.5 text-[13px] leading-[18px] text-fg-3"
    aria-label="Approvals"
  >
    <span
      class="absolute top-3 bottom-3 left-[4.5px] w-px bg-line-2"
      aria-hidden="true"
    />
    <li class="flex gap-3">
      <span :class="dot('done')" aria-hidden="true" />
      <span>
        <span class="font-medium text-fg">Submitted by {{ requester }}</span> ·
        {{ t(r.createdAt) }}
      </span>
    </li>
    <li class="flex gap-3">
      <span
        :class="
          dot(
            state === 'pending'
              ? 'wait'
              : state === 'denied'
                ? 'bad'
                : decided
                  ? 'done'
                  : 'bad',
          )
        "
        aria-hidden="true"
      />
      <span>
        <template v-if="decision === 'pending'">
          <span class="font-medium text-fg">Account owner</span> · Waiting for a
          decision
        </template>
        <template v-else-if="decision === 'denied'">
          <span class="font-medium text-fg"
            >Declined by {{ r.decidedBy ?? "the account owner" }}</span
          >
          · {{ t(r.decidedAt) }}
          <span v-if="r.denyNote" class="block text-fg-2"
            >“{{ r.denyNote }}”</span
          >
        </template>
        <template v-else-if="decision === 'approved'">
          <span class="font-medium text-fg"
            >Approved by {{ r.decidedBy ?? "the account owner" }}</span
          >
          · {{ t(r.decidedAt) }}
        </template>
        <template v-else>
          <span class="font-medium text-fg">Account owner</span> · No decision
          before it expired
        </template>
      </span>
    </li>
  </ol>
</template>
