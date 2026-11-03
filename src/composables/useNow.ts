import { computed, onScopeDispose, ref, type ComputedRef } from "vue";
import { useAppStore } from "@/stores/app";

/** The prototype "now", refreshed every `ms` (and when the demo clock moves). */
export function useNow(ms = 1000): ComputedRef<Date> {
  const store = useAppStore();
  const t = ref(Date.now());
  const i = setInterval(() => (t.value = Date.now()), ms);
  onScopeDispose(() => clearInterval(i));
  return computed(() => new Date(t.value + store.demo.clockOffsetMs));
}
