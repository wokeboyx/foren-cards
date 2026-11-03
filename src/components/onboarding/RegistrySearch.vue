<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RiCloseLine, RiSearchLine } from "@/components/icons";
import ForenSpinner from "@/components/ui/ForenSpinner.vue";
import { countryInfo, type CountryCode } from "@/domain/onboarding";
import { useOnboardingStore, type Business } from "@/stores/onboarding";
import { cn } from "@/lib/utils";
import ManualLink from "./ManualLink.vue";
import Note from "./Note.vue";
import RegistryCard from "./RegistryCard.vue";
import { fieldCls } from "./frame";
import { sampleMatches } from "./find-business";

const props = defineProps<{ country: CountryCode; result: Business | null }>();
const emit = defineEmits<{ pick: [b: Business]; clear: []; manual: [] }>();

const info = computed(() => countryInfo(props.country)!);
const store = useOnboardingStore();
const query = ref(props.result?.regNumber ?? "");
const results = ref<Business[] | null>(null);
const searching = ref(false);

watch(
  [query, () => props.result, () => props.country, () => store.demo.lookup],
  ([q, result, country, outcome], _old, onCleanup) => {
    if (result || q.trim().length < 3) return;
    let inner: number | undefined;
    const t = window.setTimeout(() => {
      searching.value = true;
      inner = window.setTimeout(() => {
        searching.value = false;
        results.value =
          outcome === "not_found" ? [] : sampleMatches(country, q);
      }, 700);
    }, 300);
    onCleanup(() => {
      window.clearTimeout(t);
      window.clearTimeout(inner);
    });
  },
  { immediate: true },
);

const showList = computed(
  () => !props.result && query.value.trim().length >= 3,
);

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value;
  results.value = null;
  if (props.result) emit("clear");
}
function clearSearch() {
  query.value = "";
  results.value = null;
  emit("clear");
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="relative">
      <label for="company-search" class="sr-only"
        >Company name or registration number</label
      >
      <RiSearchLine
        class="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-fg-3"
        aria-hidden="true"
      />
      <input
        id="company-search"
        type="search"
        autocomplete="off"
        placeholder="Company name or registration number"
        :value="query"
        :class="
          cn(
            fieldCls,
            'bg-surface pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden',
          )
        "
        @input="onInput"
      />
      <button
        v-if="query"
        type="button"
        aria-label="Clear search"
        class="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center rounded-full text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
        @click="clearSearch"
      >
        <RiCloseLine class="size-4" aria-hidden="true" />
      </button>
    </div>

    <div aria-live="polite">
      <RegistryCard
        v-if="result"
        :business="result"
        :registry="info.registry"
        @search-again="clearSearch"
      />
      <p
        v-else-if="showList && (searching || !results)"
        class="flex items-center gap-2 text-[12px] font-medium text-fg-3"
      >
        <ForenSpinner size="sm" /> Searching {{ info.registry }}…
      </p>
      <Note
        v-else-if="showList && results && results.length === 0"
        intent="error"
        :title="`No matches in ${info.registry}`"
      >
        Try the exact registered name or number, or enter your details manually.
      </Note>
      <ul
        v-else-if="showList && results"
        class="overflow-hidden rounded-[12px] bg-surface"
        aria-label="Matching companies"
      >
        <li
          v-for="b in results"
          :key="b.regNumber"
          class="border-b border-line last:border-0"
        >
          <button
            type="button"
            class="flex w-full flex-col gap-0.5 px-4 py-3 text-left outline-none hover:bg-sunken focus-visible:bg-sunken focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset"
            @click="emit('pick', b)"
          >
            <span class="text-[14px] leading-[21px] font-medium text-fg">{{
              b.name
            }}</span>
            <span class="text-[12px] leading-[18px] font-medium text-fg-3"
              >{{ b.regNumber }} · {{ b.companyType }} · {{ b.address }}</span
            >
          </button>
        </li>
      </ul>
    </div>
    <ManualLink v-if="!result" @click="emit('manual')" />
  </div>
</template>
