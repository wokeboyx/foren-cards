import { now } from "@/stores/app";

export type CardFormErrors = Partial<Record<"nickname" | "holderId" | "limit" | "permissions", string>>;

export const STEPS: { title: string; desc: string; fields: (keyof CardFormErrors)[] }[] = [
  { title: "Who’s this card for?", desc: "A card in a team member’s name, or a company card for shared spend. Then give it a name your team will recognise.", fields: ["holderId", "nickname"] },
  { title: "Where can it be used?", desc: "Decide whether the card is for one merchant or many. Risky categories are blocked either way.", fields: ["permissions"] },
  { title: "Where does the money come from?", desc: "Cards only pay from your Foren balances. Choose which balance is used first.", fields: [] },
  { title: "How much can it spend?", desc: "Set a spending limit and when the card expires.", fields: ["limit"] },
  { title: "Choose a design and review", desc: "Pick a look for the card, check the summary, then create it.", fields: [] },
];

export function expiryFromYears(years: number) {
  const d = now();
  d.setFullYear(d.getFullYear() + years);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const expiryLabel = (e: string) => {
  const [y, m] = e.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};
