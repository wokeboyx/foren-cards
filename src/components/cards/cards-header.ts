export type CardsTab = "manage" | "subscriptions" | "check" | "archived";

export const CARDS_TABS: { value: CardsTab; label: string; href: string }[] = [
  { value: "manage", label: "Manage", href: "/cards" },
  { value: "subscriptions", label: "Subscriptions", href: "/subscriptions" },
  { value: "check", label: "Check a merchant", href: "/cards/check-merchant" },
  { value: "archived", label: "Archived", href: "/cards?view=archived" },
];
