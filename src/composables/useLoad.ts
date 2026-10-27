import { ref, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";
import { call } from "@/services/mock/call";

export type LoadStatus = "loading" | "error" | "ready";

/**
 * Loading state for a view, so skeletons and load errors are demonstrable.
 * With the real API, swap the mock `call` for the view's fetch (it should fill the store).
 */
export function useLoad(key: MaybeRefOrGetter<string>): { status: Ref<LoadStatus>; retry: () => void } {
  const status = ref<LoadStatus>("loading");
  const attempt = ref(0);
  watch(
    () => `${toValue(key)}#${attempt.value}`,
    (id, _old, onCleanup) => {
      let alive = true;
      onCleanup(() => (alive = false));
      status.value = "loading";
      call(() => true, { kind: "load" })
        .then(() => alive && id && (status.value = "ready"))
        .catch(() => alive && (status.value = "error"));
    },
    { immediate: true }
  );
  return { status, retry: () => attempt.value++ };
}
