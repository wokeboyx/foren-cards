import type { Card, CardEvent } from "@/domain/types";

/** Card's audit log, newest first. Cards from before logging still show when they were created. */
export function cardEvents(card: Card): CardEvent[] {
  const list = card.history ?? [];
  return list.some((e) => e.text.startsWith("Card created")) ? list : [...list, { at: card.createdAt, text: "Card created", by: "System" }];
}

function when(at: string) {
  const d = new Date(at);
  const today = new Date();
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === today.toDateString() ? `Today, ${time}` : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${time}`;
}

/** Revolut-style "See history": what changed, when, and who did it. */
export function CardHistoryList({ card }: { card: Card }) {
  return (
    <ol className="divide-y divide-line">
      {cardEvents(card).map((e, i) => (
        <li key={`${e.at}-${i}`} className="py-3">
          <div className="text-[14px] leading-[20px] font-medium text-fg">{e.text}</div>
          <div className="mt-0.5 text-[12px] text-fg-3">
            {when(e.at)} · {e.by}
          </div>
        </li>
      ))}
    </ol>
  );
}
