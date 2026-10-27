import { seed } from "@/fixtures/seed";

// Static export (GitHub Pages) pre-builds the sample cards' pages. Cards created in the
// browser are handled by app/not-found.tsx, which renders them on the client.
export function generateStaticParams() {
  return seed().cards.map((c) => ({ cardId: c.id }));
}

export default function CardLayout({ children }: LayoutProps<"/cards/[cardId]">) {
  return children;
}
