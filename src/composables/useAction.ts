import { ref } from "vue";

/** Wraps an async action with pending/error state. */
export function useAction<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
) {
  const pending = ref(false);
  const error = ref<string | null>(null);
  async function run(
    ...args: A
  ): Promise<{ ok: true; value: R } | { ok: false; value?: undefined }> {
    pending.value = true;
    error.value = null;
    try {
      return { ok: true, value: await fn(...args) };
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed";
      return { ok: false };
    } finally {
      pending.value = false;
    }
  }
  return { run, pending, error, clearError: () => (error.value = null) };
}
