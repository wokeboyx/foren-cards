"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RiArrowRightLine, RiSearchEyeLine } from "@remixicon/react";
import { ForenSearch, type ForenSearchResult } from "@/components/ui/foren-search";
import { CardArt } from "@/components/card/card-art";
import { MerchantLogo } from "@/components/merchant-logo";
import { MERCHANTS } from "@/fixtures/merchants";
import { can, visibleCards } from "@/lib/permissions";
import { personById, useStore } from "@/lib/store";

const PAGES = [
  { label: "Cards", href: "/cards" },
  { label: "Subscriptions", href: "/subscriptions" },
  { label: "Create card", href: "/cards/new", cap: "issue" as const },
  { label: "Check a merchant", href: "/cards/check-merchant" },
  { label: "Requests", href: "/requests" },
  { label: "Global account", href: "/global-account", cap: "autofx" as const },
  { label: "Spending abroad", href: "/travel" },
];

/** Top-bar search (⌘K): jump to a card, page or merchant check. */
export function GlobalSearch() {
  const router = useRouter();
  const role = useStore((s) => s.role);
  const cards = useStore((s) => s.cards);
  const [q, setQ] = React.useState("");
  const wrap = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        wrap.current?.querySelector("input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const search = (raw: string): ForenSearchResult[] => {
    const s = raw.trim().toLowerCase();
    if (!s) return [];
    const cardHits = visibleCards(role, cards)
      .filter((c) => !c.archived && (c.nickname.toLowerCase().includes(s) || c.last4.includes(s) || personById(c.holderId)?.name.toLowerCase().includes(s)))
      .slice(0, 5)
      .map((c) => ({ value: `card:${c.id}`, label: `${c.nickname} •• ${c.last4}`, description: personById(c.holderId)?.name, icon: <CardArt card={c} size="xs" /> }));
    const pageHits = PAGES.filter((p) => (!p.cap || can(role, p.cap)) && p.label.toLowerCase().includes(s)).map((p) => ({
      value: `page:${p.href}`,
      label: p.label,
      description: "Go to page",
      icon: <RiArrowRightLine className="size-5 text-fg-3" />,
    }));
    const merchantHits = MERCHANTS.filter((m) => m.name.toLowerCase().includes(s))
      .slice(0, 3)
      .map((m) => ({ value: `merchant:${m.id}`, label: `Check ${m.name}`, description: "Will my card work here?", icon: <MerchantLogo merchant={m} size={28} /> }));
    return [...cardHits, ...pageHits, ...merchantHits];
  };

  return (
    <div ref={wrap} className="w-full">
      <ForenSearch
        ariaLabel="Search cards or more"
        size="xs"
        placeholder="Search..."
        value={q}
        onChange={setQ}
        onSearch={search}
        emptyState={
          <span className="flex items-center gap-2 text-[13px] text-fg-3">
            <RiSearchEyeLine className="size-4" aria-hidden /> No matches
          </span>
        }
        onSelect={(r) => {
          setQ("");
          const [kind, id] = [r.value.slice(0, r.value.indexOf(":")), r.value.slice(r.value.indexOf(":") + 1)];
          if (kind === "card") router.push(`/cards/${id}`);
          else if (kind === "page") router.push(id);
          else router.push(`/cards/check-merchant?merchant=${id}`);
        }}
      />
    </div>
  );
}
