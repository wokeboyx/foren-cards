/** Id of the app shell's scrolling content panel (desktop). On phones, and outside the shell, the window scrolls. */
export const APP_SCROLL_ID = "app-scroll";

/** Scroll the page to the top, whichever element is doing the scrolling. */
export function scrollPageTo(top = 0, behavior: ScrollBehavior = "auto") {
  const panel = typeof document !== "undefined" ? document.getElementById(APP_SCROLL_ID) : null;
  if (panel && panel.scrollHeight > panel.clientHeight) panel.scrollTo({ top, behavior });
  else window.scrollTo({ top, behavior });
}
