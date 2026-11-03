export type CardsTab = "manage" | "subscriptions" | "archived";

export const CARDS_TABS: { value: CardsTab; label: string; href: string }[] = [
  { value: "manage", label: "Manage", href: "/cards" },
  { value: "archived", label: "Archived", href: "/cards?view=archived" },
];
