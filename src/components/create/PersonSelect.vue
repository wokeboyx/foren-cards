<script setup lang="ts">
/**
 * Searchable people dropdown (scales to large teams). Single choice for a team member's card,
 * multi-select (up to `max`) for a company card. "Add someone who isn't on Foren" lives in the list.
 */
import { computed, ref, useId, watch } from "vue";
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from "reka-ui";
import { RiAddLine, RiArrowDownSLine, RiCheckLine, RiSearchLine } from "@/components/icons";
import ForenAvatar from "@/components/ui/ForenAvatar.vue";
import type { Person } from "@/domain/types";
import { cn } from "@/lib/utils";

const props = defineProps<{
  people: Person[];
  multiple: boolean;
  selected: string[];
  disabled?: boolean;
  invalid?: boolean;
  max: number;
}>();
const emit = defineEmits<{ pick: [id: string]; addNew: [] }>();

const ROLE: Record<Person["role"], string> = { owner: "Account owner", cardholder: "Team member", finance: "Finance lead" };
const initials = (n: string) =>
  n
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const open = ref(false);
const q = ref("");
const listId = useId();
watch(open, (o) => {
  if (!o) q.value = "";
});
const chosen = computed(() => props.selected.map((id) => props.people.find((p) => p.id === id)).filter(Boolean) as Person[]);
const shown = computed(() => props.people.filter((p) => !q.value.trim() || `${p.name} ${p.email}`.toLowerCase().includes(q.value.trim().toLowerCase())));
const full = computed(() => props.multiple && props.selected.length >= props.max);

function pick(p: Person) {
  const isOn = props.selected.includes(p.id);
  if (full.value && !isOn) return;
  emit("pick", p.id);
  if (!props.multiple) open.value = false;
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      :disabled="disabled"
      aria-labelledby="people-label"
      :aria-invalid="invalid"
      role="combobox"
      :aria-expanded="open"
      :aria-controls="listId"
      :class="
        cn(
          'flex min-h-12 w-full items-center gap-2.5 rounded-[16px] border bg-subtle py-2 pr-10 pl-3 text-left text-[14px] outline-none focus-visible:border-focus focus-visible:bg-surface disabled:cursor-not-allowed disabled:opacity-60 relative',
          invalid ? 'border-error bg-surface' : 'border-transparent'
        )
      "
    >
      <span v-if="chosen.length === 0" class="text-fg-3">{{ multiple ? "Choose people" : "Choose a team member" }}</span>
      <span v-else-if="multiple" class="flex flex-wrap gap-1.5">
        <span v-for="p in chosen" :key="p.id" class="inline-flex items-center gap-1.5 rounded-full bg-surface py-0.5 pr-2.5 pl-0.5 text-[13px] font-medium text-fg ring-1 ring-line">
          <ForenAvatar size="xs" :name="p.name" :initials="initials(p.name)" fallback="initials" />
          {{ p.name }}
        </span>
      </span>
      <template v-else>
        <ForenAvatar size="sm" :name="chosen[0].name" :initials="initials(chosen[0].name)" fallback="initials" />
        <span class="min-w-0">
          <span class="block truncate font-medium text-fg">
            {{ chosen[0].name }}
            <span v-if="chosen[0].invited" class="ml-2 rounded-full bg-warning-subtle px-2 py-0.5 text-[11px] font-semibold text-warning">Invite pending</span>
          </span>
          <span class="block truncate text-[12px] text-fg-3">{{ ROLE[chosen[0].role] }} · {{ chosen[0].email }}</span>
        </span>
      </template>
      <RiArrowDownSLine :class="cn('absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-fg-3 transition-transform', open && 'rotate-180')" aria-hidden="true" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="start"
        :side-offset="6"
        class="z-50 w-[var(--reka-popover-trigger-width)] rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
      >
        <div class="relative p-1">
          <RiSearchLine class="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
          <input
            v-model="q"
            autofocus
            placeholder="Search by name or email"
            aria-label="Search people"
            class="h-10 w-full rounded-[12px] bg-subtle pr-3 pl-9 text-[14px] text-fg outline-none focus:ring-2 focus:ring-focus"
          />
        </div>
        <div :id="listId" role="listbox" :aria-multiselectable="multiple || undefined" aria-label="People" class="max-h-[280px] overflow-y-auto py-1">
          <p v-if="shown.length === 0" class="px-3 py-3 text-[13px] text-fg-3">No one matches “{{ q }}”.</p>
          <button
            v-for="p in shown"
            :key="p.id"
            type="button"
            role="option"
            :aria-selected="selected.includes(p.id)"
            :aria-disabled="(full && !selected.includes(p.id)) || undefined"
            :class="
              cn(
                'flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left outline-none hover:bg-subtle focus-visible:bg-subtle',
                full && !selected.includes(p.id) && 'cursor-not-allowed opacity-50'
              )
            "
            @click="pick(p)"
          >
            <ForenAvatar size="sm" :name="p.name" :initials="initials(p.name)" fallback="initials" />
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2 text-[14px] font-medium text-fg">
                {{ p.name }}
                <span v-if="p.invited" class="rounded-full bg-warning-subtle px-2 py-0.5 text-[11px] font-semibold text-warning">Invite pending</span>
              </span>
              <span class="block truncate text-[12px] text-fg-3">{{ ROLE[p.role] }} · {{ p.email }}</span>
            </span>
            <RiCheckLine v-if="selected.includes(p.id)" class="size-[18px] shrink-0 text-success" aria-hidden="true" />
          </button>
        </div>
        <p v-if="multiple" class="px-3 pb-1 text-[12px] text-fg-3">{{ selected.length }} of {{ max }} selected</p>
        <div class="border-t border-line p-1">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[14px] font-semibold text-fg outline-none hover:bg-subtle focus-visible:bg-subtle"
            @click="
              open = false;
              emit('addNew');
            "
          >
            <RiAddLine class="size-4" aria-hidden="true" />
            Add someone who isn’t on Foren
          </button>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
