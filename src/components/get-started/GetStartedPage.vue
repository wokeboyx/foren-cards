<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { RiCheckboxCircleFill, RiTimeLine } from "@/components/icons";
import EmptyState from "@/components/EmptyState.vue";
import LinkButton from "@/components/LinkButton.vue";
import Panel from "@/components/Panel.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { checklist, useOnboardingStore } from "@/stores/onboarding";
import DelegateCard from "./DelegateCard.vue";
import GroupLabel from "./GroupLabel.vue";
import { isDone } from "./overview";
import SetupColumn from "./SetupColumn.vue";
import SimulateReview from "./SimulateReview.vue";
import TaskRow from "./TaskRow.vue";

const s = useOnboardingStore();
const router = useRouter();

const items = computed(() => checklist(s.$state));
const done = computed(() => items.value.filter(isDone).length);
const attention = computed(() => items.value.filter((i) => i.status === "action_required").length);
const pct = computed(() => (items.value.length ? Math.round((done.value / items.value.length) * 100) : 0));
const allSubmitted = computed(() => items.value.length > 0 && items.value.every(isDone));

const changes = computed(() => s.review === "changes_requested");
const inReview = computed(() => s.review === "in_review");

const title = computed(() => (changes.value ? "A few things need another look" : inReview.value ? "We’re reviewing your account" : "Complete your account setup"));
const description = computed(() =>
  changes.value
    ? "Everything else checked out. Fix the highlighted items below to finish your review."
    : inReview.value
      ? "You’ve sent everything we need. We’ll email you when your account is ready."
      : "Finish the steps below to unlock your full Foren business account."
);
</script>

<template>
  <SetupColumn v-if="!s.signedUpAt">
    <Panel>
      <EmptyState title="You haven’t signed up yet" body="Sign up for a Foren business account to see your setup steps here.">
        <template #action>
          <LinkButton href="/onboarding" size="sm">Start sign-up</LinkButton>
        </template>
      </EmptyState>
    </Panel>
  </SetupColumn>

  <SetupColumn v-else-if="s.review === 'approved'">
    <Panel class="flex flex-col items-center px-6 py-12 text-center">
      <img :src="asset('/onboarding/check.png')" alt="" width="96" height="96" class="mb-6" />
      <h1 class="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">Your account is active</h1>
      <p class="mt-2 max-w-[400px] text-[14px] leading-[21px] font-medium text-fg-2">
        {{ s.business?.name ? `${s.business.name} is verified. ` : "" }}You can now send, receive and issue cards with no setup limits.
      </p>
      <ForenButton size="sm" class="mt-6" @click="router.push('/cards')">Go to dashboard</ForenButton>
    </Panel>
  </SetupColumn>

  <SetupColumn v-else>
    <div class="relative mb-6 aspect-[940/514] w-full overflow-hidden rounded-[20px] bg-[#3d86c9]">
      <img :src="asset('/onboarding/setup-banner.jpg')" alt="" fetchpriority="high" class="absolute inset-0 size-full object-cover" />
      <img
        :src="asset('/onboarding/foren-wordmark.svg')"
        alt="Foren"
        width="100"
        height="24"
        class="absolute top-[11%] left-1/2 h-auto w-[30%] -translate-x-1/2 brightness-0 invert"
      />
    </div>
    <h1 class="font-display text-[22px] leading-[30px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">{{ title }}</h1>
    <p class="mt-1 text-[14px] leading-[21px] font-medium text-fg-2">{{ description }}</p>
    <span v-if="changes || inReview" class="mt-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-success-subtle px-3 text-[12px] font-semibold text-success">
      <RiCheckboxCircleFill class="size-3.5" aria-hidden="true" />
      All your details are saved
    </span>

    <div class="mt-6 mb-8" aria-live="polite">
      <div class="mb-2 flex items-center justify-between text-[12px] leading-[18px] font-semibold text-fg">
        <span>{{ done }} of {{ items.length }} steps {{ changes || inReview ? "submitted" : "completed" }}</span>
        <span v-if="attention > 0" class="rounded-full bg-error-subtle px-2 py-0.5 text-[11px] text-error">{{ attention }} needs attention</span>
        <span v-else class="text-fg-3">{{ pct }}%</span>
      </div>
      <div class="flex h-1.5 gap-1" role="progressbar" :aria-valuemin="0" :aria-valuemax="items.length" :aria-valuenow="done" aria-label="Setup progress">
        <span
          v-for="i in items"
          :key="i.id"
          :class="cn('flex-1 rounded-full', i.status === 'action_required' ? 'bg-error' : isDone(i) ? 'bg-[var(--color-foren-brand-green)]' : 'bg-line-2/60')"
        />
      </div>
    </div>

    <GroupLabel>{{ changes || inReview ? "In review" : "To do" }}</GroupLabel>
    <ul class="flex flex-col gap-3">
      <li v-for="i in items" :key="i.id">
        <TaskRow :item="i" :s="s.$state" />
      </li>
    </ul>

    <div v-if="allSubmitted && s.review === 'none'" class="mt-6 flex flex-col gap-2">
      <ForenButton size="md" class="w-full" @click="s.set({ review: 'in_review' })">Submit for review</ForenButton>
      <p class="text-center text-[12px] leading-[18px] font-medium text-fg-3">You can’t change your answers while we review them.</p>
    </div>
    <ForenButton v-if="changes && attention === 0" size="md" class="mt-6 w-full" @click="s.set({ review: 'in_review' })">Send for review again</ForenButton>

    <p v-if="inReview || changes" class="mt-5 flex items-center justify-center gap-1.5 text-[12px] leading-[18px] font-medium text-fg-3">
      <RiTimeLine class="size-3.5 text-warning" aria-hidden="true" />
      Reviews usually take 1–2 business days.
    </p>

    <DelegateCard v-if="!inReview && !changes" />
    <SimulateReview v-if="inReview || changes" />
  </SetupColumn>
</template>
