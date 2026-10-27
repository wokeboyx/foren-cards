import { useMediaQuery } from "@vueuse/core";

/** True on desktop widths, where details open in a right-hand panel instead of a full-screen sheet. */
export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)", { ssrWidth: 1360 });
}
