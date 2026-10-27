<script setup lang="ts">
// Prototype control: who you're viewing the app as. Sits where the Figma top bar has "Test mode".
import { useRouter } from "vue-router";
import type { Role } from "@/domain/types";
import { useAppStore } from "@/stores/app";
import { ROLE_LABEL } from "./nav";

const store = useAppStore();
const router = useRouter();
const roles = Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[];

function onChange(e: Event) {
  store.setRole((e.target as HTMLSelectElement).value as Role);
  router.push("/cards");
}
</script>

<template>
  <label class="flex items-center gap-2 text-[12px] font-medium text-fg-3">
    Viewing as
    <select
      id="role-switch"
      :value="store.role"
      class="h-7 rounded-full bg-subtle pr-7 pl-3 text-[12px] font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-focus"
      @change="onChange"
    >
      <option v-for="r in roles" :key="r" :value="r">{{ ROLE_LABEL[r] }}</option>
    </select>
  </label>
</template>
