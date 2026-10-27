<script setup lang="ts">
import { ref } from "vue";
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from "reka-ui";
import { RiDeleteBinLine, RiMore2Fill, RiPencilLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Stakeholder } from "@/stores/onboarding";
import { fullName } from "./shared";

defineProps<{ person: Stakeholder }>();
const emit = defineEmits<{ edit: []; remove: [] }>();
const open = ref(false);
const item = "flex h-9 w-full items-center gap-2 rounded-[10px] px-2.5 text-left text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus [&_svg]:size-4";

function pick(e: "edit" | "remove") {
  open.value = false;
  if (e === "edit") emit("edit");
  else emit("remove");
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        :aria-label="`Actions for ${fullName(person)}`"
        class="grid size-8 shrink-0 place-items-center rounded-[10px] border border-line text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
      >
        <RiMore2Fill class="size-4" aria-hidden="true" />
      </button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="end"
        :side-offset="6"
        class="z-50 w-[150px] rounded-[14px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
      >
        <button type="button" :class="cn(item, 'text-fg hover:bg-subtle')" @click="pick('edit')">
          <RiPencilLine aria-hidden="true" />
          Edit
        </button>
        <button type="button" :class="cn(item, 'text-error hover:bg-error-subtle')" @click="pick('remove')">
          <RiDeleteBinLine aria-hidden="true" />
          Delete
        </button>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
