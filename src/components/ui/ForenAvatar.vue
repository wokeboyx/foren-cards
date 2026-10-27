<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { avatarMeta, avatarVariants, initialsFromName, innerBgVariants, statusColor, type AvatarSize, type AvatarStatus, type AvatarTone } from "./foren-avatar";

const props = withDefaults(
  defineProps<{
    size?: AvatarSize;
    /** Image URL. If present, renders the image. */
    src?: string;
    /** Alt text + initial source if `initials` isn't provided. */
    name?: string;
    /** Override displayed initials. Otherwise derived from `name`. */
    initials?: string;
    /** Render generic person icon when no src/initials given. */
    fallback?: "icon" | "initials";
    /** Show status dot, bottom-right. */
    status?: AvatarStatus;
    /** Tone for the inner bg when rendering initials/icon. */
    tone?: AvatarTone;
    class?: HTMLAttributes["class"];
  }>(),
  { size: "md", fallback: "icon", tone: "dark" }
);
const m = computed(() => avatarMeta[props.size]);
const resolvedInitials = computed(() => props.initials ?? initialsFromName(props.name));
const showImage = computed(() => !!props.src);
const showInitials = computed(() => !showImage.value && (resolvedInitials.value.length > 0 || props.fallback === "initials"));
const showIcon = computed(() => !showImage.value && !showInitials.value);
</script>

<template>
  <span :class="cn(avatarVariants({ size }), props.class)">
    <span :class="innerBgVariants({ tone })">
      <img v-if="showImage" :src="src" :alt="name ?? 'Avatar'" class="w-full h-full object-cover" />
      <span v-if="showInitials" class="leading-none">{{ resolvedInitials || "?" }}</span>
      <span v-if="showIcon" class="text-[var(--color-foren-text-inverse)]" :style="{ width: `${m.iconPx}px`, height: `${m.iconPx}px` }">
        <svg :width="m.iconPx" :height="m.iconPx" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </span>
    </span>
    <span
      v-if="status"
      class="absolute rounded-full"
      :style="{
        width: `${m.dot}px`,
        height: `${m.dot}px`,
        bottom: 0,
        right: 0,
        backgroundColor: statusColor[status],
        boxShadow: `0 0 0 ${m.ringPx}px var(--color-foren-bg-default)`,
      }"
      :aria-label="status"
    />
  </span>
</template>
