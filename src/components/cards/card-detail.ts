export type DialogKind = null | "freeze" | "unfreeze" | "request-unfreeze" | "cancel" | "archive" | "copy" | "limit" | "nickname" | "history" | "limit-request" | "lock" | "unlock" | "period" | "wallet";

export function countdown(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function timeAgo(iso: string, now: Date) {
  const m = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Copies a card detail without spaces. The clipboard may be unavailable in some browsers. */
export async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value.replace(/\s/g, ""));
  } catch {
    /* clipboard may be unavailable in some browsers */
  }
}
