// Pinia plugin: mirrors a store to localStorage so a session survives a refresh, and keeps
// other documents (the phone-sized iframe on desktop, other tabs) in step.
// Opt in per store with `persist: { key, … }` in the store options.
import type { PiniaPluginContext, StateTree } from "pinia";

export type PersistOptions<S extends StateTree = StateTree> = {
  /** localStorage key. Bump the version suffix when the saved shape changes incompatibly. */
  key: string;
  /** State keys that are not saved. */
  omit?: (keyof S)[];
  /** Combine saved state with the fresh initial state (fill in fields added since it was saved). */
  merge?: (saved: Partial<S>, initial: S) => S;
  /** Runs after state is loaded from storage (at start-up or from another document). */
  afterLoad?: (state: S) => void;
};

declare module "pinia" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<S extends StateTree, Store> {
    persist?: PersistOptions<S>;
  }
}

export function persistPlugin({ store, options }: PiniaPluginContext) {
  const opts = options.persist as PersistOptions | undefined;
  if (!opts || typeof window === "undefined") return;

  const load = (raw: string | null) => {
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as StateTree;
      const next = opts.merge ? opts.merge(saved, { ...store.$state }) : { ...store.$state, ...saved };
      store.$patch((s) => Object.assign(s, next));
      opts.afterLoad?.(store.$state);
    } catch {
      /* ignore malformed saves */
    }
  };

  try {
    load(localStorage.getItem(opts.key));
  } catch {
    /* storage unavailable (private mode): run without persistence */
  }

  store.$subscribe(
    (_mutation, state) => {
      const out: StateTree = { ...state };
      for (const k of opts.omit ?? []) delete out[k as string];
      try {
        localStorage.setItem(opts.key, JSON.stringify(out));
      } catch {
        /* quota or unavailable */
      }
    },
    { detached: true }
  );

  window.addEventListener("storage", (e) => {
    if (e.key === opts.key && e.newValue) load(e.newValue);
  });
}
