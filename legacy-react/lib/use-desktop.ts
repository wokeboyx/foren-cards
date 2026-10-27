"use client";
import { useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 1024px)";

/** True on desktop widths, where details open in a right-hand panel instead of a full-screen sheet. */
export function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(desktopQuery);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(desktopQuery).matches,
    () => true
  );
}
